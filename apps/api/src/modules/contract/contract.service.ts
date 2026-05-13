import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractEntity } from '../../entities/contract.entity';
import {
  StateMachine,
  CONTRACT_TRANSITIONS,
} from '../../common/utils/state-machine';
import { StorageService } from '../storage/storage.service';
import { randomUUID } from 'crypto';

@Injectable()
export class ContractService {
  private readonly stateMachine = new StateMachine(CONTRACT_TRANSITIONS);

  constructor(
    @InjectRepository(ContractEntity)
    private readonly contractRepo: Repository<ContractEntity>,
    private readonly storage: StorageService,
  ) {}

  async findAll(page = 1, pageSize = 20, tenantId?: string) {
    const [items, total] = await this.contractRepo.findAndCount({
      where: tenantId ? { tenantId } : {},
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }

  async findOne(id: string, tenantId?: string) {
    const contract = await this.contractRepo.findOne({
      where: { id, ...(tenantId ? { tenantId } : {}) },
    });
    if (!contract) throw new NotFoundException('合同不存在');
    return contract;
  }

  async create(dto: any, tenantId?: string) {
    const contract = this.contractRepo.create({
      ...dto,
      tenantId,
      status: 'draft',
    });
    return this.contractRepo.save(contract);
  }

  async updateStatus(id: string, status: string, tenantId?: string) {
    const contract = await this.findOne(id, tenantId);
    this.stateMachine.validateTransition(contract.status, status);
    await this.contractRepo.update(id, { status });
    return this.findOne(id, tenantId);
  }

  async uploadAndCreate(
    file: Express.Multer.File,
    body: any,
    tenantId?: string,
  ) {
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

  getTemplates() {
    return [
      {
        id: 'labor',
        name: '劳动合同模板',
        description: '标准劳动合同，适用于全职员工录用',
        fileType: 'PDF',
      },
      {
        id: 'service',
        name: '服务协议模板',
        description: '猎头服务合作协议，适用于客户签约',
        fileType: 'PDF',
      },
      {
        id: 'nda',
        name: '保密协议模板',
        description: '保密及竞业限制协议',
        fileType: 'PDF',
      },
      {
        id: 'recommendation',
        name: '候选人推荐函模板',
        description: '正式候选人推荐信函格式',
        fileType: 'PDF',
      },
    ];
  }
}
