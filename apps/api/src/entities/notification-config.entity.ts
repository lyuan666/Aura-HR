import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('notification_configs')
export class NotificationConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', nullable: true })
  tenantId: string;

  @Column({ type: 'varchar', length: 50 })
  type: string; // e.g., 'feishu_webhook'

  @Column({ type: 'jsonb' })
  config: any; // e.g., { webhookUrl: '...', enabledEvents: ['...'] }

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
