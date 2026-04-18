import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInvoiceDto, UpdateInvoiceStatusDto, ConfirmPaymentDto } from './invoice.dto';
import { InvoiceEntity } from '../../entities/invoice.entity';
import { ContractEntity } from '../../entities/contract.entity';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepo: Repository<InvoiceEntity>,
    @InjectRepository(ContractEntity)
    private readonly contractRepo: Repository<ContractEntity>,
  ) {}

  async findAll() {
    return this.invoiceRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findByContract(contractId: string) {
    return this.invoiceRepo.find({
      where: { contractId },
      order: { issueDate: 'DESC' },
    });
  }

  async findOne(id: string) {
    const invoice = await this.invoiceRepo.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException('发票不存在');
    return invoice;
  }

  async create(dto: CreateInvoiceDto) {
    const contract = await this.contractRepo.findOne({ where: { id: dto.contractId } });
    if (!contract) throw new NotFoundException('关联合同不存在');

    // 检查发票号唯一性
    const existing = await this.invoiceRepo.findOne({ where: { invoiceNo: dto.invoiceNo } });
    if (existing) throw new ConflictException('发票号已存在');

    const invoice = this.invoiceRepo.create({
      ...dto,
      status: 'pending',
    });

    return await this.invoiceRepo.save(invoice);
  }

  async updateStatus(id: string, dto: UpdateInvoiceStatusDto) {
    const invoice = await this.findOne(id);
    invoice.status = dto.status;
    return await this.invoiceRepo.save(invoice);
  }

  async confirmPayment(id: string, dto: ConfirmPaymentDto) {
    const invoice = await this.findOne(id);
    
    invoice.paidDate = new Date(dto.paidDate);
    invoice.status = 'paid';
    if (dto.notes) {
      invoice.notes = invoice.notes ? `${invoice.notes}\n回款备注: ${dto.notes}` : dto.notes;
    }

    const saved = await this.invoiceRepo.save(invoice);

    // 如果该合同下的发票全额支付，可以在这里触发合同状态更新逻辑
    // 简化处理：仅更新发票状态
    
    return saved;
  }

  async remove(id: string) {
    const invoice = await this.findOne(id);
    if (invoice.status === 'paid') {
      throw new ConflictException('已支付的发票不能删除');
    }
    return await this.invoiceRepo.remove(invoice);
  }
}
