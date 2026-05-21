import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { VariableDefinition } from './contract-template.entity';

export interface TemplateSnapshot {
  name?: string;
  category?: string;
  templateContent: string;
  variables: VariableDefinition[];
  version: string;
}

export interface RiskAssessmentReport {
  score: number;        // 风险评分 0-100
  issues: string[];     // 风险点列表
  suggestions: string[];  // 改进建议
  assessedAt: string;   // 评估时间 (ISO String)
  dimensions?: Record<string, any>; // 维度级的细分分析结果
}

@Entity('contract_generations')
export class ContractGenerationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string; // 强制非空，保障多租户安全

  @Column({ name: 'template_id' })
  @Index()
  templateId: string;

  @Column({ name: 'template_snapshot', type: 'jsonb' })
  templateSnapshot: TemplateSnapshot; // 模板渲染快照，用于向前兼容

  @Column({ name: 'enterprise_id', type: 'uuid', nullable: true })
  @Index()
  enterpriseId: string | null;

  @Column({ name: 'contract_id', type: 'uuid', nullable: true })
  @Index()
  contractId: string | null; // 正式化后的合同关联

  @Column({ name: 'generation_no', unique: true })
  generationNo: string; // 生成编号, 如 GEN-20260520-001

  @Column({ name: 'variable_values', type: 'jsonb', default: {} })
  variableValues: Record<string, any>; // 用户填写的变量值

  @Column({ type: 'text' })
  content: string; // Nunjucks 替换渲染出来的原始 HTML 正文

  @Column({ name: 'edited_content', type: 'text', nullable: true })
  editedContent: string | null; // 在线富文本编辑器微调后的 HTML 正文

  @Column({ default: 'draft' })
  @Index()
  status: string; // draft, preview, formalized, cancelled

  @Column({ name: 'risk_assessment', type: 'jsonb', nullable: true })
  riskAssessment: RiskAssessmentReport | null; // AI 风险评估详情

  @Column({ name: 'formalized_at', type: 'timestamp', nullable: true })
  formalizedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
