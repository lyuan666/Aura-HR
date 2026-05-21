import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractTemplateEntity } from '../../entities/contract-template.entity';

@Injectable()
export class ContractTemplateService {
  constructor(
    @InjectRepository(ContractTemplateEntity)
    private readonly templateRepo: Repository<ContractTemplateEntity>,
  ) {}

  async findAll(user: any) {
    const query = this.templateRepo.createQueryBuilder('template');
    
    // 非超级管理员只能查看：1. 系统公共预设模板（tenant_id 为 null）；2. 自身租户的模板
    if (user?.role !== 'admin') {
      query.where('(template.tenantId = :tenantId OR template.tenantId IS NULL)', {
        tenantId: user?.tenantId || '',
      });
      // 且普通用户只能看 active 状态的模板
      query.andWhere('template.status = :status', { status: 'active' });
    } else {
      // 超管可以看到全部（包括草稿和已归档），支持按租户过滤
      query.where('1=1');
    }

    query.orderBy('template.createdAt', 'DESC');
    return query.getMany();
  }

  async findOne(id: string, user: any) {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('模板不存在');
    }
    
    // 权限校验
    if (user?.role !== 'admin') {
      // 非超管不能查看其他租户的私有模板
      if (template.tenantId !== null && template.tenantId !== user?.tenantId) {
        throw new NotFoundException('模板不存在');
      }
      // 非超管不能查看非 active 的模板
      if (template.status !== 'active') {
        throw new ForbiddenException('模板当前不可用');
      }
    }
    
    return template;
  }

  async create(dto: any, user: any) {
    // 只有超管能创建没有 tenantId 的全局系统预设模板
    const tenantId = user?.role === 'admin' ? dto.tenantId : user?.tenantId;
    
    const template = this.templateRepo.create({
      name: dto.name,
      category: dto.category,
      description: dto.description || '',
      templateContent: dto.templateContent,
      fileUrl: dto.fileUrl || '',
      variables: dto.variables || [],
      status: dto.status || 'draft',
      version: dto.version || '1.0',
      parentId: dto.parentId || null,
      tenantId: tenantId || null,
    });
    
    return this.templateRepo.save(template);
  }

  async update(id: string, dto: any, user: any) {
    const template = await this.findOne(id, user);
    
    // 只有超管才能修改全局系统预设模板
    if (template.tenantId === null && user?.role !== 'admin') {
      throw new ForbiddenException('您无权修改系统预设模板');
    }
    
    // 非超管不能把模板修改成其他租户的
    if (user?.role !== 'admin' && dto.tenantId && dto.tenantId !== user?.tenantId) {
      throw new ForbiddenException('无法将模板归属修改为其他租户');
    }

    this.templateRepo.merge(template, dto);
    return this.templateRepo.save(template);
  }

  async remove(id: string, user: any) {
    const template = await this.findOne(id, user);
    
    // 只有超管才能删除全局系统预设模板
    if (template.tenantId === null && user?.role !== 'admin') {
      throw new ForbiddenException('您无权删除系统预设模板');
    }

    await this.templateRepo.remove(template);
    return { success: true };
  }
}
