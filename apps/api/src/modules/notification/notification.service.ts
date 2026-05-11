import { Injectable, Logger } from '@nestjs/common';
import { FeishuNotificationService } from './feishu-notification.service';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationConfigEntity } from '../../entities/notification-config.entity';
import { SaveFeishuConfigDto } from './notification.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly feishuService: FeishuNotificationService,
    private readonly configService: ConfigService,
    @InjectRepository(NotificationConfigEntity)
    private readonly configRepo: Repository<NotificationConfigEntity>,
  ) {}

  /**
   * 统一发送接口，支持按租户获取配置
   */
  async notify(tenantId: string, event: string, data: any) {
    // 优先从数据库获取租户配置
    const dbConfig = await this.configRepo.findOne({
      where: { tenantId, type: 'feishu_webhook', enabled: true },
    });

    const webhookUrl = dbConfig?.config?.webhookUrl || this.configService.get<string>('DEFAULT_FEISHU_WEBHOOK');

    if (!webhookUrl) {
      this.logger.warn(`No Feishu Webhook configured for tenant ${tenantId}, skipping notification.`);
      return;
    }

    // 如果数据库有配置，检查对应的 event 是否启用
    if (dbConfig?.config?.enabledEvents && !dbConfig.config.enabledEvents.includes(event)) {
      this.logger.debug(`Event ${event} is disabled for tenant ${tenantId}`);
      return;
    }

    switch (event) {
      case 'interview_reminder':
        await this.sendInterviewReminder(webhookUrl, data);
        break;
      case 'match_notification':
        await this.sendMatchNotification(webhookUrl, data);
        break;
      case 'follow_up_reminder':
        await this.sendFollowUpReminder(webhookUrl, data);
        break;
      case 'status_change':
        await this.sendStatusChangeNotification(webhookUrl, data);
        break;
      default:
        this.logger.warn(`Unknown notification event: ${event}`);
    }
  }

  private async sendInterviewReminder(webhookUrl: string, data: any) {
    await this.feishuService.sendCardMessage(webhookUrl, {
      title: '📅 面试安排提醒',
      titleColor: 'orange',
      elements: [
        { label: '候选人', value: data.candidateName },
        { label: '职位', value: data.jobTitle },
        { label: '面试时间', value: data.interviewTime },
        { label: '面试地点', value: data.location || '线上面试' },
      ],
      actions: [
        {
          text: '查看详情',
          url: `${this.getBaseUrl()}/recommendations/${data.id}`,
          type: 'primary',
        },
      ],
    });
  }

  private async sendMatchNotification(webhookUrl: string, data: any) {
    await this.feishuService.sendCardMessage(webhookUrl, {
      title: '🎯 发现高匹配人才',
      titleColor: 'green',
      elements: [
        { label: '候选人', value: data.candidateName },
        { label: '目标职位', value: data.jobTitle },
        { label: '匹配分数', value: `${data.score}分` },
        { label: '核心优势', value: data.highlights || '详见报告' },
      ],
      actions: [
        {
          text: '立即查阅',
          url: `${this.getBaseUrl()}/candidates/${data.candidateId}`,
          type: 'primary',
        },
      ],
    });
  }

  private async sendFollowUpReminder(webhookUrl: string, data: any) {
    await this.feishuService.sendCardMessage(webhookUrl, {
      title: '⏰ 跟进任务提醒',
      titleColor: 'blue',
      elements: [
        { label: '提醒内容', value: data.content },
        { label: '关联候选人', value: data.candidateName || '无' },
        { label: '提醒时间', value: data.remindAt },
      ],
      actions: [
        {
          text: '前往处理',
          url: `${this.getBaseUrl()}/follow-ups`,
          type: 'default',
        },
      ],
    });
  }

  private async sendStatusChangeNotification(webhookUrl: string, data: any) {
    await this.feishuService.sendCardMessage(webhookUrl, {
      title: '🔄 推荐进度变更',
      titleColor: 'grey',
      elements: [
        { label: '候选人', value: data.candidateName },
        { label: '变更职位', value: data.jobTitle },
        { label: '新状态', value: data.newStatus },
        { label: '操作人', value: data.operatorName || '系统' },
      ],
      actions: [
        {
          text: '查看简历',
          url: `${this.getBaseUrl()}/recommendations/${data.id}`,
          type: 'default',
        },
      ],
    });
  }

  private getBaseUrl() {
    return this.configService.get<string>('FRONTEND_URL') || 'https://www.txos.top';
  }

  async getFeishuConfig(tenantId: string) {
    const config = await this.configRepo.findOne({
      where: { tenantId, type: 'feishu_webhook' },
    });
    return config || { enabled: false, config: { webhookUrl: '', enabledEvents: [] } };
  }

  async saveFeishuConfig(tenantId: string, dto: SaveFeishuConfigDto) {
    let config = await this.configRepo.findOne({
      where: { tenantId, type: 'feishu_webhook' },
    });

    if (config) {
      config.config = {
        ...config.config,
        webhookUrl: dto.webhookUrl,
        enabledEvents: dto.enabledEvents || config.config.enabledEvents || [],
      };
      config.enabled = true;
    } else {
      config = this.configRepo.create({
        tenantId,
        type: 'feishu_webhook',
        enabled: true,
        config: {
          webhookUrl: dto.webhookUrl,
          enabledEvents: dto.enabledEvents || ['interview_reminder', 'match_notification', 'follow_up_reminder', 'status_change'],
        },
      });
    }

    return await this.configRepo.save(config);
  }
}
