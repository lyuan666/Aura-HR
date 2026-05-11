import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactEntity } from '../../entities/contact.entity';
import { NotificationService } from '../notification/notification.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthClientService {
  private readonly logger = new Logger(AuthClientService.name);

  constructor(
    @InjectRepository(ContactEntity)
    private readonly contactRepo: Repository<ContactEntity>,
    private readonly jwtService: JwtService,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 发起登录请求，生成 Magic Link 并发送
   */
  async requestMagicLink(email: string) {
    const contact = await this.contactRepo.findOne({
      where: { email },
      relations: ['enterprise'],
    });

    if (!contact) {
      // 这里的策略是：即使没找到也返回成功，防止邮箱枚举攻击
      this.logger.warn(`Magic link requested for unknown email: ${email}`);
      return { message: '如果邮箱存在，登录链接已发送' };
    }

    // 生成短效 Token (15分钟)
    const token = this.jwtService.sign(
      { 
        sub: contact.id, 
        email: contact.email, 
        type: 'magic_link',
        tenantId: contact.tenantId,
        enterpriseId: contact.enterpriseId 
      },
      { expiresIn: '15m' },
    );

    const magicLink = `${this.configService.get('FRONTEND_URL')}/client/login/verify?token=${token}`;

    this.logger.log(`Generated Magic Link for ${email}: ${magicLink}`);

    // 发送通知 (模拟发送，或者如果有飞书通知配置则发送)
    await this.notificationService.notify(contact.tenantId, 'status_change', {
      title: '甲方客户门户登录验证',
      content: `您的登录验证链接已生成，请在 15 分钟内点击：${magicLink}`,
      url: magicLink,
    }).catch(err => this.logger.error('Failed to send magic link via notification', err));

    return { message: '登录链接已发送', debugLink: process.env.NODE_ENV !== 'production' ? magicLink : undefined };
  }

  /**
   * 验证 Magic Link Token 并生成正式 Access Token
   */
  async loginWithToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'magic_link') {
        throw new UnauthorizedException('无效的 Token 类型');
      }

      const contact = await this.contactRepo.findOne({
        where: { id: payload.sub },
        relations: ['enterprise'],
      });

      if (!contact) {
        throw new UnauthorizedException('客户联系人不存在');
      }

      // 生成正式的 Client Token
      const accessToken = this.jwtService.sign({
        sub: contact.id,
        email: contact.email,
        name: contact.name,
        role: 'hr_client',
        tenantId: contact.tenantId,
        enterpriseId: contact.enterpriseId,
      });

      return {
        access_token: accessToken,
        user: {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          role: 'hr_client',
          enterprise: contact.enterprise?.name,
        },
      };
    } catch (e) {
      throw new UnauthorizedException('链接已失效或无效');
    }
  }
}
