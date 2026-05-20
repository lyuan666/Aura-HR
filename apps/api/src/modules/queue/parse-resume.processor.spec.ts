import { ParseResumeProcessor } from './parse-resume.processor';

describe('ParseResumeProcessor retry progress', () => {
  const createProcessor = (parseError: any) => {
    const parsingV2 = {
      parseResume: jest.fn().mockRejectedValue(parseError),
    };
    const progress = {
      emit: jest.fn(),
    };
    const processor = new ParseResumeProcessor(
      parsingV2 as any,
      progress as any,
      { add: jest.fn() } as any,
      { setex: jest.fn() } as any,
    );

    return { processor, progress };
  };

  const createJob = (attemptsMade: number, attempts = 3) =>
    ({
      id: 'job-1',
      data: {
        fileName: 'resume.pdf',
        batchId: 'batch-1',
      },
      attemptsMade,
      opts: { attempts },
      progress: 50,
      updateProgress: jest.fn().mockResolvedValue(undefined),
    }) as any;

  it('keeps the SSE item in parsing state while BullMQ will retry', async () => {
    const { processor, progress } = createProcessor(
      new Error('Request failed with status code 429'),
    );

    await expect(processor.process(createJob(0))).rejects.toThrow('429');

    expect(progress.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'parsing',
        progress: 50,
        error: expect.stringContaining('正在重试'),
      }),
    );
    expect(progress.emit).not.toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed' }),
    );
  });

  it('emits a friendly failed message only after retries are exhausted', async () => {
    const { processor, progress } = createProcessor({
      response: { status: 429 },
      message: 'Request failed with status code 429',
    });

    await expect(processor.process(createJob(2))).rejects.toMatchObject({
      response: { status: 429 },
    });

    expect(progress.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        progress: 50,
        error: '简历解析服务暂时繁忙，请稍后重试',
      }),
    );
  });
});
