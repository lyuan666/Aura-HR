import { firstValueFrom, take, toArray } from 'rxjs';
import { ProgressService, JobProgress } from './progress.service';

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    publish: jest.fn().mockResolvedValue(1),
    setex: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
  }));
});

describe('ProgressService', () => {
  it('replays the latest progress event when SSE subscribes after the worker emitted', async () => {
    const service = new ProgressService();
    const event: JobProgress = {
      jobId: 'job-1',
      batchId: 'batch-1',
      fileName: 'resume.pdf',
      progress: 100,
      status: 'duplicate',
      duplicate: {
        matchType: 'text_hash',
        matchTypeLabel: '简历内容完全一致',
        confidence: 0.99,
        existing: { id: 'candidate-1', name: '施娟' },
      },
    };

    service.emit(event);

    const messages = await firstValueFrom(
      service.getStream('batch-1').pipe(take(2), toArray()),
    );

    expect(messages[0].data).toContain('"type":"connected"');
    expect(messages[1].data).toContain('"type":"progress"');
    expect(messages[1].data).toContain('"status":"duplicate"');

    service.onModuleDestroy();
  });

  it('can replay by job id as well as batch id', async () => {
    const service = new ProgressService();
    service.emit({
      jobId: 'job-2',
      batchId: 'batch-2',
      fileName: 'resume.pdf',
      progress: 100,
      status: 'completed',
    });

    const messages = await firstValueFrom(
      service.getStream('job-2').pipe(take(2), toArray()),
    );

    expect(messages[1].data).toContain('"status":"completed"');

    service.onModuleDestroy();
  });
});
