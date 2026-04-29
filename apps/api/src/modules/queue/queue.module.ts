import { Module, Global, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ParseResumeProcessor } from './parse-resume.processor';
import { VectorizeProcessor } from './vectorize.processor';
import { JobEnhanceProcessor } from './job-enhance.processor';
import { MatchPushProcessor } from './match-push.processor';
import { AiModule } from '../ai/ai.module';
import { CandidateModule } from '../candidate/candidate.module';
import { JobModule } from '../job/job.module';
import { MatchingModule } from '../matching/matching.module';
import { CandidateEntity } from '../../entities/candidate.entity';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redisUrl = new URL(REDIS_URL);

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: redisUrl.hostname || 'localhost',
        port: parseInt(redisUrl.port || '6379', 10),
        password: redisUrl.password || undefined,
      },
      defaultJobOptions: {
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    }),
    BullModule.registerQueue(
      { name: 'parse-resume' },
      { name: 'vectorize' },
      { name: 'job-enhance' },
      { name: 'match-push' },
    ),
    TypeOrmModule.forFeature([CandidateEntity]),
    forwardRef(() => AiModule),
    forwardRef(() => CandidateModule),
    forwardRef(() => JobModule),
    forwardRef(() => MatchingModule),
  ],
  providers: [ParseResumeProcessor, VectorizeProcessor, JobEnhanceProcessor, MatchPushProcessor],
  exports: [BullModule],
})
export class QueueModule {}
