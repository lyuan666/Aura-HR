import { Injectable, Logger, OnModuleDestroy, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import RedisSemaphore from 'redis-semaphore/lib/RedisSemaphore.js';
import axios from 'axios';
import { SHARED_REDIS } from '../redis/redis.module';

/**
 * LlmRouterService — 分布式限流的 LLM 调用器
 *
 * 使用 redis-semaphore 控制全局并发，多实例部署安全。
 * 共享 RedisModule 的连接，不额外创建。
 */
@Injectable()
export class LlmRouterService implements OnModuleDestroy {
  private readonly logger = new Logger(LlmRouterService.name);
  private readonly semaphore: RedisSemaphore;
  private readonly maxRetries: number;

  constructor(@Inject(SHARED_REDIS) private readonly redis: Redis) {
    const maxConcurrency = parseInt(process.env.LLM_CONCURRENCY || '3', 10);
    this.maxRetries = this.parsePositiveInt(process.env.LLM_MAX_RETRIES, 3);
    // lockTimeout=300s > max LLM call (90s), 防止与 BullMQ stalled 冲突
    this.semaphore = new RedisSemaphore(
      this.redis,
      'llm:concurrency',
      maxConcurrency,
      {
        lockTimeout: 300000,
        acquireTimeout: 120000,
        retryInterval: 1000,
      },
    );
  }

  async onModuleDestroy() {
    // Redis 连接由 RedisModule 管理，不在这里关闭
  }

  /**
   * 调用 LLM — 全局并发安全
   */
  async callProvider(provider: string, messages: any[]): Promise<string> {
    // 在 acquire 之前准备好 config，避免 acquire→try 之间抛错泄漏锁
    const config = this.getProviderConfig(provider);
    await this.semaphore.acquire();
    try {
      try {
        return await this.doCall(config.primary, messages);
      } catch (e: any) {
        if (config.fallback?.url) {
          this.logger.warn(`Primary LLM failed (${e.message}), falling back`);
          return await this.doCall(config.fallback, messages);
        }
        throw e;
      }
    } finally {
      await this.semaphore.release();
    }
  }

  /**
   * 调用 LLM 并解析为 JSON
   */
  async callForJson(provider: string, messages: any[]): Promise<any> {
    const raw = await this.callProvider(provider, messages);
    return this.extractJson(raw);
  }

  /**
   * 鲁棒 JSON 提取
   */
  extractJson(raw: string): any {
    // Step 1: 去掉 markdown 代码块包裹
    let cleaned = raw
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();

    // Step 2: 找到第一个 { 和最后一个 } 之间的内容
    const objStart = cleaned.indexOf('{');
    const objEnd = cleaned.lastIndexOf('}');
    const arrStart = cleaned.indexOf('[');
    const arrEnd = cleaned.lastIndexOf(']');

    // 判断是对象还是数组
    if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
      cleaned = cleaned.substring(objStart, objEnd + 1);
    } else if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
      cleaned = cleaned.substring(arrStart, arrEnd + 1);
    } else {
      throw new Error(`LLM 输出不含有效 JSON: ${raw.substring(0, 200)}`);
    }

    // Step 3: 尝试直接解析
    try {
      return JSON.parse(cleaned);
    } catch (_) {
      // Step 4: 修复常见问题
      const repaired = cleaned.replace(/,\s*([}\]])/g, '$1').replace(/'/g, '"');

      try {
        return JSON.parse(repaired);
      } catch (_) {
        throw new Error(`JSON 解析失败，原始输出: ${raw.substring(0, 300)}`);
      }
    }
  }

  private async doCall(
    config: { url: string; model: string; key: string },
    messages: any[],
  ): Promise<string> {
    if (!config.url || !config.model) {
      throw new Error('LLM provider is not configured: missing url or model');
    }

    let lastError: any;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const startedAt = Date.now();
      try {
        const response = await axios.post(
          config.url,
          {
            model: config.model,
            messages,
            temperature: 0.1,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${config.key}`,
            },
            timeout: 90000,
          },
        );
        this.logger.log(
          `LLM call success (${this.providerLabel(config.url)}, model=${config.model}, duration=${Date.now() - startedAt}ms)`,
        );
        return response.data.choices[0].message.content;
      } catch (error: any) {
        lastError = error;
        if (attempt >= this.maxRetries || !this.isRetryable(error)) {
          throw error;
        }

        const delayMs = this.retryDelayMs(error, attempt);
        this.logger.warn(
          `LLM transient failure (${this.providerLabel(config.url)}, status=${error.response?.status || 'network'}, attempt=${attempt + 1}/${this.maxRetries + 1}); retrying in ${delayMs}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw lastError;
  }

  private providerLabel(url: string) {
    if (url.includes('localhost:11434') || url.includes('127.0.0.1:11434')) {
      return 'Ollama local';
    }
    return 'Cloud';
  }

  private getProviderConfig(provider: string) {
    const prefix = `LLM_${provider.toUpperCase()}_`;
    return {
      primary: {
        url: process.env[`${prefix}URL`] || '',
        model: process.env[`${prefix}MODEL`] || '',
        key: process.env[`${prefix}KEY`] || '',
      },
      fallback: {
        url: process.env[`${prefix}FALLBACK_URL`] || '',
        model: process.env[`${prefix}FALLBACK_MODEL`] || '',
        key: process.env[`${prefix}FALLBACK_KEY`] || '',
      },
    };
  }

  private isRetryable(error: any) {
    const status = error.response?.status;
    return (
      status === 408 ||
      status === 425 ||
      status === 429 ||
      (typeof status === 'number' && status >= 500) ||
      ['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED'].includes(error.code)
    );
  }

  private retryDelayMs(error: any, attempt: number) {
    const retryAfter = error.response?.headers?.['retry-after'];
    const retryAfterSeconds = Number(retryAfter);
    if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
      return Math.min(retryAfterSeconds * 1000, 30_000);
    }

    return Math.min(
      1000 * 2 ** attempt + Math.round(Math.random() * 250),
      30_000,
    );
  }

  private parsePositiveInt(value: string | undefined, fallback: number) {
    const parsed = Number.parseInt(value || '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
