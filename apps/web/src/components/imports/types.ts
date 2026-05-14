export type StagingDecision = 'reject' | 'review' | 'candidate';

export interface ImportBatch {
  id: string;
  sourceType: string;
  sourceName?: string;
  status: string;
  totalCount?: number;
  acceptedCount?: number;
  reviewCount?: number;
  rejectedCount?: number;
  duplicateCount?: number;
  createdAt?: string;
}

export interface StagingCandidate {
  id: string;
  traceId?: string;
  sourceType: string;
  sourcePlatform?: string;
  sourceUrl?: string;
  name?: string;
  phone?: string;
  email?: string;
  currentCompany?: string;
  currentTitle?: string;
  resumeText?: string;
  rawPayload?: Record<string, unknown>;
  normalizedPayload?: Record<string, unknown>;
  qualityScore: number;
  qualityReasons?: string[];
  status: string;
  importDecision: StagingDecision;
  matchedCandidateId?: string;
  createdCandidateId?: string;
  rejectReason?: string;
  reviewReason?: string;
  createdAt?: string;
  updatedAt?: string;
}
