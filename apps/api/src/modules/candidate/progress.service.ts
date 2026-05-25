import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Observable, Subject, merge, interval, map } from 'rxjs';
import Redis from 'ioredis';

export interface JobProgress {
  jobId: string;
  batchId?: string;
  fileName: string;
  progress: number;
  status:
    | 'queued'
    | 'extracting'
    | 'parsing'
    | 'deduping'
    | 'saving'
    | 'completed'
    | 'duplicate'
    | 'failed';
  result?: any;
  error?: string;
  // 命中查重时一并下发，前端用来弹决策 Modal。
  duplicate?: {
    matchType: string;
    matchTypeLabel: string;
    confidence: number;
    existing: {
      id: string;
      name?: string | null;
      phone?: string | null;
      email?: string | null;
      currentCompany?: string | null;
      currentTitle?: string | null;
      updatedAt?: string | null;
      sourcePlatform?: string | null;
    };
  };
}

interface SseEnvelope {
  type: 'progress' | 'heartbeat' | 'connected';
  payload?: JobProgress;
  ts: number;
}

const CHANNEL = 'progress_events';
const HEARTBEAT_MS = 15_000;
const LAST_EVENT_KEY_PREFIX = 'progress:last:';
const LAST_EVENT_TTL_SECONDS = 60 * 60;

/**
 * ProgressService — SSE 实时进度推送
 *
 * 单实例: 内存 Subject 直推
 * 多实例 (Worker on Mac Mini): Redis Pub/Sub 桥接
 */
@Injectable()
export class ProgressService implements OnModuleDestroy {
  private subjects = new Map<string, Subject<JobProgress>>();
  private latestEvents = new Map<string, JobProgress>();
  private cleanupTimers = new Set<NodeJS.Timeout>();
  private publisher?: Redis;
  private subscriber?: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      // Publisher: 所有实例都能发布进度事件
      this.publisher = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      });
      this.publisher.connect().catch(() => {});

      // Subscriber: 所有实例订阅, 收到事件后推送给本地 SSE 客户端
      this.subscriber = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      });
      this.subscriber
        .connect()
        .then(() => {
          this.subscriber!.subscribe(CHANNEL).catch(() => {});
        })
        .catch(() => {});

      this.subscriber.on('message', (_channel: string, data: string) => {
        try {
          const event = JSON.parse(data) as JobProgress;
          this.cacheAndForward(event);
        } catch {
          // Ignore malformed messages
        }
      });
    } catch {
      // Redis unavailable: fallback to local-only mode
    }
  }

  emit(event: JobProgress) {
    this.cacheAndForward(event);

    // 广播到 Redis (跨进程)
    try {
      const payload = JSON.stringify(event);
      for (const key of this.keysFor(event)) {
        this.publisher
          ?.setex(
            `${LAST_EVENT_KEY_PREFIX}${key}`,
            LAST_EVENT_TTL_SECONDS,
            payload,
          )
          .catch(() => {});
      }
      this.publisher?.publish(CHANNEL, payload).catch(() => {});
    } catch {
      // Redis publish failed: local-only
    }

    // 完成后延迟清理 Subject
    if (['completed', 'duplicate', 'failed'].includes(event.status)) {
      const timer = setTimeout(() => {
        for (const key of this.keysFor(event)) {
          this.subjects.delete(key);
          this.latestEvents.delete(key);
        }
        this.cleanupTimers.delete(timer);
      }, 60000);
      this.cleanupTimers.add(timer);
    }
  }

  getStream(key: string): Observable<MessageEvent> {
    if (!this.subjects.has(key)) {
      this.subjects.set(key, new Subject<JobProgress>());
    }
    const progress$ = this.subjects.get(key)!.pipe(
      map(
        (event): SseEnvelope => ({
          type: 'progress',
          payload: event,
          ts: Date.now(),
        }),
      ),
    );
    // 立刻发 connected；如果 worker 已经先完成，也补发最近状态。
    const connected$ = new Observable<SseEnvelope>((sub) => {
      sub.next({ type: 'connected', ts: Date.now() });
      void this.getLatestEvent(key).then((event) => {
        if (!sub.closed && event) {
          sub.next({ type: 'progress', payload: event, ts: Date.now() });
        }
      }).catch((err) => { console.error('[ProgressService]', err.message); });
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
    for (const timer of this.cleanupTimers) {
      clearTimeout(timer);
    }
    this.cleanupTimers.clear();
    this.publisher?.disconnect();
    this.subscriber?.disconnect();
  }

  private cacheAndForward(event: JobProgress) {
    for (const key of this.keysFor(event)) {
      this.latestEvents.set(key, event);
      const subject = this.subjects.get(key);
      if (subject) {
        subject.next(event);
      }
    }
  }

  private keysFor(event: JobProgress) {
    return Array.from(
      new Set([event.batchId, event.jobId].filter(Boolean)),
    ) as string[];
  }

  private async getLatestEvent(key: string) {
    const local = this.latestEvents.get(key);
    if (local) return local;

    const cached = await this.publisher
      ?.get(`${LAST_EVENT_KEY_PREFIX}${key}`)
      .catch(() => undefined);
    if (!cached) return undefined;

    try {
      const event = JSON.parse(cached) as JobProgress;
      this.latestEvents.set(key, event);
      return event;
    } catch {
      return undefined;
    }
  }
}
