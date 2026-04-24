import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { CreateCandidateDto } from './candidate.dto';
import { CandidateEntity } from '../../entities/candidate.entity';
import { EmbeddingService } from '../embedding/embedding.service';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class CandidateService {
  constructor(
    @InjectRepository(CandidateEntity)
    private readonly candidateRepo: Repository<CandidateEntity>,
    private readonly embeddingService: EmbeddingService,
    private readonly queueService: QueueService,
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

    return { items, total, page, pageSize };
  }

  async findOne(id: string, tenantId?: string) {
    const where: any = { id };
    if (tenantId) where.tenantId = tenantId;
    
    const candidate = await this.candidateRepo.findOne({ where });
    if (!candidate) throw new NotFoundException('候选人不存在');
    return candidate;
  }

  // 查重并入库
  async create(dto: CreateCandidateDto, tenantId?: string) {
    const qb = this.candidateRepo.createQueryBuilder('candidate');

    // 查重逻辑：优先查是否有同平台的同样名字的人，或者同样 phone/email
    qb.where(
      new Brackets((qb2) => {
        qb2.where(
          'candidate.name = :name AND candidate.sourcePlatform = :sourcePlatform',
          {
            name: dto.name || '未命名',
            sourcePlatform: dto.sourcePlatform || 'manual',
          },
        );
        if (dto.phone) {
          qb2.orWhere('candidate.phone = :phone', { phone: dto.phone });
        }
        if (dto.email) {
          qb2.orWhere('candidate.email = :email', { email: dto.email });
        }
      }),
    );

    if (tenantId) {
      qb.andWhere('candidate.tenantId = :tenantId', { tenantId });
    }

    const duplicate = await qb.getOne().catch(() => null);

    if (duplicate) {
      throw new ConflictException({
        message: '检测到重复候选人',
        data: duplicate,
      });
    }

    const newCandidate = this.candidateRepo.create({
      ...dto,
      tenantId,
      status: 'new',
    });

    const saved = await this.candidateRepo.save(newCandidate);

    // 触发持久化异步向量化
    await this.queueService.enqueue('vectorize', { candidateId: saved.id }, tenantId);

    return saved;
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
   * 语义搜索候选人
   */
  async semanticSearch(query: string, tenantId?: string) {
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);
    if (!queryEmbedding || queryEmbedding.length === 0) return [];

    const tenantFilter = tenantId ? 'AND tenant_id = $2' : '';
    const params = [JSON.stringify(queryEmbedding)];
    if (tenantId) params.push(tenantId);

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
