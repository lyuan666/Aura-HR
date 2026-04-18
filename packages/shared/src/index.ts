// ============================================
// 猎头公司管理智能系统 - 共享类型定义
// ============================================

// ---- 用户与权限 ----

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  CONSULTANT = 'consultant',
  HR_CLIENT = 'hr_client',
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---- 候选人 ----

export enum CandidateStatus {
  NEW = 'new',
  ACTIVE = 'active',
  IN_PROCESS = 'in_process',
  OFFERED = 'offered',
  PLACED = 'placed',
  INACTIVE = 'inactive',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  UNKNOWN = 'unknown',
}

export interface CandidateContact {
  phone?: string;
  wechat?: string;
  email?: string;
}

export interface CandidateEducation {
  degree: string;
  school: string;
  major: string;
}

export interface CandidateParsedTags {
  industry: string[];
  roles: string[];
  hardSkills: string[];
  softSkills: string[];
  seniorityYears: number;
  stabilityScore: number;
  jobChangeFrequency: number;
}

export interface CandidateSource {
  platform: string;
  importedBy: string;
  extensionVersion?: string;
  importedAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  gender: Gender;
  age?: number;
  location?: string;
  contact: CandidateContact;
  currentCompany?: string;
  currentTitle?: string;
  totalYears?: number;
  currentSalary?: number;
  expectedSalary?: number;
  education?: CandidateEducation;
  parsedTags: CandidateParsedTags;
  source: CandidateSource;
  status: CandidateStatus;
  resumeUrl?: string;
  notes?: string;
  lastContactedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- 企业客户 ----

export enum EnterpriseStatus {
  POTENTIAL = 'potential',
  FOLLOWING = 'following',
  NEGOTIATING = 'negotiating',
  SIGNED = 'signed',
  CHURNED = 'churned',
}

export interface Enterprise {
  id: string;
  name: string;
  industry: string;
  scale?: string;
  address?: string;
  website?: string;
  description?: string;
  status: EnterpriseStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ---- 联系人 ----

export interface Contact {
  id: string;
  enterpriseId: string;
  name: string;
  title?: string;
  phone?: string;
  email?: string;
  wechat?: string;
  isPrimary: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- 岗位需求 ----

export enum JobStatus {
  PENDING = 'pending',
  MATCHING = 'matching',
  RECOMMENDING = 'recommending',
  INTERVIEWING = 'interviewing',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

export enum JobUrgency {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface JobPosition {
  id: string;
  enterpriseId: string;
  title: string;
  department?: string;
  description: string;
  requirements?: string;
  salaryMin?: number;
  salaryMax?: number;
  location?: string;
  headcount: number;
  urgency: JobUrgency;
  status: JobStatus;
  skillTags: string[];
  difficultyScore?: number;
  createdAt: string;
  updatedAt: string;
}

// ---- 推荐记录 ----

export enum RecommendationStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  REVIEWING = 'reviewing',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  INTERVIEWED = 'interviewed',
  OFFER_SENT = 'offer_sent',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export interface Recommendation {
  id: string;
  candidateId: string;
  jobPositionId: string;
  consultantId: string;
  matchScore?: number;
  status: RecommendationStatus;
  aiReportUrl?: string;
  feedback?: string;
  interviewDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- 合同 ----

export enum ContractStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  TERMINATED = 'terminated',
}

export interface Contract {
  id: string;
  enterpriseId: string;
  contractNo: string;
  title: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  fileUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- 发票 ----

export enum InvoiceStatus {
  PENDING = 'pending',
  ISSUED = 'issued',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export interface Invoice {
  id: string;
  contractId: string;
  invoiceNo: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  status: InvoiceStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- 跟进记录 ----

export enum FollowUpType {
  CANDIDATE = 'candidate',
  ENTERPRISE = 'enterprise',
}

export interface FollowUp {
  id: string;
  targetType: FollowUpType;
  targetId: string;
  userId: string;
  content: string;
  nextFollowUpAt?: string;
  createdAt: string;
}

// ---- 操作日志 ----

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

// ---- 通用类型 ----

export interface PaginationQuery {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
