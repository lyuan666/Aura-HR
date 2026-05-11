import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationService } from './notification.service';
import { FeishuNotificationService } from './feishu-notification.service';
import { TestFeishuWebhookDto, SaveFeishuConfigDto } from './notification.dto';

@Controller('notification')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly feishuService: FeishuNotificationService,
  ) {}

  @Get('feishu/config')
  async getFeishuConfig(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return await this.notificationService.getFeishuConfig(tenantId);
  }

  @Post('feishu/config')
  async saveFeishuConfig(@Req() req: any, @Body() dto: SaveFeishuConfigDto) {
    const tenantId = req.user.tenantId;
    return await this.notificationService.saveFeishuConfig(tenantId, dto);
  }

  @Post('feishu/test')
  async testFeishu(@Body() dto: TestFeishuWebhookDto) {
    await this.feishuService.sendCardMessage(dto.webhookUrl, {
      title: '🚀 YZSCHROS 飞书通知测试',
      titleColor: 'blue',
      elements: [
        { label: '测试状态', value: '成功' },
        { label: '测试时间', value: new Date().toLocaleString() },
        { label: '附带信息', value: dto.text || '这是一条自动生成的测试消息，证明 Webhook 配置正确。' },
      ],
      actions: [
        {
          text: '进入系统',
          url: 'https://www.txos.top',
          type: 'primary',
        },
      ],
    });

    return { success: true, message: '测试消息已发送，请检查飞书群聊。' };
  }
}
