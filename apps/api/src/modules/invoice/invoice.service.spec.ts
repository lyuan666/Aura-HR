import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InvoiceService } from './invoice.service';
import { InvoiceEntity } from '../../entities/invoice.entity';
import { ContractEntity } from '../../entities/contract.entity';
import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let invoiceRepo: Repository<InvoiceEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        {
          provide: getRepositoryToken(InvoiceEntity),
          useValue: {
            create: jest.fn().mockImplementation(dto => dto),
            save: jest.fn().mockImplementation(i => Promise.resolve({ id: 'inv1', ...i })),
            findOne: jest.fn(),
            findAndCount: jest.fn().mockResolvedValue([[], 0]),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ContractEntity),
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
    invoiceRepo = module.get<Repository<InvoiceEntity>>(getRepositoryToken(InvoiceEntity));
  });

  it('should create an invoice with tenantId', async () => {
    const dto = { amount: 1000, contractId: 'con1', invoiceNo: 'INV-001' };
    const tenantId = 't1';

    const module = await Test.createTestingModule({
      providers: [
        InvoiceService,
        {
          provide: getRepositoryToken(InvoiceEntity),
          useValue: {
            create: jest.fn().mockImplementation(dto => dto),
            save: jest.fn().mockImplementation(i => Promise.resolve({ id: 'inv1', ...i })),
            findOne: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: getRepositoryToken(ContractEntity),
          useValue: {
            findOne: jest.fn().mockResolvedValue({ id: 'con1', tenantId }),
          },
        },
      ],
    }).compile();
    const localService = module.get<InvoiceService>(InvoiceService);

    const result = await localService.create(dto as any, tenantId);

    expect(result.tenantId).toBe(tenantId);
  });

  describe('state machine', () => {
    it('should allow pending -> issued transition', async () => {
      jest.spyOn(invoiceRepo, 'findOne').mockResolvedValue({ id: 'inv1', status: 'pending' } as any);
      jest.spyOn(invoiceRepo, 'save').mockResolvedValue({ id: 'inv1', status: 'issued' } as any);

      const result = await service.updateStatus('inv1', { status: 'issued' } as any);

      expect(result.status).toBe('issued');
    });

    it('should reject invalid transition pending -> paid', async () => {
      jest.spyOn(invoiceRepo, 'findOne').mockResolvedValue({ id: 'inv1', status: 'pending' } as any);

      await expect(
        service.updateStatus('inv1', { status: 'paid' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow sent -> paid via confirmPayment', async () => {
      jest.spyOn(invoiceRepo, 'findOne').mockResolvedValue({ id: 'inv1', status: 'sent' } as any);
      jest.spyOn(invoiceRepo, 'save').mockResolvedValue({ id: 'inv1', status: 'paid' } as any);

      const result = await service.confirmPayment('inv1', { paidDate: '2024-01-01' } as any);

      expect(result.status).toBe('paid');
    });
  });
});
