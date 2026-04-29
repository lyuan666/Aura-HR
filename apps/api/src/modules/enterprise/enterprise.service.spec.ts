import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EnterpriseService } from './enterprise.service';
import { EnterpriseEntity } from '../../entities/enterprise.entity';
import { ContactEntity } from '../../entities/contact.entity';
import { FollowUpEntity } from '../../entities/follow-up.entity';
import { Repository, DataSource } from 'typeorm';

describe('EnterpriseService', () => {
  let service: EnterpriseService;
  let enterpriseRepo: Repository<EnterpriseEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnterpriseService,
        {
          provide: getRepositoryToken(EnterpriseEntity),
          useValue: {
            create: jest.fn().mockImplementation(dto => dto),
            save: jest.fn().mockImplementation(ent => Promise.resolve({ id: 'ent1', ...ent })),
            findOne: jest.fn(),
            findAndCount: jest.fn().mockResolvedValue([[], 0]),
          },
        },
        {
          provide: getRepositoryToken(ContactEntity),
          useValue: {
            create: jest.fn().mockImplementation(dto => dto),
            save: jest.fn().mockImplementation(c => Promise.resolve({ id: 'c1', ...c })),
          },
        },
        {
          provide: getRepositoryToken(FollowUpEntity),
          useValue: { find: jest.fn() },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn().mockImplementation(cb => cb({ 
              save: jest.fn().mockImplementation(x => Promise.resolve(x)),
              create: jest.fn().mockImplementation((cls, data) => data),
              findOne: jest.fn(),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<EnterpriseService>(EnterpriseService);
    enterpriseRepo = module.get<Repository<EnterpriseEntity>>(getRepositoryToken(EnterpriseEntity));
  });

  it('should list enterprises with tenant isolation', async () => {
    const tenantId = 't1';
    await service.findAll(1, 10, tenantId);
    expect(enterpriseRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
      where: { tenantId },
    }));
  });

  it('should find or create enterprise within a transaction', async () => {
    const name = 'New Corp';
    const tenantId = 't1';
    
    // Mock not found
    jest.spyOn(enterpriseRepo, 'findOne').mockResolvedValue(null);

    const result = await service.findOrCreateByName(name, tenantId);

    expect(result.name).toBe(name);
    expect(result.tenantId).toBe(tenantId);
  });
});
