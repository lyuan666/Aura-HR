import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractEntity, ContractTemplateEntity, ContractGenerationEntity, AuditLogEntity } from '../../entities';
import { ContractController } from './contract.controller';
import { ContractService } from './contract.service';
import { ContractTemplateController } from './contract-template.controller';
import { ContractTemplateService } from './contract-template.service';
import { ContractGenerationController } from './contract-generation.controller';
import { ContractGenerationService } from './contract-generation.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    AiModule,
    TypeOrmModule.forFeature([
      ContractEntity,
      ContractTemplateEntity,
      ContractGenerationEntity,
      AuditLogEntity,
    ]),
  ],
  controllers: [
    ContractTemplateController,
    ContractGenerationController,
    ContractController,
  ],
  providers: [
    ContractService,
    ContractTemplateService,
    ContractGenerationService,
  ],
  exports: [
    ContractService,
    ContractTemplateService,
    ContractGenerationService,
  ],
})
export class ContractModule {}
