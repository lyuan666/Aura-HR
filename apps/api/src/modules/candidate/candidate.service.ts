import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreateCandidateDto } from './candidate.dto';
import { CandidateEntity } from '../../entities/candidate.entity';
import { EmbeddingService } from '../embedding/embedding.service';

@Injectable()
export class CandidateService {
  constructor(
    @InjectRepository(CandidateEntity)
    private readonly candidateRepo: Repository<CandidateEntity>,
    private readonly embeddingService: EmbeddingService,
    @InjectQueue('vectorize') private readonly vectorizeQueue: Queue,
  ) {}

  async findAll(page = 1, pageSize = 20, tenantId?: string) {
    const qb = this.candidateRepo.createQueryBuilder('candidate');
    if (tenantId) {
      qb.where('candidate.tenantId = :tenantId', { tenantId });
    }
    const [items, total] = await qb
      .orderBy('candidate.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: items.map((c) => this.dehydrate(c)),
      total,
      page,
      pageSize,
    };
  }

  private dehydrate(c: CandidateEntity) {
    return {
      id: c.id,
      name: c.name,
      gender: c.gender,
      age: c.age,
      location: c.location,
      phone: c.phone,
      wechat: c.wechat,
      email: c.email,
      tenantId: c.tenantId,
      currentCompany: c.currentCompany,
      currentTitle: c.currentTitle,
      totalYears: c.totalYears,
      degree: c.degree,
      school: c.school,
      major: c.major,
      status: c.status,
      resumeUrl: c.resumeUrl,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      parsedTags: c.parsedTags,
      workExperiences: c.workExperiences,
      educationHistory: c.educationHistory,
      projectExperiences: c.projectExperiences,
      careerExpectations: c.careerExpectations,
    };
  }

  async findOne(id: string, tenantId?: string) {
    const where: any = { id };
    if (tenantId) where.tenantId = tenantId;
    
    const candidate = await this.candidateRepo.findOne({ where });
    if (!candidate) throw new NotFoundException('候选人不存在');
    return this.dehydrate(candidate);
  }

  // 查重并入库
  async create(dto: CreateCandidateDto, tenantId?: string) {
    // Fix: 分离 OR 条件为独立查询，避免全表扫描 + 误判
    // Layer 2: 精确匹配 phone 或 email (各自带 tenantId 过滤)
    if (dto.phone || dto.email) {
      const exactQb = this.candidateRepo.createQueryBuilder('candidate');
      const conditions: string[] = [];
      const params: Record<string, string> = {};

      if (dto.phone) {
        conditions.push('candidate.phone = :phone');
        params.phone = dto.phone;
      }
      if (dto.email) {
        conditions.push('candidate.email = :email');
        params.email = dto.email;
      }

      exactQb.where(`(${conditions.join(' OR ')})`, params);
      if (tenantId) {
        exactQb.andWhere('candidate.tenantId = :tenantId', { tenantId });
      }

      const exactDup = await exactQb.getOne().catch(() => null);
      if (exactDup) {
        throw new ConflictException({
          message: '检测到重复候选人 (手机号或邮箱匹配)',
          data: exactDup,
        });
      }
    }

    // Layer 3: 同平台 + 同姓名 (补充检查，仅在有 phone/email 以外的匹配需求时)
    if (dto.name && dto.sourcePlatform) {
      const nameDup = await this.candidateRepo
        .createQueryBuilder('candidate')
        .where('candidate.name = :name AND candidate.sourcePlatform = :sourcePlatform', {
          name: dto.name,
          sourcePlatform: dto.sourcePlatform,
        })
        .andWhere(tenantId ? 'candidate.tenantId = :tenantId' : '1=1', { tenantId })
        .getOne()
        .catch(() => null);

      if (nameDup) {
        throw new ConflictException({
          message: '检测到重复候选人 (同平台同名)',
          data: nameDup,
        });
      }
    }

    const newCandidate = this.candidateRepo.create({
      ...dto,
      tenantId,
      status: 'new',
    });

    const saved = await this.candidateRepo.save(newCandidate);

    // 触发异步向量化 (BullMQ)
    await this.vectorizeQueue.add(
      'vectorize',
      { candidateId: saved.id, tenantId },
      { jobId: `vec-${saved.id}`, removeOnComplete: { count: 100 } },
    );

    return this.dehydrate(saved);
  }

  async vectorizeCandidate(id: string) {
    const candidate = await this.candidateRepo.findOne({ where: { id } });
    if (!candidate) return;

    // 构造用于 Embedding 的文本：姓名 + 职位 + 公司 + 标签 + 简历全文
    const textParts = [
      candidate.name,
      candidate.currentTitle,
      candidate.currentCompany,
      candidate.resumeText,
    ];

    if (candidate.parsedTags) {
      // 提取关键标签
      const tags = candidate.parsedTags as any;
      if (Array.isArray(tags.skills)) {
        textParts.push((tags.skills as string[]).join(' '));
      }
      if (Array.isArray(tags.tags)) {
        textParts.push((tags.tags as string[]).join(' '));
      }
    }

    const textToEmbed = textParts.filter(Boolean).join(' ').substring(0, 2000);

    if (textToEmbed) {
      const embedding = await this.embeddingService.generateEmbedding(textToEmbed);
      await this.candidateRepo.update(id, { embedding });
    }
  }

  /**
   * 语义搜索候选人 (使用 HNSW 索引)
   */
  async semanticSearch(query: string, tenantId?: string) {
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);
    if (!queryEmbedding || queryEmbedding.length === 0) return [];

    const params: any[] = [JSON.stringify(queryEmbedding)];
    let tenantFilter = '';
    if (tenantId) {
      tenantFilter = 'AND tenant_id = $2';
      params.push(tenantId);
    }

    const candidates = await this.candidateRepo.query(
      `SELECT *, 1 - (embedding <=> $1::vector) AS match_score
       FROM candidates
       WHERE embedding IS NOT NULL ${tenantFilter}
       ORDER BY embedding <=> $1::vector
       LIMIT 20`,
      params,
    );

    return candidates.map((c: any) => ({
      ...c,
      matchScore: Math.round((c.match_score || 0) * 100),
    }));
  }
}
