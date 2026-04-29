import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { ParsingV2Service, ParseJobData } from '../ai/parsing-v2.service';
import { ProgressService, JobProgress } from '../candidate/progress.service';

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
  ) {
    super();
  }

  async process(job: Job<ParseJobData>) {
    const { fileName, batchId } = job.data;

    const emit = (status: string, progress: number) => {
      const event: JobProgress = {
        jobId: job.id!,
        batchId,
        fileName,
        progress,
        status: status as JobProgress['status'],
      };
      this.progress.emit(event);
      job.updateProgress(progress).catch(() => {});
    };

    try {
      // ParsingV2Service 内部从 MinIO 读取文件
      const result = await this.parsingV2.parseResume(job.data, emit);

      if (result.status === 'duplicate') {
        emit('duplicate', 100);
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
      emit('failed', job.progress as number);

      // BullMQ 会根据 attempts + backoff 自动重试
      throw error;
    }
  }
}
