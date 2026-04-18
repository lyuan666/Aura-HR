import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('recommendations')
export class RecommendationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'candidate_id' })
  candidateId: string;

  @Column({ name: 'job_position_id' })
  jobPositionId: string;

  @Column({ name: 'consultant_id' })
  consultantId: string;

  @Column({
    name: 'match_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  matchScore: number;

  @Column({
    type: 'enum',
    enum: [
      'pending',
      'submitted',
      'reviewing',
      'interview_scheduled',
      'interviewed',
      'offer_sent',
      'accepted',
      'rejected',
      'withdrawn',
    ],
    default: 'pending',
  })
  status: string;

  @Column({ name: 'ai_analysis', type: 'jsonb', nullable: true })
  aiAnalysis: {
    highlights: string[];
    risks: string[];
    interviewSuggestions: string[];
    conclusion: string;
  };

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ name: 'interview_date', nullable: true })
  interviewDate: Date;

  @Column({ name: 'interview_report', type: 'jsonb', nullable: true })
  interviewReport: any;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
