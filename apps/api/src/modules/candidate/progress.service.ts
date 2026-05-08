import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Subject, map } from 'rxjs';
import Redis from 'ioredis';

export interface JobProgress {
  jobId: string;
  batchId?: string;
  fileName: string;
  progress: number;
  status: 'queued' | 'extracting' | 'parsing' | 'deduping' | 'saving' | 'completed' | 'duplicate' | 'failed';
  result?: any;
  error?: string;
}

const CHANNEL = 'progress_events';

/**
 * ProgressService — SSE 实时进度推送
 *
 * 单实例: 内存 Subject 直推
 * 多实例 (Worker on Mac Mini): Redis Pub/Sub 桥接
 */
@Injectable()
export class ProgressService implements OnModuleDestroy {
  private subjects = new Map<string, Subject<JobProgress>>();
  private publisher?: Redis;
  private subscriber?: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      // Publisher: 所有实例都能发布进度事件
      this.publisher = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });
      this.publisher.connect().catch(() => {});

      // Subscriber: 所有实例订阅, 收到事件后推送给本地 SSE 客户端
      this.subscriber = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });
      this.subscriber.connect().then(() => {
        this.subscriber!.subscribe(CHANNEL).catch(() => {});
      }).catch(() => {});

      this.subscriber.on('message', (_channel: string, data: string) => {
        try {
          const event = JSON.parse(data) as JobProgress;
          const key = event.batchId || event.jobId;
          const subject = this.subjects.get(key);
          if (subject) {
            subject.next(event);
          }
        } catch {
          // Ignore malformed messages
        }
      });
    } catch {
      // Redis unavailable: fallback to local-only mode
    }
  }

  emit(event: JobProgress) {
    const key = event.batchId || event.jobId;
    if (!this.subjects.has(key)) {
      this.subjects.set(key, new Subject<JobProgress>());
    }
    this.subjects.get(key)!.next(event);

    // 广播到 Redis (跨进程)
    try {
      this.publisher?.publish(CHANNEL, JSON.stringify(event)).catch(() => {});
    } catch {
      // Redis publish failed: local-only
    }

    // 完成后延迟清理 Subject
    if (['completed', 'duplicate', 'failed'].includes(event.status)) {
      setTimeout(() => this.subjects.delete(key), 60000);
    }
  }

  getStream(key: string) {
    if (!this.subjects.has(key)) {
      this.subjects.set(key, new Subject<JobProgress>());
    }
    return this.subjects.get(key)!.pipe(
      map((event) => ({ data: JSON.stringify(event) }) as MessageEvent),
    );
  }

  onModuleDestroy() {
    this.publisher?.disconnect();
    this.subscriber?.disconnect();
  }
}
