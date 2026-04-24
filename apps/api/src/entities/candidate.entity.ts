import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('candidates')
export class CandidateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ['male', 'female', 'unknown'],
    default: 'unknown',
  })
  gender: string;

  @Column({ nullable: true })
  age: number;

  @Column({ nullable: true })
  location: string;

  // 联系方式
  @Column({ nullable: true })
  @Index()
  phone: string;

  @Column({ nullable: true })
  wechat: string;

  @Column({ nullable: true })
  @Index()
  email: string;

  @Column({ name: 'tenant_id', nullable: true })
  @Index()
  tenantId: string;

  // 职业信息
  @Column({ name: 'current_company', nullable: true })
  currentCompany: string;

  @Column({ name: 'current_title', nullable: true })
  currentTitle: string;

  @Column({
    name: 'total_years',
    type: 'decimal',
    precision: 4,
    scale: 1,
    nullable: true,
  })
  totalYears: number;

  @Column({ name: 'current_salary', nullable: true })
  currentSalary: number;

  @Column({ name: 'expected_salary', nullable: true })
  expectedSalary: number;

  // 教育
  @Column({ nullable: true })
  degree: string;

  @Column({ nullable: true })
  school: string;

  @Column({ nullable: true })
  major: string;

  // AI 解析标签 (JSON)
  @Column({ name: 'parsed_tags', type: 'jsonb', nullable: true })
  parsedTags: Record<string, any>;

  @Column({ name: 'birth_date', nullable: true })
  birthDate: Date;

  @Column({ name: 'native_place', nullable: true })
  nativePlace: string;

  @Column({ name: 'work_experiences', type: 'jsonb', nullable: true })
  workExperiences: any[];

  @Column({ name: 'project_experiences', type: 'jsonb', nullable: true })
  projectExperiences: any[];

  @Column({ name: 'career_expectations', type: 'jsonb', nullable: true })
  careerExpectations: any;

  @Column({ name: 'education_history', type: 'jsonb', nullable: true })
  educationHistory: any[];

  // 来源
  @Column({ name: 'source_platform', nullable: true })
  sourcePlatform: string;

  @Column({ name: 'imported_by', nullable: true })
  importedBy: string;

  // 状态
  @Column({
    type: 'enum',
    enum: ['new', 'active', 'in_process', 'offered', 'placed', 'inactive'],
    default: 'new',
  })
  @Index()
  status: string;

  @Column({ name: 'resume_url', nullable: true })
  resumeUrl: string;

  @Column({ name: 'resume_text', type: 'text', nullable: true })
  resumeText: string;

  @Column({
    type: 'vector',
    length: 1024,
    nullable: true,
  })
  embedding: number[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'last_contacted_at', nullable: true })
  lastContactedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
