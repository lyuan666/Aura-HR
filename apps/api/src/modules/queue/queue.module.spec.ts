import { shouldRegisterQueueProcessors } from './queue.module';

describe('shouldRegisterQueueProcessors', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.QUEUE_WORKERS_ENABLED;
    delete process.env.WORKER_ONLY;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('does not register workers in the production API process by default', () => {
    process.env.NODE_ENV = 'production';

    expect(shouldRegisterQueueProcessors()).toBe(false);
  });

  it('registers workers for the Mac mini worker process', () => {
    process.env.NODE_ENV = 'production';
    process.env.WORKER_ONLY = 'true';

    expect(shouldRegisterQueueProcessors()).toBe(true);
  });
});
