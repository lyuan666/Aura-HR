import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull } from 'typeorm';
import { PendingJobEntity } from '../../entities/pending-job.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectRepository(PendingJobEntity)
    private readonly jobRepo: Repository<PendingJobEntity>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async enqueue(type: string, payload: any, tenantId?: string) {
    const job = this.jobRepo.create({
      type,
      payload,
      tenantId,
      status: 'pending',
    });
    const saved = await this.jobRepo.save(job);
    
    // 实时尝试执行
    this.eventEmitter.emit(`job.${type}`, saved);
    
    return saved;
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async retryStuckJobs() {
    this.logger.log('Scanning for stuck or pending jobs...');
    
    // 使用 SKIP LOCKED 确保多节点并发安全
    const jobs = await this.jobRepo.query(`
      SELECT * FROM pending_jobs
      WHERE status IN ('pending', 'processing')
        AND (next_retry_at IS NULL OR next_retry_at <= NOW())
        AND attempts < max_attempts
      FOR UPDATE SKIP LOCKED
      LIMIT 10
    `);

    if (jobs.length > 0) {
      this.logger.log(`Found ${jobs.length} jobs to retry/process`);
      for (const job of jobs as any[]) {
        this.eventEmitter.emit(`job.${job.type}`, job);
      }
    }
  }

  async markComplete(id: string) {
    await this.jobRepo.update(id, {
      status: 'completed',
    });
  }

  async markFailed(id: string, error: string) {
    const job = await this.jobRepo.findOne({ where: { id } });
    if (!job) return;

    const nextRetry = new Date();
    nextRetry.setMinutes(nextRetry.getMinutes() + 5 * (job.attempts + 1));

    await this.jobRepo.update(id, {
      status: 'pending',
      attempts: job.attempts + 1,
      errorMessage: error,
      nextRetryAt: nextRetry,
    });
  }
}
