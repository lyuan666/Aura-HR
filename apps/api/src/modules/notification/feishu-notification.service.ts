import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { FeishuCardContent } from './notification.dto';

@Injectable()
export class FeishuNotificationService {
  private readonly logger = new Logger(FeishuNotificationService.name);

  /**
   * 通过 Webhook 发送飞书交互式卡片
   */
  async sendCardMessage(webhookUrl: string, content: FeishuCardContent): Promise<void> {
    try {
      const card = this.buildCardJson(content);
      await axios.post(webhookUrl, {
        msg_type: 'interactive',
        card: card,
      });
      this.logger.log(`Feishu card message sent to ${webhookUrl.substring(0, 30)}...`);
    } catch (error) {
      this.logger.error(`Failed to send Feishu card message: ${error.message}`);
      // 按照计划，通知失败不阻塞主业务，这里记录错误但不抛出
    }
  }

  private buildCardJson(content: FeishuCardContent) {
    const config = {
      wide_screen_mode: true,
    };

    const header = {
      template: content.titleColor || 'blue',
      title: {
        content: content.title,
        tag: 'plain_text',
      },
    };

    const elements = content.elements.map((item) => ({
      tag: 'div',
      text: {
        content: `**${item.label}:** ${item.value}`,
        tag: 'lark_md',
      },
    }));

    const actions = content.actions?.length
      ? [
          {
            tag: 'action',
            actions: content.actions.map((action) => ({
              tag: 'button',
              text: {
                content: action.text,
                tag: 'plain_text',
              },
              url: action.url,
              type: action.type || 'default',
            })),
          },
        ]
      : [];

    return {
      config,
      header,
      elements: [...elements, ...actions],
    };
  }
}
