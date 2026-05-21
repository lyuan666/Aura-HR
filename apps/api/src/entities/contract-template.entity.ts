import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export interface VariableDefinition {
  name: string;           // 变量名 如 companyName
  label: string;          // 显示标签 如 "甲方名称"
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  required: boolean;
  defaultValue?: any;
  options?: string[];     // 用于 select 类型
  placeholder?: string;
  validation?: {          // 简单校验规则
    pattern?: string;     // 正则
    min?: number;
    max?: number;
  };
}

@Entity('contract_templates')
export class ContractTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  @Index()
  tenantId: string | null; // null = 系统预设模板，非null = 企业自定义模板

  @Column()
  name: string; // 劳动合同、服务协议等

  @Column()
  @Index()
  category: string; // labor, service, nda, recommendation

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'template_content', type: 'text' })
  templateContent: string; // Nunjucks模板

  @Column({ name: 'file_url', type: 'text', nullable: true })
  fileUrl: string | null;

  @Column({ type: 'jsonb', default: [] })
  variables: VariableDefinition[]; // 变量定义列表

  @Column({ default: 'draft' })
  @Index()
  status: string; // draft, active, archived

  @Column({ default: '1.0' })
  version: string;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string | null; // 版本继承的父模板 ID

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
