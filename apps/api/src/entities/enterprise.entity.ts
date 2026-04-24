import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ContactEntity } from './contact.entity';

@Entity('enterprises')
export class EnterpriseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', nullable: true })
  @Index()
  tenantId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  industry: string;

  @Column({ nullable: true })
  scale: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  website: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['potential', 'following', 'negotiating', 'signed', 'churned'],
    default: 'potential',
  })
  @Index()
  status: string;

  @Column({ type: 'jsonb', default: [] })
  tags: string[];

  @OneToMany(() => ContactEntity, (contact) => contact.enterprise)
  contacts: ContactEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
