import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { MatchingService } from '../matching/matching.service';

interface MatchPushData {
  candidateId: string;
  tenantId?: string;
}

@Processor('match-push', {
  lockDuration: 120000,
  concurrency: 5,
})
export class MatchPushProcessor extends WorkerHost {
  private readonly logger = new Logger(MatchPushProcessor.name);

  constructor(
    @Inject(forwardRef(() => MatchingService))
    private readonly matchingService: MatchingService,
  ) {
    super();
  }

  async process(job: Job<MatchPushData>) {
    const { candidateId, tenantId } = job.data;
    this.logger.log(`Running match-push for candidate ${candidateId}`);

    const matches = await this.matchingService.findBestMatchesForCandidate(candidateId, tenantId);

    if (matches.length > 0) {
      this.logger.log(`Found ${matches.length} matches for candidate ${candidateId}`);
      // TODO: 微信/邮件通知
      for (const match of matches) {
        this.logger.log(`MATCH: Candidate ${candidateId} ↔ Job ${match.job.id} score=${match.score}`);
      }
    }
  }
}
