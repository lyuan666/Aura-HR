import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { CandidateController } from './candidate.controller';
import { CandidateService } from './candidate.service';
import { CandidateEntity } from '../../entities/candidate.entity';
import { AiModule } from '../ai/ai.module';
import { EmbeddingModule } from '../embedding/embedding.module';
import { ProgressService } from './progress.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CandidateEntity]),
    AiModule,
    EmbeddingModule,
    StorageModule,
    JwtModule.register({}),
    BullModule.registerQueue({ name: 'vectorize' }, { name: 'parse-resume' }),
  ],
  controllers: [CandidateController],
  providers: [CandidateService, ProgressService],
  exports: [CandidateService, ProgressService],
})
export class CandidateModule {}
