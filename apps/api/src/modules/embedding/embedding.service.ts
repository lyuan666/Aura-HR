import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface ZhipuEmbeddingItem {
  embedding: number[];
  index: number;
  object: string;
}

interface ZhipuEmbeddingResponse {
  data: ZhipuEmbeddingItem[];
  model: string;
  object: string;
  usage: {
    prompt_tokens: number;
    completion_tokens?: number;
    total_tokens: number;
  };
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly apiKey = process.env.ZHIPU_API_KEY || process.env.BIGMODEL_API_KEY;
  private readonly model = process.env.ZHIPU_EMBEDDING_MODEL || 'embedding-2';

  /**
   * 生成单个文本的向量
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!text) return [];

    if (!this.apiKey || this.apiKey === 'your-zhipu-api-key') {
      throw new Error('ZHIPU_API_KEY is not configured — cannot generate embeddings');
    }

    const response = await axios.post<ZhipuEmbeddingResponse>(
      'https://open.bigmodel.cn/api/paas/v4/embeddings',
      {
        model: this.model,
        input: text.substring(0, 2000),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        timeout: 10000,
      },
    );

    return response.data.data[0].embedding;
  }

  /**
   * 批量生成文本的向量
   */
  async batchGenerateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) return [];

    if (!this.apiKey || this.apiKey === 'your-zhipu-api-key') {
      throw new Error('ZHIPU_API_KEY is not configured — cannot generate batch embeddings');
    }

    const response = await axios.post<ZhipuEmbeddingResponse>(
      'https://open.bigmodel.cn/api/paas/v4/embeddings',
      {
        model: this.model,
        input: texts.map((t) => t.substring(0, 2000)),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        timeout: 15000,
      },
    );

    return response.data.data.map((item) => item.embedding);
  }
}
