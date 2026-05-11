import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { MatchingService } from '../matching/matching.service';
import { NotificationService } from '../notification/notification.service';
import { InjectRepository } from '@nestjs/typeorm';
import { CandidateEntity } from '../../entities/candidate.entity';
import { Repository } from 'typeorm';

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
    private readonly notificationService: NotificationService,
    @InjectRepository(CandidateEntity)
    private readonly candidateRepo: Repository<CandidateEntity>,
  ) {
    super();
  }

  async process(job: Job<MatchPushData>) {
    const { candidateId, tenantId } = job.data;
    this.logger.log(`Running match-push for candidate ${candidateId}`);

    const matches = await this.matchingService.findBestMatchesForCandidate(candidateId, tenantId);

    if (matches.length > 0) {
      this.logger.log(`Found ${matches.length} matches for candidate ${candidateId}`);
      
      const candidate = await this.candidateRepo.findOne({ where: { id: candidateId } });
      if (!candidate) return;

      // 为最高分的一个匹配发送通知（或者循环发送，但建议限频）
      const bestMatch = matches[0];
      
      await this.notificationService.notify(tenantId || 'default', 'match_notification', {
        candidateId,
        candidateName: candidate.name,
        jobTitle: bestMatch.job.title,
        score: bestMatch.score,
        highlights: `核心技能匹配度: ${bestMatch.score}%`,
      });

      for (const match of matches) {
        this.logger.log(`MATCH: Candidate ${candidateId} ↔ Job ${match.job.id} score=${match.score}`);
      }
    }
  }
}
