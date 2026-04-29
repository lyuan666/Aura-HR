import { Injectable } from '@nestjs/common';
import { Subject, map } from 'rxjs';

export interface JobProgress {
  jobId: string;
  batchId?: string;
  fileName: string;
  progress: number;
  status: 'queued' | 'extracting' | 'parsing' | 'deduping' | 'saving' | 'completed' | 'duplicate' | 'failed';
  result?: any;
  error?: string;
}

/**
 * ProgressService — SSE 实时进度推送
 *
 * 单实例模式: 内存 Subject
 * 多实例模式: 需要 Redis Pub/Sub 桥接 (Phase 2 后续)
 */
@Injectable()
export class ProgressService {
  private subjects = new Map<string, Subject<JobProgress>>();

  emit(event: JobProgress) {
    const key = event.batchId || event.jobId;
    if (!this.subjects.has(key)) {
      this.subjects.set(key, new Subject<JobProgress>());
    }
    this.subjects.get(key)!.next(event);

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
}
