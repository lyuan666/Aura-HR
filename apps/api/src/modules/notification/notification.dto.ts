import { IsString, IsUrl, IsOptional } from 'class-validator';

export class TestFeishuWebhookDto {
  @IsUrl({}, { message: '请输入有效的飞书 Webhook URL' })
  webhookUrl: string;

  @IsString()
  @IsOptional()
  text?: string;
}

export class SaveFeishuConfigDto {
  @IsUrl({}, { message: '请输入有效的飞书 Webhook URL' })
  webhookUrl: string;

  @IsOptional()
  enabledEvents?: string[];
}

export interface FeishuCardAction {
  text: string;
  url: string;
  type: 'primary' | 'default' | 'danger';
}

export interface FeishuCardContent {
  title: string;
  titleColor?: 'blue' | 'green' | 'orange' | 'red' | 'grey';
  elements: { label: string; value: string }[];
  actions?: FeishuCardAction[];
}
