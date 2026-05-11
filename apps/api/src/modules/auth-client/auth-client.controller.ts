import { Controller, Post, Body, Query } from '@nestjs/common';
import { AuthClientService } from './auth-client.service';

@Controller('auth-client')
export class AuthClientController {
  constructor(private readonly authClientService: AuthClientService) {}

  @Post('magic-link/request')
  async requestLink(@Body('email') email: string) {
    return await this.authClientService.requestMagicLink(email);
  }

  @Post('magic-link/login')
  async login(@Body('token') token: string) {
    return await this.authClientService.loginWithToken(token);
  }
}
