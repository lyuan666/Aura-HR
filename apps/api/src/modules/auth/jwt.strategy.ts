import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { UserEntity } from '../../entities/user.entity';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tenantId?: string;
  enterpriseId?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'dev-secret-key',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('用户不存在或已禁用');
    }

    let tenantId = user.tenantId || payload.tenantId;
    const enterpriseId = user.enterpriseId || payload.enterpriseId;
    if (user.role === 'hr_client') {
      if (!tenantId) {
        throw new UnauthorizedException('客户 HR 账号缺少租户范围');
      }
      if (!enterpriseId) {
        throw new UnauthorizedException('客户 HR 账号缺少企业范围');
      }
    }

    if (!tenantId) {
      tenantId = crypto.randomUUID();
    }

    if (user.tenantId !== tenantId) {
      user.tenantId = tenantId;
      await this.userRepo.save(user);
    }

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId,
      enterpriseId,
    };
  }
}
