import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('invoices')
export class InvoiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', nullable: true })
  @Index()
  tenantId: string;

  @Column({ name: 'contract_id' })
  @Index()
  contractId: string;

  @Column({ name: 'invoice_no', unique: true })
  invoiceNo: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ name: 'issue_date', type: 'date' })
  issueDate: Date;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  @Column({ name: 'paid_date', type: 'date', nullable: true })
  paidDate: Date;

  @Column({
    type: 'enum',
    enum: ['pending', 'issued', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'pending',
  })
  @Index()
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
