import { Body, Controller, Get, Put, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UpdateSettingsConfigDto } from './auth.dto';

interface RequestWithUser extends Request {
  user: {
    sub: string;
  };
}

@Controller('settings')
export class SettingsController {
  constructor(private readonly authService: AuthService) {}

  @Get('config')
  getConfig(@Request() req: RequestWithUser) {
    return this.authService.getSettingsConfig(req.user.sub);
  }

  @Put('config')
  updateConfig(
    @Request() req: RequestWithUser,
    @Body() dto: UpdateSettingsConfigDto,
  ) {
    return this.authService.updateSettingsConfig(req.user.sub, dto);
  }
}
