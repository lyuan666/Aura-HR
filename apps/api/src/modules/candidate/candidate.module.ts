import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { CandidateController } from './candidate.controller';
import { CandidateService } from './candidate.service';
import { CandidateDedupeService } from './candidate-dedupe.service';
import { CandidateEntity } from '../../entities/candidate.entity';
import { AiModule } from '../ai/ai.module';
import { EmbeddingModule } from '../embedding/embedding.module';
import { ProgressService } from './progress.service';
import { FeishuService } from './feishu.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CandidateEntity]),
    AiModule,
    EmbeddingModule,
    StorageModule,
    BullModule.registerQueue({ name: 'vectorize' }, { name: 'parse-resume' }),
  ],
  controllers: [CandidateController],
  providers: [CandidateService, CandidateDedupeService, ProgressService, FeishuService],
  exports: [CandidateService, CandidateDedupeService, ProgressService, FeishuService],
})
export class CandidateModule {}
