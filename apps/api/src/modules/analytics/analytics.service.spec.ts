import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { RecommendationEntity } from '../../entities/recommendation.entity';
import { CandidateEntity } from '../../entities/candidate.entity';
import { JobPositionEntity } from '../../entities/job-position.entity';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let recRepo: any;
  let candidateRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getRepositoryToken(RecommendationEntity),
          useValue: {
            count: jest.fn().mockResolvedValue(10),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              groupBy: jest.fn().mockReturnThis(),
              getRawMany: jest.fn().mockResolvedValue([]),
            })),
          },
        },
        {
          provide: getRepositoryToken(CandidateEntity),
          useValue: { 
            count: jest.fn().mockResolvedValue(100),
            find: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: getRepositoryToken(JobPositionEntity),
          useValue: { count: jest.fn().mockResolvedValue(20) },
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    recRepo = module.get(getRepositoryToken(RecommendationEntity));
    candidateRepo = module.get(getRepositoryToken(CandidateEntity));
  });

  it('should return overview stats with tenant filter', async () => {
    const tenantId = 't1';
    const stats = await service.getOverview(tenantId);

    expect(stats.candidateCount).toBe(100);
    expect(stats.recommendationCount).toBe(10);
    expect(candidateRepo.count).toHaveBeenCalledWith({ where: { tenantId } });
  });
});
