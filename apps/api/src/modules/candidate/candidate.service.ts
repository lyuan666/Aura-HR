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
import { CandidateDedupeService } from './candidate-dedupe.service';

@Injectable()
export class CandidateService {
  constructor(
    @InjectRepository(CandidateEntity)
    private readonly candidateRepo: Repository<CandidateEntity>,
    private readonly embeddingService: EmbeddingService,
    private readonly candidateDedupe: CandidateDedupeService,
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
    const duplicate = await this.candidateDedupe.findDuplicate({
      tenantId,
      normalizedPhone: dto.phone,
      normalizedEmail: dto.email,
      name: dto.name,
      currentCompany: dto.currentCompany,
      sourcePlatform: dto.sourcePlatform,
    });

    if (duplicate.status === 'duplicate') {
      throw new ConflictException({
        message: this.getDuplicateMessage(duplicate.matchType),
        data: duplicate.candidate ?? { id: duplicate.candidateId },
      });
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

  private getDuplicateMessage(matchType: string) {
    const labelMap: Record<string, string> = {
      phone: '手机号匹配',
      email: '邮箱匹配',
      text_hash: '简历文本匹配',
      file_hash: '文件匹配',
      name_source: '同平台同名',
      name_company: '同公司同名',
    };
    return `检测到重复候选人 (${labelMap[matchType] || matchType})`;
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
