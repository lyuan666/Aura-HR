import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCandidateDto } from './candidate.dto';
import { CandidateEntity } from '../../entities/candidate.entity';
import { EmbeddingService } from '../embedding/embedding.service';
import { cosineSimilarity } from '../../common/utils/similarity';

@Injectable()
export class CandidateService {
  constructor(
    @InjectRepository(CandidateEntity)
    private readonly candidateRepo: Repository<CandidateEntity>,
    private readonly embeddingService: EmbeddingService,
  ) {}

  findAll() {
    return this.candidateRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const candidate = await this.candidateRepo.findOne({ where: { id } });
    if (!candidate) throw new NotFoundException('候选人不存在');
    return candidate;
  }

  // 查重并入库
  async create(dto: CreateCandidateDto) {
    const qb = this.candidateRepo.createQueryBuilder('candidate');

    // 查重逻辑：优先查是否有同平台的同样名字的人，或者同样 phone/email
    qb.where(
      '(candidate.name = :name AND candidate.sourcePlatform = :sourcePlatform)',
      { 
        name: dto.name || '未命名', 
        sourcePlatform: dto.sourcePlatform || 'manual' 
      },
    );
    if (dto.phone) {
      qb.orWhere('candidate.phone = :phone', { phone: dto.phone });
    }
    if (dto.email) {
      qb.orWhere('candidate.email = :email', { email: dto.email });
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
      status: 'new',
    });

    const saved = await this.candidateRepo.save(newCandidate);

    // 触发异步向量化
    this.vectorizeCandidate(saved.id).catch((err) =>
      console.error(`Candidate ${saved.id} vectorization failed:`, err),
    );

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
  async semanticSearch(query: string) {
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);
    const candidates = await this.candidateRepo.find();

    const results = candidates.map((c) => {
      let score = 0;
      if (c.embedding && queryEmbedding) {
        score = cosineSimilarity(queryEmbedding, c.embedding);
      }
      return {
        ...c,
        matchScore: Math.round(score * 100),
      };
    });

    return results
      .filter((r) => r.matchScore > 20)
      .sort((a, b) => b.matchScore - a.matchScore);
  }
}
