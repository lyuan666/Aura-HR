import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { JobPositionEntity } from '../../entities/job-position.entity';
import { AiModule } from '../ai/ai.module';
import { EmbeddingModule } from '../embedding/embedding.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobPositionEntity]),
    AiModule,
    EmbeddingModule,
    BullModule.registerQueue({ name: 'job-enhance' }),
  ],
  controllers: [JobController],
  providers: [JobService],
  exports: [JobService],
})
export class JobModule {}
