import { Test, TestingModule } from '@nestjs/testing';
import { FeishuNotificationService } from './feishu-notification.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('FeishuNotificationService', () => {
  let service: FeishuNotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeishuNotificationService],
    }).compile();

    service = module.get<FeishuNotificationService>(FeishuNotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send a card message successfully', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { code: 0 } });

    const webhookUrl = 'http://test-webhook';
    const content = {
      title: 'Test Title',
      elements: [{ label: 'Key', value: 'Value' }],
    };

    await service.sendCardMessage(webhookUrl, content);

    expect(mockedAxios.post).toHaveBeenCalledWith(webhookUrl, expect.objectContaining({
      msg_type: 'interactive',
      card: expect.objectContaining({
        header: expect.objectContaining({
          title: expect.objectContaining({ content: 'Test Title' }),
        }),
      }),
    }));
  });

  it('should not throw error if axios fails', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'));

    const webhookUrl = 'http://test-webhook';
    const content = { title: 'Test', elements: [] };

    // Should not throw because we catch it and log it
    await expect(service.sendCardMessage(webhookUrl, content)).resolves.not.toThrow();
  });
});
