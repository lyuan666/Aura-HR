import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('candidate_merge_links')
@Index(['tenantId', 'stagingCandidateId'])
@Index(['tenantId', 'candidateId'])
export class CandidateMergeLinkEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', nullable: true })
  @Index()
  tenantId: string;

  @Column({ name: 'staging_candidate_id' })
  stagingCandidateId: string;

  @Column({ name: 'candidate_id' })
  candidateId: string;

  @Column({ name: 'match_type' })
  matchType: 'phone' | 'email' | 'text_hash' | 'file_hash' | 'name_source' | 'name_company' | 'manual';

  @Column({ type: 'decimal', precision: 4, scale: 2, default: 0 })
  confidence: number;

  @Column({ name: 'operator_id', nullable: true })
  operatorId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
