import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import {
  LoginDto,
  RegisterDto,
  UpdateLayoutDto,
  UpdateProfileDto,
  UpdateSettingsConfigDto,
} from './auth.dto';
import { UserEntity } from '../../entities/user.entity';
import { RefreshTokenEntity } from '../../entities/refresh-token.entity';
import { getJwtRefreshSecret } from '../../common/config/jwt-config';

type SettingsConfig = Required<UpdateSettingsConfigDto>;

interface JwtRefreshPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string;
  enterpriseId?: string;
}

const DEFAULT_SETTINGS_CONFIG: SettingsConfig = {
  mfa: false,
  auditLog: false,
  apiKey: false,
  glm4: false,
  deepParse: false,
  autoInvite: false,
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepo: Repository<RefreshTokenEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('该邮箱已注册');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      ...dto,
      tenantId: crypto.randomUUID(),
      password: hashedPassword,
      role: 'consultant',
      isActive: true,
    });

    const saved = await this.userRepo.save(user);
    return this.generateTokens(saved);
  }

  async login(dto: LoginDto) {
    const isEmail = dto.account.includes('@');
    const where = isEmail
      ? { email: dto.account }
      : { phone: dto.account };
    const user = await this.userRepo.findOne({ where });
    if (!user) throw new UnauthorizedException('账号或密码错误');

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('账号或密码错误');
    if (!user.isActive) throw new UnauthorizedException('账号已被禁用');

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);

    // Check if token was stored and not revoked
    const stored = await this.refreshTokenRepo.findOne({
      where: { tokenHash },
    });
    if (!stored || stored.isRevoked) {
      // If a revoked token was reused, invalidate entire family (rotation attack detection)
      if (stored?.familyId) {
        await this.refreshTokenRepo.update(
          { familyId: stored.familyId },
          { isRevoked: true },
        );
      }
      throw new UnauthorizedException('Refresh token 无效或已过期');
    }

    try {
      const refreshSecret = getJwtRefreshSecret(this.configService);
      const payload = this.jwtService.verify<JwtRefreshPayload>(refreshToken, {
        secret: refreshSecret,
      });
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user || !user.isActive)
        throw new UnauthorizedException('用户不存在或已禁用');

      // Revoke the used token
      stored.isRevoked = true;
      await this.refreshTokenRepo.save(stored);

      return this.generateTokens(user, stored.familyId);
    } catch {
      throw new UnauthorizedException('Refresh token 无效或已过期');
    }
  }

  async revokeAllUserTokens(userId: string) {
    await this.refreshTokenRepo.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    return this.toProfile(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepo.findOne({
        where: { email: dto.email },
      });
      if (existing) throw new ConflictException('该邮箱已注册');
      user.email = dto.email;
    }

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.avatar !== undefined) user.avatar = dto.avatar;

    const saved = await this.userRepo.save(user);
    return this.toProfile(saved);
  }

  async getSettingsConfig(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    const dashboardConfig = this.asConfigObject(user.dashboardLayoutConfig);
    return this.normalizeSettingsConfig(dashboardConfig.settingsConfig);
  }

  async updateSettingsConfig(userId: string, dto: UpdateSettingsConfigDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    const currentConfig = this.asConfigObject(user.dashboardLayoutConfig);
    const nextSettings = this.normalizeSettingsConfig({
      ...this.normalizeSettingsConfig(currentConfig.settingsConfig),
      ...dto,
    });

    user.dashboardLayoutConfig = {
      ...currentConfig,
      settingsConfig: nextSettings,
    };
    await this.userRepo.save(user);

    return nextSettings;
  }

  async updateLayout(userId: string, layout: UpdateLayoutDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    user.dashboardLayoutConfig = {
      ...this.asConfigObject(user.dashboardLayoutConfig),
      ...layout,
    };
    await this.userRepo.save(user);

    return { success: true };
  }

  private toProfile(user: UserEntity) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      enterpriseId: user.enterpriseId,
      avatar: user.avatar,
      phone: user.phone,
      dashboardLayoutConfig: user.dashboardLayoutConfig,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private asConfigObject(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? { ...(value as Record<string, unknown>) }
      : {};
  }

  private normalizeSettingsConfig(value: unknown): SettingsConfig {
    const source = this.asConfigObject(value);
    return Object.fromEntries(
      Object.entries(DEFAULT_SETTINGS_CONFIG).map(([key, defaultValue]) => [
        key,
        typeof source[key] === 'boolean' ? source[key] : defaultValue,
      ]),
    ) as SettingsConfig;
  }

  private async generateTokens(user: UserEntity, familyId?: string) {
    const userWithTenant = await this.ensureTenant(user);
    const payload = {
      sub: userWithTenant.id,
      email: userWithTenant.email,
      role: userWithTenant.role,
      tenantId: userWithTenant.tenantId,
      enterpriseId: userWithTenant.enterpriseId,
    };
    const refreshSecret = getJwtRefreshSecret(this.configService);
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '30d',
    ) as StringValue;

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    });

    // Store refresh token hash for revocation tracking
    const family = familyId || crypto.randomUUID();
    const tokenEntity = this.refreshTokenRepo.create({
      userId: userWithTenant.id,
      tokenHash: this.hashToken(refreshToken),
      familyId: family,
      isRevoked: false,
    });
    await this.refreshTokenRepo.save(tokenEntity);

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken,
      user: {
        id: userWithTenant.id,
        email: userWithTenant.email,
        name: userWithTenant.name,
        role: userWithTenant.role,
        tenantId: userWithTenant.tenantId,
        enterpriseId: userWithTenant.enterpriseId,
        dashboardLayoutConfig: userWithTenant.dashboardLayoutConfig,
      },
    };
  }

  private async ensureTenant(user: UserEntity) {
    if (user.tenantId) return user;

    user.tenantId = crypto.randomUUID();
    return this.userRepo.save(user);
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
