import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractEntity } from '../../entities/contract.entity';
import { AuditLogEntity } from '../../entities/audit-log.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  StateMachine,
  CONTRACT_TRANSITIONS,
} from '../../common/utils/state-machine';
import { StorageService } from '../storage/storage.service';
import { randomUUID } from 'crypto';

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);
  private readonly stateMachine = new StateMachine(CONTRACT_TRANSITIONS);

  constructor(
    @InjectRepository(ContractEntity)
    private readonly contractRepo: Repository<ContractEntity>,
    @InjectRepository(AuditLogEntity)
    private readonly auditRepo: Repository<AuditLogEntity>,
    private readonly storage: StorageService,
  ) {}

  async findAll(page = 1, pageSize = 20, user: any, query?: { enterpriseId?: string; status?: string }) {
    const where: any = {};
    if (user?.role !== 'admin') {
      if (user?.role === 'hr_client') {
        where.enterpriseId = user.enterpriseId;
      } else {
        where.tenantId = user?.tenantId;
      }
    }

    if (query?.enterpriseId) {
      if (user?.role !== 'admin' && user?.role === 'hr_client' && user.enterpriseId !== query.enterpriseId) {
        where.enterpriseId = 'unauthorized';
      } else {
        where.enterpriseId = query.enterpriseId;
      }
    }

    if (query?.status) {
      where.status = query.status;
    }

    const [items, total] = await this.contractRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user?.role !== 'admin') {
      if (user?.role === 'hr_client') {
        where.enterpriseId = user.enterpriseId;
      } else {
        where.tenantId = user?.tenantId;
      }
    }

    const contract = await this.contractRepo.findOne({ where });
    if (!contract) throw new NotFoundException('合同不存在');
    return contract;
  }

  async create(dto: any, user: any) {
    const tenantId = user?.role !== 'admin' ? user?.tenantId : dto.tenantId;
    const contract = this.contractRepo.create({
      ...dto,
      tenantId,
      status: 'draft',
    });
    return this.contractRepo.save(contract);
  }

  async updateStatus(id: string, status: string, user: any) {
    const contract = await this.findOne(id, user);
    this.stateMachine.validateTransition(contract.status, status);
    await this.contractRepo.update(id, { status });
    return this.findOne(id, user);
  }

  async uploadAndCreate(
    file: Express.Multer.File,
    body: any,
    user: any,
  ) {
    const tenantId = user?.role !== 'admin' ? user?.tenantId : body.tenantId;
    const safeName = file.originalname.replace(/[/\\]/g, '_');
    const fileKey = `contracts/${tenantId || 'global'}/${randomUUID()}-${safeName}`;

    await this.storage.putObject(
      'uploads',
      fileKey,
      file.buffer,
      file.size,
      file.mimetype,
    );

    const contract = this.contractRepo.create({
      enterpriseId: body.enterpriseId || 'unknown',
      contractNo: body.contractNo || `CT-${Date.now()}`,
      title: body.title || file.originalname,
      amount: body.amount || 0,
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
      endDate: body.endDate ? new Date(body.endDate) : new Date(),
      status: 'draft',
      fileUrl: fileKey,
      notes: body.notes || '',
      tenantId,
    });
    return this.contractRepo.save(contract);
  }

  async getEnterpriseStats(enterpriseId: string, user: any) {
    const where: any = { enterpriseId };
    if (user?.role !== 'admin') {
      if (user?.role === 'hr_client') {
        if (user.enterpriseId !== enterpriseId) {
          throw new ForbiddenException('您无权查看此企业的数据');
        }
      } else {
        where.tenantId = user?.tenantId;
      }
    }

    const allContracts = await this.contractRepo.find({ where });
    
    let totalCount = allContracts.length;
    let activeCount = 0;
    let expiredSoonCount = 0;
    let totalAmount = 0;

    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(now.getDate() + 30);

    for (const c of allContracts) {
      if (c.status === 'active') {
        activeCount++;
        totalAmount += Number(c.amount || 0);

        if (c.endDate && new Date(c.endDate) >= now && new Date(c.endDate) <= thirtyDaysLater) {
          expiredSoonCount++;
        }
      }
    }

    return {
      totalCount,
      activeCount,
      expiredSoonCount,
      totalAmount,
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkContractExpirations() {
    this.logger.log('Scanning for expiring contracts...');
    const now = new Date();
    
    const activeContracts = await this.contractRepo.find({
      where: { status: 'active' },
    });

    for (const contract of activeContracts) {
      if (!contract.endDate) continue;

      const endDate = new Date(contract.endDate);
      const alertDays = contract.alertDays ?? 30;
      
      const alertThresholdDate = new Date(endDate);
      alertThresholdDate.setDate(endDate.getDate() - alertDays);

      if (now >= alertThresholdDate && now <= endDate) {
        const remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        const existingAlert = await this.auditRepo.findOne({
          where: {
            action: 'CONTRACT_EXPIRATION_ALERT',
            resourceId: contract.id,
          },
        });

        if (!existingAlert) {
          this.logger.warn(`Contract ${contract.title} (${contract.contractNo}) is expiring in ${remainingDays} days!`);
          
          await this.auditRepo.save(this.auditRepo.create({
            tenantId: contract.tenantId || undefined,
            userId: 'system',
            action: 'CONTRACT_EXPIRATION_ALERT',
            resource: 'contract',
            resourceId: contract.id,
            details: {
              contractNo: contract.contractNo,
              title: contract.title,
              endDate: contract.endDate,
              remainingDays,
              message: `合同到期预警：合同【${contract.title}】（编号：${contract.contractNo}）将于 ${endDate.toLocaleDateString('zh-CN')} 到期，剩余 ${remainingDays} 天。`,
            },
          }));
        }
      }
    }
  }
}
