import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('candidates')
@Index(['tenantId', 'createdAt'])
@Index(['tenantId', 'status'])
@Index(['fileHash', 'tenantId'], { unique: true })
@Index(['textHash', 'tenantId'], { unique: true })
export class CandidateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
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

  // 文件指纹 (Phase 2 去重)
  @Column({ name: 'file_hash', nullable: true })
  fileHash: string;

  // 文本内容指纹 (Phase 2 去重)
  @Column({ name: 'text_hash', nullable: true })
  textHash: string;

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

  // 历史简历归档：每次 duplicate-decision=replace 时把旧 resumeUrl 推入这里。
  // 保留追溯能力，避免覆盖丢失原始版本。
  @Column({ name: 'history_resume_urls', type: 'jsonb', nullable: true })
  historyResumeUrls: string[];

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
