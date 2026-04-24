import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', nullable: true })
  @Index()
  tenantId: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column()
  @Index()
  action: string;

  @Column()
  resource: string;

  @Column({ name: 'resource_id', nullable: true })
  @Index()
  resourceId: string;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any>;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
