import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import { Readable } from 'stream';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: Minio.Client;
  private readonly defaultBucket = 'uploads';

  constructor() {
    this.client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ROOT_USER || 'minioadmin',
      secretKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin',
    });
  }

  async onModuleInit() {
    const exists = await this.client.bucketExists(this.defaultBucket).catch(() => false);
    if (!exists) {
      await this.client.makeBucket(this.defaultBucket);
      this.logger.log(`Created MinIO bucket: ${this.defaultBucket}`);
    }
  }

  async putObject(
    bucket: string,
    key: string,
    data: Buffer | string | Readable,
    size?: number,
    contentType?: string,
  ): Promise<string> {
    const metadata = contentType ? { 'Content-Type': contentType } : undefined;
    const result = await this.client.putObject(bucket, key, data, size, metadata);
    return result.etag || '';
  }

  async getObject(bucket: string, key: string): Promise<Buffer> {
    const stream = await this.client.getObject(bucket, key);
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  async deleteObject(bucket: string, key: string): Promise<void> {
    await this.client.removeObject(bucket, key);
  }
}
