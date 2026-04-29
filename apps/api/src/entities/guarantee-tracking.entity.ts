import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { RecommendationEntity } from './recommendation.entity';

@Entity('guarantee_tracking')
@Index(['tenantId', 'status'])
@Index(['recommendationId'], { unique: true })
export class GuaranteeTrackingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ name: 'recommendation_id' })
  recommendationId: string;

  @ManyToOne(() => RecommendationEntity)
  @JoinColumn({ name: 'recommendation_id' })
  recommendation: RecommendationEntity;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date; // 预计过保日期

  @Column({
    type: 'varchar',
    default: 'tracking',
    comment: 'tracking, finished, failed',
  })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'timestamp', nullable: true })
  failDate: Date; // 如果中途离职，记录日期

  @Column({ type: 'text', nullable: true })
  failReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
