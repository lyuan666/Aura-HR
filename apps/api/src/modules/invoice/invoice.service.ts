import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInvoiceDto, UpdateInvoiceStatusDto, ConfirmPaymentDto } from './invoice.dto';
import { InvoiceEntity } from '../../entities/invoice.entity';
import { ContractEntity } from '../../entities/contract.entity';
import { StateMachine, INVOICE_TRANSITIONS } from '../../common/utils/state-machine';

@Injectable()
export class InvoiceService {
  private readonly stateMachine = new StateMachine(INVOICE_TRANSITIONS);

  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepo: Repository<InvoiceEntity>,
    @InjectRepository(ContractEntity)
    private readonly contractRepo: Repository<ContractEntity>,
  ) {}

  async findAll(page = 1, pageSize = 20, tenantId?: string) {
    const [items, total] = await this.invoiceRepo.findAndCount({
      where: tenantId ? { tenantId } : {},
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }

  async findByContract(contractId: string, tenantId?: string) {
    return this.invoiceRepo.find({
      where: { contractId, ...(tenantId ? { tenantId } : {}) },
      order: { issueDate: 'DESC' },
    });
  }

  async findOne(id: string, tenantId?: string) {
    const invoice = await this.invoiceRepo.findOne({ 
      where: { id, ...(tenantId ? { tenantId } : {}) } 
    });
    if (!invoice) throw new NotFoundException('发票不存在');
    return invoice;
  }

  async create(dto: CreateInvoiceDto, tenantId?: string) {
    const contract = await this.contractRepo.findOne({ 
      where: { id: dto.contractId, ...(tenantId ? { tenantId } : {}) } 
    });
    if (!contract) throw new NotFoundException('关联合同不存在');

    // 检查发票号唯一性
    const existing = await this.invoiceRepo.findOne({ where: { invoiceNo: dto.invoiceNo } });
    if (existing) throw new ConflictException('发票号已存在');

    const invoice = this.invoiceRepo.create({
      ...dto,
      tenantId,
      status: 'pending',
    });

    return await this.invoiceRepo.save(invoice);
  }

  async updateStatus(id: string, dto: UpdateInvoiceStatusDto, tenantId?: string) {
    const invoice = await this.findOne(id, tenantId);
    this.stateMachine.validateTransition(invoice.status, dto.status);
    invoice.status = dto.status;
    return await this.invoiceRepo.save(invoice);
  }

  async confirmPayment(id: string, dto: ConfirmPaymentDto, tenantId?: string) {
    const invoice = await this.findOne(id, tenantId);
    
    invoice.paidDate = new Date(dto.paidDate);
    this.stateMachine.validateTransition(invoice.status, 'paid');
    invoice.status = 'paid';
    if (dto.notes) {
      invoice.notes = invoice.notes ? `${invoice.notes}\n回款备注: ${dto.notes}` : dto.notes;
    }

    const saved = await this.invoiceRepo.save(invoice);

    // 如果该合同下的发票全额支付，可以在这里触发合同状态更新逻辑
    // 简化处理：仅更新发票状态
    
    return saved;
  }

  async remove(id: string, tenantId?: string) {
    const invoice = await this.findOne(id, tenantId);
    if (invoice.status === 'paid') {
      throw new ConflictException('已支付的发票不能删除');
    }
    return await this.invoiceRepo.remove(invoice);
  }
}
