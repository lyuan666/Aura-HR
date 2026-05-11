import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { FeishuNotificationService } from './feishu-notification.service';
import { NotificationController } from './notification.controller';
import { NotificationConfigEntity } from '../../entities/notification-config.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([NotificationConfigEntity])],
  providers: [NotificationService, FeishuNotificationService],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
