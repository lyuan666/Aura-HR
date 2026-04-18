import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('follow_ups')
export class FollowUpEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'target_type',
    type: 'enum',
    enum: ['candidate', 'enterprise'],
  })
  targetType: string;

  @Column({ name: 'target_id' })
  targetId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'next_follow_up_at', nullable: true })
  nextFollowUpAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
