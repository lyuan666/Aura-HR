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
import * as bcrypt from 'bcryptjs';
import { RegisterDto, LoginDto } from './auth.dto';
import { UserEntity } from '../../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
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
    try {
      const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET', 'dev-refresh-secret');
      const payload = this.jwtService.verify(refreshToken, { secret: refreshSecret });
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user || !user.isActive) throw new UnauthorizedException('用户不存在或已禁用');
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Refresh token 无效或已过期');
    }
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

  private generateTokens(user: UserEntity) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET', 'dev-refresh-secret');
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn as any,
      }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        dashboardLayoutConfig: user.dashboardLayoutConfig,
      },
    };
  }
}
