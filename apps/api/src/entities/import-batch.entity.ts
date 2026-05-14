import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type ImportSourceType = 'legacy_db' | 'chrome_extension' | 'manual_upload';
export type ImportBatchStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

@Entity('import_batches')
@Index(['tenantId', 'createdAt'])
@Index(['tenantId', 'status'])
export class ImportBatchEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', nullable: true })
  @Index()
  tenantId: string;

  @Column({ name: 'source_type' })
  sourceType: ImportSourceType;

  @Column({ name: 'source_name', nullable: true })
  sourceName: string;

  @Column({ name: 'operator_id', nullable: true })
  operatorId: string;

  @Column({ name: 'trace_id', nullable: true })
  @Index()
  traceId: string;

  @Column({ default: 'pending' })
  status: ImportBatchStatus;

  @Column({ name: 'total_count', default: 0 })
  totalCount: number;

  @Column({ name: 'accepted_count', default: 0 })
  acceptedCount: number;

  @Column({ name: 'review_count', default: 0 })
  reviewCount: number;

  @Column({ name: 'rejected_count', default: 0 })
  rejectedCount: number;

  @Column({ name: 'duplicate_count', default: 0 })
  duplicateCount: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
