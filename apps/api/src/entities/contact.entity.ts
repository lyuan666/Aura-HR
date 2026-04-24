import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EnterpriseEntity } from './enterprise.entity';

@Entity('contacts')
export class ContactEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', nullable: true })
  @Index()
  tenantId: string;

  @Column({ name: 'enterprise_id' })
  @Index()
  enterpriseId: string;

  @ManyToOne(() => EnterpriseEntity, (enterprise) => enterprise.contacts)
  @JoinColumn({ name: 'enterprise_id' })
  enterprise: EnterpriseEntity;

  @Column()
  name: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  wechat: string;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
