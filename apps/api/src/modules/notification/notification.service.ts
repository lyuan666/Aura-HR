import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity, NotificationType } from '../../entities/notification.entity';
import { CreateNotificationDto } from './notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
  ) {}

  async findAll(userId: string, page = 1, pageSize = 20) {
    const [items, total] = await this.notificationRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { items, total, page, pageSize };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationRepo.findOne({
      where: { id, userId },
    });
    if (!notification) {
      return null;
    }
    notification.read = true;
    return await this.notificationRepo.save(notification);
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepo.update(
      { userId, read: false },
      { read: true },
    );
    return { success: true };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationRepo.count({
      where: { userId, read: false },
    });
    return { count };
  }

  async create(dto: CreateNotificationDto) {
    const notification = this.notificationRepo.create({
      userId: dto.userId,
      type: dto.type ?? NotificationType.SYSTEM,
      title: dto.title,
      content: dto.content,
      relatedId: dto.relatedId ?? undefined,
    });
    return await this.notificationRepo.save(notification);
  }
}
