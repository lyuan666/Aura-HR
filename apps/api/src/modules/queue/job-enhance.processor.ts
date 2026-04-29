import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { JobService } from '../job/job.service';

interface JobEnhanceData {
  jobId: string;
  description: string;
}

@Processor('job-enhance', {
  lockDuration: 120000,
  concurrency: 3,
})
export class JobEnhanceProcessor extends WorkerHost {
  private readonly logger = new Logger(JobEnhanceProcessor.name);

  constructor(
    @Inject(forwardRef(() => JobService))
    private readonly jobService: JobService,
  ) {
    super();
  }

  async process(job: Job<JobEnhanceData>) {
    const { jobId, description } = job.data;
    this.logger.log(`Enhancing job ${jobId}`);
    await this.jobService.enhanceJobAsync(jobId, description);
    this.logger.log(`Job ${jobId} enhanced successfully`);
  }
}
