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
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { RegisterDto, LoginDto } from './auth.dto';
import { UserEntity } from '../../entities/user.entity';
import { RefreshTokenEntity } from '../../entities/refresh-token.entity';

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
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('该邮箱已注册');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      ...dto,
      password: hashedPassword,
      role: 'consultant',
      isActive: true,
    });

    const saved = await this.userRepo.save(user);
    return this.generateTokens(saved);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('邮箱或密码错误');

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.password,
    );
    if (!isPasswordValid) throw new UnauthorizedException('邮箱或密码错误');
    if (!user.isActive) throw new UnauthorizedException('账号已被禁用');

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);

    // Check if token was stored and not revoked
    const stored = await this.refreshTokenRepo.findOne({ where: { tokenHash } });
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
      const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'dev-refresh-secret';
      const payload = this.jwtService.verify(refreshToken, { secret: refreshSecret });
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user || !user.isActive) throw new UnauthorizedException('用户不存在或已禁用');

      // Revoke the used token
      stored.isRevoked = true;
      await this.refreshTokenRepo.save(stored);

      return this.generateTokens(user, stored.familyId);
    } catch {
      throw new UnauthorizedException('Refresh token 无效或已过期');
    }
  }

  async revokeAllUserTokens(userId: string) {
    await this.refreshTokenRepo.update({ userId, isRevoked: false }, { isRevoked: true });
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    const { password: _, ...result } = user;
    return result;
  }

  async updateLayout(userId: string, layout: any) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    user.dashboardLayoutConfig = layout;
    await this.userRepo.save(user);

    return { success: true };
  }

  private async generateTokens(user: UserEntity, familyId?: string) {
    const payload = { sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId };
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'dev-refresh-secret';
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn as any,
    });

    // Store refresh token hash for revocation tracking
    const family = familyId || crypto.randomUUID();
    const tokenEntity = this.refreshTokenRepo.create({
      userId: user.id,
      tokenHash: this.hashToken(refreshToken),
      familyId: family,
      isRevoked: false,
    });
    await this.refreshTokenRepo.save(tokenEntity);

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        dashboardLayoutConfig: user.dashboardLayoutConfig,
      },
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
