import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  CreateEnterpriseDto,
  CreateContactDto,
  UpdateEnterpriseStatusDto,
} from './enterprise.dto';
import { EnterpriseEntity } from '../../entities/enterprise.entity';
import { ContactEntity } from '../../entities/contact.entity';
import { FollowUpEntity } from '../../entities/follow-up.entity';

@Injectable()
export class EnterpriseService {
  constructor(
    @InjectRepository(EnterpriseEntity)
    private readonly entRepo: Repository<EnterpriseEntity>,
    @InjectRepository(ContactEntity)
    private readonly contactRepo: Repository<ContactEntity>,
    @InjectRepository(FollowUpEntity)
    private readonly followUpRepo: Repository<FollowUpEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll() {
    const enterprises = await this.entRepo.find({
      relations: ['contacts'],
      order: { createdAt: 'DESC' },
    });

    return enterprises.map((ent) => {
      const primaryContact = ent.contacts?.find((c) => c.isPrimary);
      return {
        ...ent,
        contactName: primaryContact?.name || '无',
      };
    });
  }

  async findOne(id: string) {
    const enterprise = await this.entRepo.findOne({
      where: { id },
      relations: ['contacts'],
    });

    if (!enterprise) throw new NotFoundException('企业客户不存在');

    const followUps = await this.followUpRepo.find({
      where: { targetId: id, targetType: 'enterprise' },
      order: { createdAt: 'DESC' },
    });

    return {
      ...enterprise,
      followUps,
    };
  }

  async create(dto: CreateEnterpriseDto) {
    return await this.dataSource.transaction(async (manager) => {
      const newEnterprise = manager.create(EnterpriseEntity, {
        name: dto.name,
        industry: dto.industry || '未知',
        scale: dto.scale || '未知',
        address: dto.address || '',
        website: dto.website || '',
        description: dto.description || '',
        status: 'potential',
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
        });
        await manager.save(contact);
      }

      return savedEnt;
    });
  }

  async updateStatus(id: string, dto: UpdateEnterpriseStatusDto) {
    return await this.dataSource.transaction(async (manager) => {
      const enterprise = await manager.findOne(EnterpriseEntity, { where: { id } });
      if (!enterprise) throw new NotFoundException('企业客户不存在');

      const oldStatus = enterprise.status;
      enterprise.status = dto.status;
      const updated = await manager.save(enterprise);

      const log = manager.create(FollowUpEntity, {
        targetType: 'enterprise',
        targetId: id,
        content: `系统自动记录：将客户状态从 [${oldStatus}] 修改为 [${dto.status}]`,
      });
      await manager.save(log);

      return updated;
    });
  }

  async addContact(enterpriseId: string, dto: CreateContactDto) {
    return await this.dataSource.transaction(async (manager) => {
      const enterprise = await manager.findOne(EnterpriseEntity, {
        where: { id: enterpriseId },
        relations: ['contacts'],
      });
      if (!enterprise) throw new NotFoundException('企业客户不存在');

      // 如果新增的联系人设为主联系人，则取消该企业下所有其他联系人的主联系人标识
      if (dto.isPrimary) {
        await manager.update(
          ContactEntity,
          { enterprise: { id: enterpriseId }, isPrimary: true },
          { isPrimary: false },
        );
      }

      const contact = manager.create(ContactEntity, {
        enterprise,
        ...dto,
        isPrimary: dto.isPrimary || (enterprise.contacts?.length === 0),
      });

      return await manager.save(contact);
    });
  }
}
