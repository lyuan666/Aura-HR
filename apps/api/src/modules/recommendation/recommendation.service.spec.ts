import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RecommendationService } from './recommendation.service';
import { RecommendationEntity } from '../../entities/recommendation.entity';
import { CandidateEntity } from '../../entities/candidate.entity';
import { JobPositionEntity } from '../../entities/job-position.entity';
import { AiService } from '../ai/ai.service';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

describe('RecommendationService', () => {
  let service: RecommendationService;
  let recRepo: Repository<RecommendationEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationService,
        {
          provide: getRepositoryToken(RecommendationEntity),
          useValue: {
            create: jest.fn().mockImplementation(dto => dto),
            save: jest.fn().mockImplementation(rec => Promise.resolve({ id: 'rec1', ...rec })),
            findOne: jest.fn(),
            update: jest.fn(),
            findAndCount: jest.fn().mockResolvedValue([[], 0]),
          },
        },
        {
          provide: getRepositoryToken(CandidateEntity),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(JobPositionEntity),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: AiService,
          useValue: {
            generateMatchingReport: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RecommendationService>(RecommendationService);
    recRepo = module.get<Repository<RecommendationEntity>>(getRepositoryToken(RecommendationEntity));
  });

  it('should validate status transitions using state machine', async () => {
    const mockRec = { id: 'rec1', status: 'pending' };
    jest.spyOn(recRepo, 'findOne').mockResolvedValue(mockRec as any);

    // Valid transition: pending -> submitted
    await service.updateStatus('rec1', 'submitted');
    expect(recRepo.update).toHaveBeenCalledWith('rec1', { status: 'submitted' });

    // Invalid transition: pending -> interviewed
    await expect(service.updateStatus('rec1', 'interviewed'))
      .rejects.toThrow(BadRequestException);
  });

  it('should prevent cross-tenant access in updateStatus', async () => {
    jest.spyOn(recRepo, 'findOne').mockResolvedValue(null); // Not found because of tenant filter

    await expect(service.updateStatus('rec1', 'submitted', 'wrong-tenant'))
      .rejects.toThrow('Recommendation not found');
  });
});
