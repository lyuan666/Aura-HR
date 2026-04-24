import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { LlmClientService } from './llm-client.service';
import { ParsingService } from './parsing.service';
import { InsightService } from './insight.service';

@Module({
  controllers: [AiController],
  providers: [AiService, LlmClientService, ParsingService, InsightService],
  exports: [AiService, LlmClientService, ParsingService, InsightService],
})
export class AiModule {}
