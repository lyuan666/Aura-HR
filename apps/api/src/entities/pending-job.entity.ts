import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('pending_jobs')
export class PendingJobEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  type: string; // 'vectorize' | 'match_push'

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ default: 'pending' })
  @Index()
  status: string; // pending/processing/completed/failed

  @Column({ default: 0 })
  attempts: number;

  @Column({ name: 'max_attempts', default: 3 })
  maxAttempts: number;

  @Column({ name: 'next_retry_at', type: 'timestamp', nullable: true })
  nextRetryAt: Date;

  @Column({ name: 'tenant_id', nullable: true })
  @Index()
  tenantId: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
