import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuaranteeService } from './guarantee.service';
import { GuaranteeTrackingEntity } from '../../entities/guarantee-tracking.entity';
import { RecommendationEntity } from '../../entities/recommendation.entity';
import { GuaranteeController } from './guarantee.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([GuaranteeTrackingEntity, RecommendationEntity]),
  ],
  controllers: [GuaranteeController],
  providers: [GuaranteeService],
  exports: [GuaranteeService],
})
export class GuaranteeModule {}
