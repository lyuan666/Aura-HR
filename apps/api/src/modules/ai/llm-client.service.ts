import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

/**
 * 极简信号量：用于控制全局并发 QPS，防止大模型 API 触发 429 限流
 */
class Semaphore {
  private tasks: (() => void)[] = [];
  private count: number;

  constructor(count: number) {
    this.count = count;
  }

  async acquire() {
    if (this.count > 0) {
      this.count--;
      return;
    }
    return new Promise<void>(resolve => {
      this.tasks.push(resolve);
    });
  }

  release() {
    if (this.tasks.length > 0) {
      const next = this.tasks.shift();
      if (next) next();
    } else {
      this.count++;
    }
  }
}

@Injectable()
export class LlmClientService {
  private readonly logger = new Logger(LlmClientService.name);
  private readonly semaphore = new Semaphore(2);

  // 云端配置 (智谱 AI)
  private readonly cloudApiKey = process.env.ZHIPU_API_KEY || process.env.BIGMODEL_API_KEY;
  private readonly cloudApiUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
  private readonly cloudModel = 'glm-4-flash';
  private readonly visionModel = 'glm-4v-plus';

  // 本地配置 (OpenAI 兼容接口)
  private readonly isLocalEnabled = process.env.LOCAL_AI_ENABLED === 'true';
  private readonly localApiUrl = process.env.LOCAL_AI_URL || 'http://localhost:8080/v1/chat/completions';
  private readonly localApiKey = process.env.LOCAL_AI_KEY || 'sk-local';
  private readonly localModel = process.env.LOCAL_AI_MODEL || 'qwen3.5-9b';

  async callAi(messages: any[], jsonMode = false, retries = 5, targetModel?: string, forceCloud = false) {
    const useLocal = this.isLocalEnabled && !forceCloud;
    const apiUrl = useLocal ? this.localApiUrl : this.cloudApiUrl;
    const apiKey = useLocal ? this.localApiKey : this.cloudApiKey;
    const currentModel = useLocal ? this.localModel : (targetModel || this.cloudModel);
    const engineLabel = useLocal ? 'Local' : 'Cloud';

    if (!apiKey && !useLocal) {
      this.logger.error('API Key 未配置，且本地引擎未开启');
      throw new Error('AI 服务配置缺失');
    }

    await this.semaphore.acquire();

    let lastError: any;
    try {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const payload: any = {
            model: currentModel,
            messages,
            temperature: 0.1,
          };

          if (jsonMode && useLocal) {
            payload.response_format = { type: 'json_object' };
          }

          const response = await axios.post(
            apiUrl,
            payload,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
              },
              timeout: 90000,
            },
          );

          const content = response.data.choices[0].message.content;
          if (jsonMode) {
            return this.cleanAndParseJson(content);
          }
          return content;
        } catch (e: any) {
          lastError = e;
          if (e.response && e.response.status === 429 && attempt < retries) {
            const delay = Math.pow(2, attempt) * 1500 + Math.random() * 1000;
            this.logger.warn(`${engineLabel} API 限流 (429)，将在 ${Math.round(delay)}ms 后重试...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          this.logger.error(`AI 接口失败 (${engineLabel}, ${attempt + 1}): ${e.message}`);
          if (attempt === retries) throw e;
        }
      }
    } finally {
      this.semaphore.release();
    }
    throw new Error(`AI 服务异常: ${lastError?.message}`);
  }

  private cleanAndParseJson(content: string) {
    try {
      const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonMatch = cleanContent.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (!jsonMatch) {
        return JSON.parse(cleanContent.replace(/[\u0000-\u001F\u007F-\u009F]/g, ""));
      }
      return JSON.parse(jsonMatch[0].replace(/[\u0000-\u001F\u007F-\u009F]/g, ""));
    } catch (e) {
      this.logger.error(`JSON 解析失败: ${e.message} | 原始内容: ${content.slice(0, 100)}`);
      return content.trim().startsWith('[') ? [] : {};
    }
  }

  getVisionModel() { return this.visionModel; }
}
