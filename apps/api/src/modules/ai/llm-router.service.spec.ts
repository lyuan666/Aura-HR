import axios from 'axios';
import { LlmRouterService } from './llm-router.service';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LlmRouterService retry behavior', () => {
  let service: any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = Object.create(LlmRouterService.prototype);
    service.maxRetries = 2;
    service.logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
    service.retryDelayMs = jest.fn().mockReturnValue(1);
  });

  it('retries transient 429 responses before returning content', async () => {
    mockedAxios.post
      .mockRejectedValueOnce({
        response: { status: 429, headers: {} },
        message: 'rate limited',
      })
      .mockResolvedValueOnce({
        data: { choices: [{ message: { content: '{"ok":true}' } }] },
      });

    const result = await service.doCall(
      {
        url: 'https://llm.example/v1/chat/completions',
        model: 'test-model',
        key: 'test-key',
      },
      [{ role: 'user', content: 'parse' }],
    );

    expect(result).toBe('{"ok":true}');
    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    expect(service.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('status=429'),
    );
  });

  it('does not retry non-transient client errors', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { status: 400, headers: {} },
      message: 'bad request',
    });

    await expect(
      service.doCall(
        {
          url: 'https://llm.example/v1/chat/completions',
          model: 'test-model',
          key: 'test-key',
        },
        [{ role: 'user', content: 'parse' }],
      ),
    ).rejects.toMatchObject({ response: { status: 400 } });
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });
});
