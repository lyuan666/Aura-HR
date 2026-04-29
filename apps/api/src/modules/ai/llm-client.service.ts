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

  // 主力云端配置 (DeepSeek)
  private readonly deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  private readonly deepseekApiUrl = 'https://api.deepseek.com/chat/completions';
  private readonly deepseekModel = 'deepseek-chat';

  // 备用云端配置 (智谱 AI) — Vision 用
  private readonly cloudApiKey = process.env.ZHIPU_API_KEY || process.env.BIGMODEL_API_KEY;
  private readonly cloudApiUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
  private readonly cloudModel = 'glm-4-flash';
  private readonly visionModel = 'glm-4v-plus';

  // 本地配置 (OpenAI 兼容接口)
  private readonly isLocalEnabled = process.env.LOCAL_AI_ENABLED === 'true';
  private readonly localApiUrl = process.env.LOCAL_AI_URL || 'http://localhost:8080/v1/chat/completions';
  private readonly localApiKey = process.env.LOCAL_AI_KEY || 'sk-local';
  private readonly localModel = process.env.LOCAL_AI_MODEL || 'qwen3.5-9b';

  async callAi(messages: any[], jsonMode = false, retries = 3, targetModel?: string, forceCloud = false, maxTokens?: number) {
    const useLocal = this.isLocalEnabled && !forceCloud;
    const isVision = targetModel === this.visionModel;

    if (useLocal) {
      return this.doCall(messages, jsonMode, retries, this.localApiUrl, this.localApiKey, this.localModel, 'Local', maxTokens);
    }

    // Vision 走智谱（DeepSeek 不支持 image_url）
    if (isVision && this.cloudApiKey) {
      return this.doCall(messages, jsonMode, retries, this.cloudApiUrl, this.cloudApiKey, this.visionModel, 'Vision(智谱)', maxTokens);
    }

    // 文本解析：主力 DeepSeek，备用智谱
    if (this.deepseekApiKey) {
      try {
        return await this.doCall(messages, jsonMode, retries, this.deepseekApiUrl, this.deepseekApiKey, this.deepseekModel, 'DeepSeek', maxTokens);
      } catch (e: any) {
        if (!this.cloudApiKey) throw e;
        this.logger.warn(`DeepSeek 失败 (${e.message})，切换智谱备用`);
      }
    }

    if (this.cloudApiKey) {
      return this.doCall(messages, jsonMode, retries, this.cloudApiUrl, this.cloudApiKey, targetModel || this.cloudModel, 'Cloud(智谱)', maxTokens);
    }

    throw new Error('AI 服务配置缺失：无可用 API Key');
  }

  private async doCall(
    messages: any[], jsonMode: boolean, retries: number,
    apiUrl: string, apiKey: string, model: string, label: string,
    maxTokens?: number,
  ) {
    await this.semaphore.acquire();
    let lastError: any;
    try {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const payload: any = { model, messages, temperature: 0.1 };
          if (maxTokens) payload.max_tokens = maxTokens;
          if (jsonMode) payload.response_format = { type: 'json_object' };
          const response = await axios.post(apiUrl, payload, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            timeout: 60000,
          });
          const content = response.data.choices[0].message.content;
          if (jsonMode) {
            return this.cleanAndParseJson(content);
          }
          return content;
        } catch (e: any) {
          lastError = e;
          if (e.response?.status === 429 && attempt < retries) {
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
            this.logger.warn(`${label} API 限流 (429)，将在 ${Math.round(delay)}ms 后重试...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          this.logger.error(`AI 接口失败 (${label}, ${attempt + 1}): ${e.message}`);
          if (attempt === retries) throw e;
        }
      }
    } finally {
      this.semaphore.release();
    }
    throw new Error(`AI 服务异常 (${label}): ${lastError?.message}`);
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
