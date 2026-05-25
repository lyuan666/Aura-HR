import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidateEntity } from '../../entities/candidate.entity';
import { EmbeddingService } from '../embedding/embedding.service';

interface VectorizeJobData {
  candidateId: string;
  tenantId?: string;
}

@Processor('vectorize', {
  lockDuration: 120000, // 2 min
  concurrency: 5,
})
export class VectorizeProcessor extends WorkerHost {
  private readonly logger = new Logger(VectorizeProcessor.name);

  constructor(
    @InjectRepository(CandidateEntity)
    private readonly candidateRepo: Repository<CandidateEntity>,
    private readonly embeddingService: EmbeddingService,
    @InjectQueue('match-push') private readonly matchPushQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<VectorizeJobData>) {
    try {
      const { candidateId, tenantId } = job.data;

      const candidate = await this.candidateRepo.findOne({ where: { id: candidateId } });
      if (!candidate) {
        this.logger.warn(`Candidate ${candidateId} not found, skipping vectorization`);
        return;
      }

      // 用简历文本生成摘要用于向量化
      const text = candidate.resumeText || [
        candidate.name,
        candidate.currentCompany,
        candidate.currentTitle,
        candidate.school,
        candidate.major,
        Array.isArray(candidate.parsedTags?.skills) ? candidate.parsedTags.skills.join(', ') : '',
      ].filter(Boolean).join(' ');

      if (!text || text.trim().length < 10) {
        this.logger.warn(`Candidate ${candidateId} has insufficient text for vectorization`);
        return;
      }

      const embedding = await this.embeddingService.generateEmbedding(text);

      // 更新候选人的 embedding 向量 (参数化防 SQL 注入)
      await this.candidateRepo.query(
        `UPDATE candidates SET embedding = $1::vector WHERE id = $2`,
        [JSON.stringify(embedding), candidateId],
      );

      this.logger.log(`Vectorized candidate ${candidateId} (${embedding.length} dims)`);

      // 向量化完成后触发匹配推送
      await this.matchPushQueue.add(
        'match-push',
        { candidateId, tenantId },
        { jobId: `match-${candidateId}`, removeOnComplete: { count: 100 } },
      );
    } catch (error: any) {
      this.logger.error('向量化处理失败', error.stack || error.message);
      throw error;
    }
  }
}
