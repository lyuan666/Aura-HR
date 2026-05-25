import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './notification.dto';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    const userId = req.user?.sub;
    return this.notificationService.findAll(userId, Number(page), Number(pageSize));
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.sub;
    return this.notificationService.markAsRead(id, userId);
  }

  @Patch('read-all')
  markAllAsRead(@Req() req: any) {
    const userId = req.user?.sub;
    return this.notificationService.markAllAsRead(userId);
  }

  @Get('unread-count')
  getUnreadCount(@Req() req: any) {
    const userId = req.user?.sub;
    return this.notificationService.getUnreadCount(userId);
  }

  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationService.create(dto);
  }
}
