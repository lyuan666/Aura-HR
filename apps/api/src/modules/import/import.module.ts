import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateMergeLinkEntity } from '../../entities/candidate-merge-link.entity';
import { CandidateStagingEntity } from '../../entities/candidate-staging.entity';
import { ImportBatchEntity } from '../../entities/import-batch.entity';
import { CandidateModule } from '../candidate/candidate.module';
import { StorageModule } from '../storage/storage.module';
import { ImportController } from './import.controller';
import { ImportDedupeService } from './import-dedupe.service';
import { ImportQualityService } from './import-quality.service';
import { ImportObservabilityService } from './import-observability.service';
import { ImportService } from './import.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ImportBatchEntity,
      CandidateStagingEntity,
      CandidateMergeLinkEntity,
    ]),
    forwardRef(() => CandidateModule),
    StorageModule,
  ],
  controllers: [ImportController],
  providers: [
    ImportService,
    ImportQualityService,
    ImportDedupeService,
    ImportObservabilityService,
  ],
  exports: [ImportService, ImportQualityService, ImportDedupeService],
})
export class ImportModule {}
