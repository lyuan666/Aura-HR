import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('contract_audit_logs')
export class ContractAuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'contract_id', type: 'uuid', nullable: true })
  @Index()
  contractId: string | null;

  @Column({ name: 'generation_id', type: 'uuid', nullable: true })
  @Index()
  generationId: string | null;

  @Column({ name: 'operator_id', type: 'uuid' })
  @Index()
  operatorId: string;

  @Column()
  action: string; // 'create', 'update', 'formalize', 'renew', 'terminate'

  @Column({ type: 'jsonb', default: {} })
  details: Record<string, any>; // { "diff": {...}, "notes": "..." }

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;
}
