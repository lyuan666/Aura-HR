import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { ParsingV2Service, ParseJobData } from '../ai/parsing-v2.service';
import { ProgressService, JobProgress } from '../candidate/progress.service';
import { SHARED_REDIS } from '../redis/redis.module';

const MATCH_TYPE_LABELS: Record<string, string> = {
  text_hash: '简历内容完全一致',
  file_hash: '上传文件完全一致',
  phone: '手机号一致',
  email: '邮箱一致',
  phone_or_email: '手机号或邮箱一致',
  'name+company_fuzzy': '姓名 + 公司名相似',
  name_source: '姓名 + 来源平台一致',
  name_company: '姓名 + 当前公司一致',
};

// Redis 暂存 key 前缀。决策接口用相同 key 拿回 jobData + matchType + existingId。
// TTL 1h：足够用户在 Modal 上做选择；过期则视为放弃。
export const DUP_PENDING_KEY_PREFIX = 'candidate:dup-pending:';
export const DUP_PENDING_TTL_SECONDS = 60 * 60;

@Processor('parse-resume', {
  lockDuration: 300000, // 5 min — must exceed max LLM call time
  concurrency: 3,
})
export class ParseResumeProcessor extends WorkerHost {
  private readonly logger = new Logger(ParseResumeProcessor.name);

  constructor(
    @Inject(forwardRef(() => ParsingV2Service))
    private readonly parsingV2: ParsingV2Service,
    @Inject(forwardRef(() => ProgressService))
    private readonly progress: ProgressService,
    @InjectQueue('vectorize') private readonly vectorizeQueue: Queue,
    @Inject(SHARED_REDIS)
    private readonly redis: any,
  ) {
    super();
  }

  async process(job: Job<ParseJobData>) {
    const { fileName, batchId } = job.data;

    const emit = (status: string, progress: number, extra?: Partial<JobProgress>) => {
      const event: JobProgress = {
        jobId: job.id!,
        batchId,
        fileName,
        progress,
        status: status as JobProgress['status'],
        ...(extra || {}),
      };
      this.progress.emit(event);
      job.updateProgress(progress).catch(() => {});
    };

    try {
      // ParsingV2Service 内部从 MinIO 读取文件
      const result = await this.parsingV2.parseResume(
        job.data,
        (status, progress) => emit(status, progress),
      );

      if (result.status === 'duplicate') {
        const matchType = (result as any).matchField || 'unknown';
        const existing: any = (result as any).existing;
        // 暂存决策上下文：决策接口需要 jobData 来重跑解析（replace 路径）+ existingId（覆盖目标）
        await this.redis
          .setex(
            `${DUP_PENDING_KEY_PREFIX}${job.id}`,
            DUP_PENDING_TTL_SECONDS,
            JSON.stringify({
              jobData: job.data,
              existingCandidateId: (result as any).candidateId,
              matchType,
            }),
          )
          .catch((err: any) => {
            this.logger.warn(`暂存 dup 决策上下文失败 jobId=${job.id}: ${err.message}`);
          });

        emit('duplicate', 100, {
          duplicate: {
            matchType,
            matchTypeLabel: MATCH_TYPE_LABELS[matchType] || matchType,
            confidence: (result as any).confidence ?? 0,
            existing: existing
              ? {
                  id: existing.id,
                  name: existing.name,
                  phone: existing.phone,
                  email: existing.email,
                  currentCompany: existing.currentCompany,
                  currentTitle: existing.currentTitle,
                  updatedAt: existing.updatedAt
                    ? new Date(existing.updatedAt).toISOString()
                    : null,
                  sourcePlatform: existing.sourcePlatform,
                }
              : { id: (result as any).candidateId },
          },
        });
        return result;
      }

      // 投递向量化任务 (确定性 jobId 防重复)
      if (result.candidateId) {
        await this.vectorizeQueue.add(
          'vectorize',
          { candidateId: result.candidateId },
          { jobId: `vec-${result.candidateId}` },
        );
      }

      return result;
    } catch (error: any) {
      this.logger.error(`parse-resume job ${job.id} failed: ${error.message}`);
      emit('failed', job.progress as number, { error: error.message || '解析任务失败' });

      // BullMQ 会根据 attempts + backoff 自动重试
      throw error;
    }
  }
}
