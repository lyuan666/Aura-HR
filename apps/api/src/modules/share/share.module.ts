import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShareService } from './share.service';
import { ShareController } from './share.controller';
import { ShareLinkEntity } from '../../entities/share-link.entity';
import { RecommendationEntity } from '../../entities/recommendation.entity';
import { CandidateEntity } from '../../entities/candidate.entity';
import { JobPositionEntity } from '../../entities/job-position.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ShareLinkEntity,
      RecommendationEntity,
      CandidateEntity,
      JobPositionEntity,
    ]),
  ],
  controllers: [ShareController],
  providers: [ShareService],
})
export class ShareModule {}
