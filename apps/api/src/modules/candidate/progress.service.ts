import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Observable, Subject, merge, interval, map } from 'rxjs';
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

interface SseEnvelope {
  type: 'progress' | 'heartbeat' | 'connected';
  payload?: JobProgress;
  ts: number;
}

const CHANNEL = 'progress_events';
const HEARTBEAT_MS = 15_000;

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

  getStream(key: string): Observable<MessageEvent> {
    if (!this.subjects.has(key)) {
      this.subjects.set(key, new Subject<JobProgress>());
    }
    const progress$ = this.subjects.get(key)!.pipe(
      map((event): SseEnvelope => ({ type: 'progress', payload: event, ts: Date.now() })),
    );
    // 立刻发一个 connected 事件，让前端确认 SSE 真的建起来了。
    const connected$ = new Observable<SseEnvelope>((sub) => {
      sub.next({ type: 'connected', ts: Date.now() });
    });
    // 15s 心跳：防止 Nginx/Cloudflare/中间代理把空闲连接当 idle 关掉，
    // 也帮前端区分"网络断了"和"后端还在跑但还没新进度"。
    const heartbeat$ = interval(HEARTBEAT_MS).pipe(
      map((): SseEnvelope => ({ type: 'heartbeat', ts: Date.now() })),
    );
    return merge(connected$, progress$, heartbeat$).pipe(
      map((env) => ({ data: JSON.stringify(env) }) as MessageEvent),
    );
  }

  onModuleDestroy() {
    this.publisher?.disconnect();
    this.subscriber?.disconnect();
  }
}
