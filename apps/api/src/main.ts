import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SafetyGuardInterceptor } from './common/interceptors/safety-guard.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局前缀
  app.setGlobalPrefix('api');

  // CORS
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 全局安全熔断拦截器 (防止循环引用导致的内存爆炸)
  app.useGlobalInterceptors(new SafetyGuardInterceptor());

  const port = process.env.API_PORT || 3001;
  if (process.env.WORKER_ONLY === 'true') {
    // Worker 模式: 只启动 BullMQ processors, 不监听 HTTP
    await app.init();
    console.log(`Worker 模式已启动 (PID: ${process.pid})`);
  } else {
    await app.listen(port);
    console.log(`API 服务已启动: http://localhost:${port}/api`);
  }
}
bootstrap().catch((err) => {
  console.error('Failed to start API:', err);
  process.exit(1);
});
