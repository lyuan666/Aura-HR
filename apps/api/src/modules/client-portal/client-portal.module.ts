import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientPortalService } from './client-portal.service';
import { ClientPortalController } from './client-portal.controller';
import { JobPositionEntity } from '../../entities/job-position.entity';
import { RecommendationEntity } from '../../entities/recommendation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobPositionEntity, RecommendationEntity]),
  ],
  providers: [ClientPortalService],
  controllers: [ClientPortalController],
})
export class ClientPortalModule {}
