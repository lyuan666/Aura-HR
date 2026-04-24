import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('job_positions')
export class JobPositionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', nullable: true })
  @Index()
  tenantId: string;

  @Column({ name: 'enterprise_id' })
  @Index()
  enterpriseId: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  department: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  requirements: string;

  @Column({ name: 'salary_min', nullable: true })
  salaryMin: number;

  @Column({ name: 'salary_max', nullable: true })
  salaryMax: number;

  @Column({ nullable: true })
  location: string;

  @Column({ default: 1 })
  headcount: number;

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  })
  urgency: string;

  @Column({
    type: 'enum',
    enum: [
      'pending',
      'matching',
      'recommending',
      'interviewing',
      'closed',
      'cancelled',
    ],
    default: 'pending',
  })
  @Index()
  status: string;

  @Column({ name: 'skill_tags', type: 'jsonb', default: [] })
  skillTags: string[];

  @Column({ name: 'difficulty_score', nullable: true })
  difficultyScore: number;

  @Column({ name: 'enhanced_description', type: 'text', nullable: true })
  enhancedDescription: string;

  @Column({
    type: 'vector',
    length: 1024,
    nullable: true,
  })
  embedding: number[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
