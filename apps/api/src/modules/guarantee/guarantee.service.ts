import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { GuaranteeTrackingEntity } from '../../entities/guarantee-tracking.entity';
import { RecommendationEntity } from '../../entities/recommendation.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StateMachine, GUARANTEE_TRANSITIONS } from '../../common/utils/state-machine';

@Injectable()
export class GuaranteeService {
  private readonly logger = new Logger(GuaranteeService.name);
  private readonly stateMachine = new StateMachine(GUARANTEE_TRANSITIONS);

  constructor(
    @InjectRepository(GuaranteeTrackingEntity)
    private readonly guaranteeRepo: Repository<GuaranteeTrackingEntity>,
    @InjectRepository(RecommendationEntity)
    private readonly recRepo: Repository<RecommendationEntity>,
  ) {}

  async startTracking(recommendationId: string, tenantId?: string) {
    const rec = await this.recRepo.findOne({ where: { id: recommendationId, ...(tenantId ? { tenantId } : {}) } });
    if (!rec) throw new NotFoundException('Recommendation not found');

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3); // 默认 3 个月保质期

    const tracking = this.guaranteeRepo.create({
      recommendationId,
      tenantId: rec.tenantId,
      startDate,
      endDate,
      status: 'tracking',
    });

    return this.guaranteeRepo.save(tracking);
  }

  async markAsFailed(recommendationId: string, reason: string, tenantId?: string) {
    const tracking = await this.guaranteeRepo.findOne({ 
      where: { recommendationId, ...(tenantId ? { tenantId } : {}) } 
    });
    if (!tracking) throw new NotFoundException('Tracking record not found');

    this.stateMachine.validateTransition(tracking.status, 'failed');
    tracking.status = 'failed';
    tracking.failDate = new Date();
    tracking.failReason = reason;

    return this.guaranteeRepo.save(tracking);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkGuaranteeExpiry() {
    this.logger.log('Checking for expired guarantee periods...');
    
    const expired = await this.guaranteeRepo.find({
      where: {
        status: 'tracking',
        endDate: LessThanOrEqual(new Date()),
      },
    });

    if (expired.length > 0) {
      this.logger.log(`Found ${expired.length} records to mark as finished`);
      for (const record of expired) {
        record.status = 'finished';
        await this.guaranteeRepo.save(record);
      }
    }
  }

  async findAll(page = 1, pageSize = 20, tenantId?: string) {
    const [items, total] = await this.guaranteeRepo.findAndCount({
      where: tenantId ? { tenantId } : {},
      relations: ['recommendation', 'recommendation.candidate', 'recommendation.jobPosition'],
      order: { endDate: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { items, total, page, pageSize };
  }
}
