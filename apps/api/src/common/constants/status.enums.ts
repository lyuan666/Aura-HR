/**
 * 状态枚举常量 — 所有实体的状态值统一定义
 */

// ========== Candidate ==========
export const CandidateStatus = {
  NEW: 'new',
  ACTIVE: 'active',
  IN_PROCESS: 'in_process',
  OFFERED: 'offered',
  PLACED: 'placed',
  INACTIVE: 'inactive',
} as const;
export type CandidateStatusType = (typeof CandidateStatus)[keyof typeof CandidateStatus];

// ========== JobPosition ==========
export const JobStatus = {
  PENDING: 'pending',
  MATCHING: 'matching',
  RECOMMENDING: 'recommending',
  INTERVIEWING: 'interviewing',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
} as const;
export type JobStatusType = (typeof JobStatus)[keyof typeof JobStatus];

// ========== Recommendation ==========
export const RecStatus = {
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  REVIEWING: 'reviewing',
  INTERVIEW_SCHEDULED: 'interview_scheduled',
  INTERVIEWED: 'interviewed',
  OFFER_SENT: 'offer_sent',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const;
export type RecStatusType = (typeof RecStatus)[keyof typeof RecStatus];

// ========== Enterprise ==========
export const EnterpriseStatus = {
  POTENTIAL: 'potential',
  FOLLOWING: 'following',
  NEGOTIATING: 'negotiating',
  SIGNED: 'signed',
  CHURNED: 'churned',
} as const;
export type EnterpriseStatusType = (typeof EnterpriseStatus)[keyof typeof EnterpriseStatus];

// ========== Contract ==========
export const ContractStatus = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  TERMINATED: 'terminated',
} as const;
export type ContractStatusType = (typeof ContractStatus)[keyof typeof ContractStatus];

// ========== Invoice ==========
export const InvoiceStatus = {
  PENDING: 'pending',
  ISSUED: 'issued',
  SENT: 'sent',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const;
export type InvoiceStatusType = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

// ========== GuaranteeTracking ==========
export const GuaranteeStatus = {
  TRACKING: 'tracking',
  FINISHED: 'finished',
  FAILED: 'failed',
} as const;
export type GuaranteeStatusType = (typeof GuaranteeStatus)[keyof typeof GuaranteeStatus];
