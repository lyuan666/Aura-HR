import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IMPORT_EVENTS, ImportEventPayload } from './import-events';

@Injectable()
export class ImportObservabilityService {
  private readonly logger = new Logger(ImportObservabilityService.name);

  @OnEvent('import.staging.*')
  handleImportEvent(payload: ImportEventPayload & { event?: string }) {
    this.logImportEvent(payload.event || 'import.staging.unknown', payload);
  }

  logImportEvent(event: string, payload: ImportEventPayload) {
    this.logger.log(
      JSON.stringify({
        event,
        traceId: payload.traceId,
        tenantId: payload.tenantId,
        stagingId: payload.stagingId,
        candidateId: payload.candidateId,
        sourceType: payload.sourceType,
        decision: payload.decision,
        qualityScore: payload.qualityScore,
        errorMessage: payload.errorMessage,
      }),
    );
  }
}

export { IMPORT_EVENTS };
