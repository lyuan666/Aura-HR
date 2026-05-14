import { Injectable } from '@nestjs/common';
import {
  CandidateDedupeInput,
  CandidateDedupeService,
} from '../candidate/candidate-dedupe.service';

@Injectable()
export class ImportDedupeService {
  constructor(private readonly candidateDedupe: CandidateDedupeService) {}

  findDuplicate(input: CandidateDedupeInput) {
    return this.candidateDedupe.findDuplicate({
      tenantId: input.tenantId,
      normalizedPhone: input.normalizedPhone,
      normalizedEmail: input.normalizedEmail,
      textHash: input.textHash,
      fileHash: input.fileHash,
      name: input.name,
      currentCompany: input.currentCompany,
      sourcePlatform: input.sourcePlatform,
    });
  }
}
