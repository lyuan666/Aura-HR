import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { LlmClientService } from './llm-client.service';
import { ParsingService } from './parsing.service';
import { InsightService } from './insight.service';
import { LlmRouterService } from './llm-router.service';
import { PdfExtractionService } from './pdf-extraction.service';
import { ParsingV2Service } from './parsing-v2.service';
import { CandidateEntity } from '../../entities/candidate.entity';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule, TypeOrmModule.forFeature([CandidateEntity])],
  controllers: [AiController],
  providers: [
    AiService,
    LlmClientService,
    ParsingService,
    InsightService,
    LlmRouterService,
    PdfExtractionService,
    ParsingV2Service,
  ],
  exports: [
    AiService,
    LlmClientService,
    ParsingService,
    InsightService,
    LlmRouterService,
    PdfExtractionService,
    ParsingV2Service,
  ],
})
export class AiModule {}
