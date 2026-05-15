import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const logger = new Logger('JwtConfig');

const FORBIDDEN_VALUES = new Set([
  'dev-secret-key',
  'dev-refresh-secret',
  'your-super-secret-jwt-key-change-in-production',
  'your-refresh-secret-key-change-in-production',
  'CHANGE_ME_JWT_SECRET',
  'CHANGE_ME_JWT_REFRESH_SECRET',
]);

function readSecret(
  configService: ConfigService,
  key: 'JWT_SECRET' | 'JWT_REFRESH_SECRET',
): string {
  const value = configService.get<string>(key);
  const env = (process.env.NODE_ENV || 'development').toLowerCase();
  const isProd = env === 'production';

  if (!value || value.trim().length === 0) {
    if (isProd) {
      throw new Error(
        `[JwtConfig] ${key} 必须在生产环境配置，禁止 fallback 到默认值。请检查 apps/api/.env 或部署 env 注入。`,
      );
    }
    logger.warn(
      `[JwtConfig] ${key} 未配置，开发模式下使用临时随机值（仅本进程有效）。生产环境会直接拒绝启动。`,
    );
    // 开发态用进程级随机值，强迫开发者也得登录一次（等同于真实场景），
    // 同时杜绝跨进程"看起来能跑"的假象。
    return `dev-only-${process.pid}-${Date.now()}`;
  }

  if (FORBIDDEN_VALUES.has(value)) {
    if (isProd) {
      throw new Error(
        `[JwtConfig] ${key} 使用了已知占位/默认值"${value}"，生产环境禁止。请改为强随机密钥（建议 openssl rand -base64 48）。`,
      );
    }
    logger.warn(
      `[JwtConfig] ${key} 是占位值"${value}"，开发模式接受但生产环境会拒绝启动。`,
    );
  }

  if (value.length < 16) {
    logger.warn(
      `[JwtConfig] ${key} 长度只有 ${value.length}，建议至少 32 字符的强随机密钥。`,
    );
  }

  return value;
}

export function getJwtAccessSecret(configService: ConfigService): string {
  return readSecret(configService, 'JWT_SECRET');
}

export function getJwtRefreshSecret(configService: ConfigService): string {
  return readSecret(configService, 'JWT_REFRESH_SECRET');
}
