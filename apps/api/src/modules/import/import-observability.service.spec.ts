import { Logger } from '@nestjs/common';
import { ImportObservabilityService } from './import-observability.service';
import { IMPORT_EVENTS } from './import-events';

describe('ImportObservabilityService', () => {
  it('logs structured import events', () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const service = new ImportObservabilityService();

    service.logImportEvent(IMPORT_EVENTS.stagingCreated, {
      traceId: 'trace-1',
      tenantId: 't1',
      stagingId: 's1',
      sourceType: 'chrome_extension',
      decision: 'review',
      qualityScore: 45,
    });

    expect(logSpy).toHaveBeenCalledWith(
      JSON.stringify({
        event: IMPORT_EVENTS.stagingCreated,
        traceId: 'trace-1',
        tenantId: 't1',
        stagingId: 's1',
        sourceType: 'chrome_extension',
        decision: 'review',
        qualityScore: 45,
      }),
    );

    logSpy.mockRestore();
  });
});
