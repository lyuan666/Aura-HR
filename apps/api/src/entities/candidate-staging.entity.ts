import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { ImportSourceType } from './import-batch.entity';

export type StagingDecision = 'reject' | 'review' | 'candidate';
export type StagingStatus = 'raw' | 'normalized' | 'deduped' | 'scored' | 'merged' | 'rejected' | 'failed';

@Entity('candidate_staging')
@Index(['tenantId', 'createdAt'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'importDecision'])
@Index(['tenantId', 'normalizedPhone'])
@Index(['tenantId', 'normalizedEmail'])
@Index(['tenantId', 'textHash'])
export class CandidateStagingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', nullable: true })
  @Index()
  tenantId: string;

  @Column({ name: 'batch_id', nullable: true })
  @Index()
  batchId: string;

  @Column({ name: 'trace_id', nullable: true })
  @Index()
  traceId: string;

  @Column({ name: 'source_type' })
  sourceType: ImportSourceType;

  @Column({ name: 'source_platform', nullable: true })
  sourcePlatform: string;

  @Column({ name: 'source_url', type: 'text', nullable: true })
  sourceUrl: string;

  @Column({ name: 'source_record_id', nullable: true })
  sourceRecordId: string;

  @Column({ name: 'raw_payload', type: 'jsonb', default: {} })
  rawPayload: Record<string, unknown>;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ name: 'normalized_phone', nullable: true })
  normalizedPhone: string;

  @Column({ name: 'normalized_email', nullable: true })
  normalizedEmail: string;

  @Column({ name: 'current_company', nullable: true })
  currentCompany: string;

  @Column({ name: 'current_title', nullable: true })
  currentTitle: string;

  @Column({ name: 'resume_text', type: 'text', nullable: true })
  resumeText: string;

  @Column({ name: 'resume_text_truncated', default: false })
  resumeTextTruncated: boolean;

  @Column({ name: 'file_hash', nullable: true })
  fileHash: string;

  @Column({ name: 'staging_file_key', nullable: true })
  stagingFileKey: string;

  @Column({ name: 'text_hash', nullable: true })
  textHash: string;

  @Column({ name: 'quality_score', default: 0 })
  qualityScore: number;

  @Column({ name: 'quality_reasons', type: 'jsonb', default: [] })
  qualityReasons: string[];

  @Column({ default: 'raw' })
  status: StagingStatus;

  @Column({ name: 'import_decision', default: 'review' })
  importDecision: StagingDecision;

  @Column({ name: 'reject_reason', nullable: true })
  rejectReason: string;

  @Column({ name: 'review_reason', nullable: true })
  reviewReason: string;

  @Column({ name: 'matched_candidate_id', nullable: true })
  matchedCandidateId: string;

  @Column({ name: 'created_candidate_id', nullable: true })
  createdCandidateId: string;

  @Column({ name: 'normalized_payload', type: 'jsonb', default: {} })
  normalizedPayload: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
