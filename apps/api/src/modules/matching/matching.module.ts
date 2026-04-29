import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { CandidateEntity } from '../../entities/candidate.entity';
import { JobPositionEntity } from '../../entities/job-position.entity';
import { AiModule } from '../ai/ai.module';
import { CandidateModule } from '../candidate/candidate.module';
import { JobModule } from '../job/job.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CandidateEntity, JobPositionEntity]),
    AiModule,
    forwardRef(() => CandidateModule),
    forwardRef(() => JobModule),
  ],
  controllers: [MatchingController],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
