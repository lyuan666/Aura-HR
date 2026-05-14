import { Module, forwardRef } from '@nestjs/common';
import { CandidateModule } from '../candidate/candidate.module';
import { ImportDedupeService } from './import-dedupe.service';
import { ImportQualityService } from './import-quality.service';

@Module({
  imports: [forwardRef(() => CandidateModule)],
  providers: [ImportQualityService, ImportDedupeService],
  exports: [ImportQualityService, ImportDedupeService],
})
export class ImportModule {}
