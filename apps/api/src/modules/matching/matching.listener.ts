import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { QueueService } from '../queue/queue.service';
import { CandidateService } from '../candidate/candidate.service';
import { MatchingService } from './matching.service';
import { JobService } from '../job/job.service';
import { PendingJobEntity } from '../../entities/pending-job.entity';

@Injectable()
export class MatchingListener {
  private readonly logger = new Logger(MatchingListener.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly candidateService: CandidateService,
    private readonly matchingService: MatchingService,
    @Inject(forwardRef(() => JobService))
    private readonly jobService: JobService,
  ) {}

  @OnEvent('job.vectorize')
  async handleVectorizeJob(job: PendingJobEntity) {
    const { candidateId } = job.payload;
    this.logger.log(`Processing vectorize job for candidate: ${candidateId}`);
    
    try {
      await this.candidateService.vectorizeCandidate(candidateId);
      await this.queueService.markComplete(job.id);
      
      // 触发匹配推送任务
      await this.queueService.enqueue('match_push', { candidateId }, job.tenantId);
    } catch (error) {
      this.logger.error(`Vectorize job failed: ${error.message}`);
      await this.queueService.markFailed(job.id, error.message);
    }
  }

  @OnEvent('job.match_push')
  async handleMatchPushJob(job: PendingJobEntity) {
    const { candidateId } = job.payload;
    this.logger.log(`Processing match_push job for candidate: ${candidateId}`);

    try {
      const matches = await this.matchingService.findBestMatchesForCandidate(candidateId, job.tenantId);
      
      if (matches.length > 0) {
        this.logger.log(`Found ${matches.length} high-score matches for candidate ${candidateId}`);
        // TODO: 这里实现真正的通知逻辑 (微信/邮件)
        // 目前仅打印日志
        for (const match of matches) {
          this.logger.log(`MATCH FOUND: Candidate ${candidateId} matches Job ${match.job.id} with score ${match.score}`);
        }
      }
      
      await this.queueService.markComplete(job.id);
    } catch (error) {
      this.logger.error(`Match push job failed: ${error.message}`);
      await this.queueService.markFailed(job.id, error.message);
    }
  }

  @OnEvent('job.job_enhance')
  async handleJobEnhanceJob(job: PendingJobEntity) {
    const { jobId, description } = job.payload;
    this.logger.log(`Processing job_enhance job for job: ${jobId}`);

    try {
      await this.jobService.enhanceJobAsync(jobId, description);
      await this.queueService.markComplete(job.id);
    } catch (error) {
      this.logger.error(`Job enhance job failed: ${error.message}`);
      await this.queueService.markFailed(job.id, error.message);
    }
  }
}
