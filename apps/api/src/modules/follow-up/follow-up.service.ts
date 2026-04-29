import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateFollowUpDto, GenerateFollowUpStrategyDto } from './follow-up.dto';
import { FollowUpEntity } from '../../entities/follow-up.entity';
import { AiService } from '../ai/ai.service';
import { AuditLogEntity } from '../../entities/audit-log.entity';

@Injectable()
export class FollowUpService {
  private readonly logger = new Logger(FollowUpService.name);

  constructor(
    @InjectRepository(FollowUpEntity)
    private readonly followUpRepo: Repository<FollowUpEntity>,
    @InjectRepository(AuditLogEntity)
    private readonly auditRepo: Repository<AuditLogEntity>,
    private readonly aiService: AiService,
  ) {}

  async findAll(page = 1, pageSize = 20, targetType?: string, targetId?: string, tenantId?: string) {
    const where: any = {};
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;
    if (tenantId) where.tenantId = tenantId;

    const [items, total] = await this.followUpRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { items, total, page, pageSize };
  }

  async create(dto: CreateFollowUpDto, tenantId?: string, userId: string = 'system') {
    const followUp = this.followUpRepo.create({
      ...dto,
      userId,
      tenantId,
      nextFollowUpAt: dto.nextFollowUpAt ? new Date(dto.nextFollowUpAt) : undefined,
    });

    return await this.followUpRepo.save(followUp);
  }

  /**
   * 使用 AI 生成跟进计划建议
   */
  async generateStrategy(dto: GenerateFollowUpStrategyDto) {
    // 获取最近的跟进记录作为上下文
    const history = await this.followUpRepo.find({
      where: { targetId: dto.targetId, targetType: dto.targetType },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const context = history.map((h) => `${h.createdAt.toISOString()}: ${h.content}`).join('\n');
    
    // 这里需要扩展 AiService 中的方法
    return await this.aiService.generateFollowUpStrategy(context, dto.targetType);
  }

  /**
   * 定时任务：扫描即将到期的跟进提醒 (每小时执行一次)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleReminders() {
    this.logger.debug('Scanning for follow-up reminders...');
    
    const now = new Date();
    const reminders = await this.followUpRepo.find({
      where: {
        nextFollowUpAt: LessThanOrEqual(now),
      },
    });

    for (const reminder of reminders) {
      // 检查是否已经记录过提醒，避免重复 (简单处理：检查最近的 AuditLog)
      const existingLog = await this.auditRepo.findOne({
        where: {
          action: 'FOLLOW_UP_REMINDER',
          resourceId: reminder.id,
        },
      });

      if (!existingLog) {
        this.logger.log(`Reminder for ${reminder.targetType} ${reminder.targetId}: ${reminder.content}`);
        
        // 记录到审计日志中，以便前端展示
        await this.auditRepo.save(this.auditRepo.create({
          action: 'FOLLOW_UP_REMINDER',
          resource: reminder.targetType,
          resourceId: reminder.targetId,
          details: {
            message: `跟进提醒：${reminder.content.substring(0, 50)}...`,
          },
          userId: 'system',
        }));
      }
    }
  }
}
