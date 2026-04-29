import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GuaranteeService } from './guarantee.service';
import { GuaranteeTrackingEntity } from '../../entities/guarantee-tracking.entity';
import { RecommendationEntity } from '../../entities/recommendation.entity';
import { Repository, LessThanOrEqual } from 'typeorm';

describe('GuaranteeService', () => {
  let service: GuaranteeService;
  let guaranteeRepo: Repository<GuaranteeTrackingEntity>;
  let recRepo: Repository<RecommendationEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuaranteeService,
        {
          provide: getRepositoryToken(GuaranteeTrackingEntity),
          useValue: {
            create: jest.fn().mockImplementation(dto => dto),
            save: jest.fn().mockImplementation(g => Promise.resolve({ id: 'g1', ...g })),
            findOne: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn().mockResolvedValue([[], 0]),
          },
        },
        {
          provide: getRepositoryToken(RecommendationEntity),
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<GuaranteeService>(GuaranteeService);
    guaranteeRepo = module.get<Repository<GuaranteeTrackingEntity>>(getRepositoryToken(GuaranteeTrackingEntity));
    recRepo = module.get<Repository<RecommendationEntity>>(getRepositoryToken(RecommendationEntity));
  });

  it('should start tracking for a recommendation', async () => {
    const recId = 'rec1';
    const tenantId = 't1';
    jest.spyOn(recRepo, 'findOne').mockResolvedValue({ id: recId, tenantId } as any);

    const result = await service.startTracking(recId, tenantId);

    expect(result.recommendationId).toBe(recId);
    expect(result.status).toBe('tracking');
    expect(result.endDate).toBeDefined();
  });

  it('should mark expired tracking as finished', async () => {
    const mockRecord = { id: 'g1', status: 'tracking', endDate: new Date() };
    jest.spyOn(guaranteeRepo, 'find').mockResolvedValue([mockRecord] as any);

    await service.checkGuaranteeExpiry();

    expect(guaranteeRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      id: 'g1',
      status: 'finished',
    }));
  });
});
