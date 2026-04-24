import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('follow_ups')
export class FollowUpEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', nullable: true })
  @Index()
  tenantId: string;

  @Column({
    name: 'target_type',
    type: 'enum',
    enum: ['candidate', 'enterprise'],
  })
  @Index()
  targetType: string;

  @Column({ name: 'target_id' })
  @Index()
  targetId: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'next_follow_up_at', nullable: true })
  nextFollowUpAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
