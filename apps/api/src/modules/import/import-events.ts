export const IMPORT_EVENTS = {
  stagingCreated: 'import.staging.created',
  stagingDuplicate: 'import.staging.duplicate',
  stagingPromoted: 'import.staging.promoted',
  stagingRejected: 'import.staging.rejected',
  stagingFailed: 'import.staging.failed',
} as const;

export interface ImportEventPayload {
  traceId: string;
  tenantId?: string;
  stagingId?: string;
  candidateId?: string;
  sourceType: string;
  decision?: string;
  qualityScore?: number;
  errorMessage?: string;
}
