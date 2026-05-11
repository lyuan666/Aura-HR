import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FollowUpService } from './follow-up.service';
import { FollowUpEntity } from '../../entities/follow-up.entity';
import { AuditLogEntity } from '../../entities/audit-log.entity';
import { AiService } from '../ai/ai.service';
import { Repository } from 'typeorm';
import { NotificationService } from '../notification/notification.service';

describe('FollowUpService', () => {
  let service: FollowUpService;
  let followUpRepo: Repository<FollowUpEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowUpService,
        {
          provide: getRepositoryToken(FollowUpEntity),
          useValue: {
            create: jest.fn().mockImplementation(dto => dto),
            save: jest.fn().mockImplementation(f => Promise.resolve({ id: 'f1', ...f })),
            find: jest.fn().mockResolvedValue([]),
            findAndCount: jest.fn().mockResolvedValue([[], 0]),
          },
        },
        {
          provide: getRepositoryToken(AuditLogEntity),
          useValue: {
            create: jest.fn().mockImplementation(dto => dto),
            save: jest.fn().mockImplementation(a => Promise.resolve({ id: 'a1', ...a })),
          },
        },
        {
          provide: AiService,
          useValue: {
            generateFollowUpStrategy: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: { notify: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<FollowUpService>(FollowUpService);
    followUpRepo = module.get<Repository<FollowUpEntity>>(getRepositoryToken(FollowUpEntity));
  });

  it('should create a follow-up with tenantId', async () => {
    const dto = { content: 'Followed up', targetId: 'rec1', targetType: 'recommendation' };
    const tenantId = 't1';

    const result = await service.create(dto as any, tenantId);

    expect(result.tenantId).toBe(tenantId);
    expect(followUpRepo.save).toHaveBeenCalled();
  });
});
