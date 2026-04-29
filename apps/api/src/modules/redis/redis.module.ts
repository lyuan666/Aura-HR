import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const SHARED_REDIS = 'SHARED_REDIS';

const redisProvider = {
  provide: SHARED_REDIS,
  useFactory: () => {
    const redisUrl = new URL(REDIS_URL);
    return new Redis({
      host: redisUrl.hostname || 'localhost',
      port: parseInt(redisUrl.port || '6379', 10),
      password: redisUrl.password || undefined,
      maxRetriesPerRequest: null,
    });
  },
};

@Global()
@Module({
  providers: [redisProvider],
  exports: [redisProvider],
})
export class RedisModule {}
