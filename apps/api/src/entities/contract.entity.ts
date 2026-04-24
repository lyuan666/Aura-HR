import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('contracts')
export class ContractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', nullable: true })
  @Index()
  tenantId: string;

  @Column({ name: 'enterprise_id' })
  @Index()
  enterpriseId: string;

  @Column({ name: 'contract_no', unique: true })
  contractNo: string;

  @Column()
  title: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: ['draft', 'pending_approval', 'active', 'completed', 'terminated'],
    default: 'draft',
  })
  @Index()
  status: string;

  @Column({ name: 'file_url', nullable: true })
  fileUrl: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
