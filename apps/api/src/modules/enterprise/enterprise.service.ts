import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Like } from 'typeorm';
import {
  CreateEnterpriseDto,
  CreateContactDto,
  UpdateEnterpriseStatusDto,
} from './enterprise.dto';
import { EnterpriseEntity } from '../../entities/enterprise.entity';
import { ContactEntity } from '../../entities/contact.entity';
import { FollowUpEntity } from '../../entities/follow-up.entity';
import { StateMachine, ENTERPRISE_TRANSITIONS } from '../../common/utils/state-machine';

@Injectable()
export class EnterpriseService {
  private readonly stateMachine = new StateMachine(ENTERPRISE_TRANSITIONS);

  constructor(
    @InjectRepository(EnterpriseEntity)
    private readonly entRepo: Repository<EnterpriseEntity>,
    @InjectRepository(ContactEntity)
    private readonly contactRepo: Repository<ContactEntity>,
    @InjectRepository(FollowUpEntity)
    private readonly followUpRepo: Repository<FollowUpEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(
    page = 1,
    pageSize = 20,
    tenantId?: string,
    filters?: { name?: string; status?: string },
  ) {
    const where: Record<string, unknown> = tenantId ? { tenantId } : {};
    const trimmedName = filters?.name?.trim();

    if (trimmedName) {
      where.name = Like(`%${trimmedName}%`);
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const [items, total] = await this.entRepo.findAndCount({
      where,
      relations: ['contacts'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const enterprises = items.map((ent) => {
      const primaryContact = ent.contacts?.find((c) => c.isPrimary);
      return {
        ...this.dehydrateEnterprise(ent),
        contactName: primaryContact?.name || '无',
      };
    });

    return { items: enterprises, total, page, pageSize };
  }

  private dehydrateEnterprise(e: EnterpriseEntity) {
    return {
      id: e.id,
      name: e.name,
      industry: e.industry,
      scale: e.scale,
      address: e.address,
      website: e.website,
      description: e.description,
      status: e.status,
      tags: e.tags,
      tenantId: e.tenantId,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      contacts: e.contacts?.map(c => this.dehydrateContact(c)),
    };
  }

  private dehydrateContact(c: ContactEntity) {
    return {
      id: c.id,
      name: c.name,
      title: c.title,
      phone: c.phone,
      email: c.email,
      wechat: c.wechat,
      isPrimary: c.isPrimary,
      notes: c.notes,
      enterpriseId: c.enterpriseId,
      tenantId: c.tenantId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }

  async findOne(id: string, tenantId?: string) {
    const enterprise = await this.entRepo.findOne({
      where: { id, ...(tenantId ? { tenantId } : {}) },
      relations: ['contacts'],
    });

    if (!enterprise) throw new NotFoundException('企业客户不存在');

    const followUps = await this.followUpRepo.find({
      where: { targetId: id, targetType: 'enterprise', ...(tenantId ? { tenantId } : {}) },
      order: { createdAt: 'DESC' },
    });

    return {
      ...this.dehydrateEnterprise(enterprise),
      followUps: followUps.map(f => ({
        id: f.id,
        targetType: f.targetType,
        targetId: f.targetId,
        content: f.content,
        userId: f.userId,
        createdAt: f.createdAt,
      })),
    };
  }

  async create(dto: CreateEnterpriseDto, tenantId?: string) {
    return await this.dataSource.transaction(async (manager) => {
      const newEnterprise = manager.create(EnterpriseEntity, {
        name: dto.name,
        industry: dto.industry || '未知',
        scale: dto.scale || '未知',
        address: dto.address || '',
        website: dto.website || '',
        description: dto.description || '',
        status: 'potential',
        tenantId,
        tags: [],
      });

      const savedEnt = await manager.save(newEnterprise);

      if (dto.contactName) {
        const contact = manager.create(ContactEntity, {
          enterprise: savedEnt,
          name: dto.contactName,
          phone: dto.contactPhone || '',
          title: dto.contactTitle || '',
          isPrimary: true,
          tenantId,
        });
        await manager.save(contact);
      }

      return this.dehydrateEnterprise(savedEnt);
    });
  }

  async findOrCreateByName(name: string, tenantId?: string) {
    return await this.dataSource.transaction(async (manager) => {
      let enterprise = await manager.findOne(EnterpriseEntity, {
        where: { name, ...(tenantId ? { tenantId } : {}) },
      });

      if (!enterprise) {
        enterprise = manager.create(EnterpriseEntity, {
          name,
          industry: '未知',
          status: 'potential',
          tenantId,
        });
        enterprise = await manager.save(enterprise);
      }

      return this.dehydrateEnterprise(enterprise);
    });
  }

  async updateStatus(id: string, dto: UpdateEnterpriseStatusDto, user?: any) {
    const tenantId = user?.tenantId;
    return await this.dataSource.transaction(async (manager) => {
      const enterprise = await manager.findOne(EnterpriseEntity, {
        where: { id, ...(tenantId ? { tenantId } : {}) }
      });
      if (!enterprise) throw new NotFoundException('企业客户不存在');

      const oldStatus = enterprise.status;
      this.stateMachine.validateTransition(oldStatus, dto.status);
      enterprise.status = dto.status;
      const updated = await manager.save(enterprise);

      const log = manager.create(FollowUpEntity, {
        targetType: 'enterprise',
        targetId: id,
        tenantId,
        userId: user?.id || user?.sub,
        content: `系统自动记录：将客户状态从 [${oldStatus}] 修改为 [${dto.status}]`,
      });
      await manager.save(log);

      return this.dehydrateEnterprise(updated);
    });
  }

  async addContact(enterpriseId: string, dto: CreateContactDto, tenantId?: string) {
    return await this.dataSource.transaction(async (manager) => {
      const enterprise = await manager.findOne(EnterpriseEntity, {
        where: { id: enterpriseId, ...(tenantId ? { tenantId } : {}) },
        relations: ['contacts'],
      });
      if (!enterprise) throw new NotFoundException('企业客户不存在');

      // 如果新增的联系人设为主联系人，则取消该企业下所有其他联系人的主联系人标识
      if (dto.isPrimary) {
        await manager.update(
          ContactEntity,
          { enterprise: { id: enterpriseId }, isPrimary: true, ...(tenantId ? { tenantId } : {}) },
          { isPrimary: false },
        );
      }

      const contact = manager.create(ContactEntity, {
        enterprise,
        ...dto,
        tenantId,
        isPrimary: dto.isPrimary || (enterprise.contacts?.length === 0),
      });

      const saved = await manager.save(contact);
      return this.dehydrateContact(saved);
    });
  }
}
