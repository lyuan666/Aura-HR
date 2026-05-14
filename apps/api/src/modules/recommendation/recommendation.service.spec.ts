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
  let candidateRepo: Repository<CandidateEntity>;
  let jobRepo: Repository<JobPositionEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationService,
        {
          provide: getRepositoryToken(RecommendationEntity),
          useValue: {
            create: jest.fn().mockImplementation((dto) => dto),
            save: jest
              .fn()
              .mockImplementation((rec) =>
                Promise.resolve({ id: 'rec1', ...rec }),
              ),
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
    recRepo = module.get<Repository<RecommendationEntity>>(
      getRepositoryToken(RecommendationEntity),
    );
    candidateRepo = module.get<Repository<CandidateEntity>>(
      getRepositoryToken(CandidateEntity),
    );
    jobRepo = module.get<Repository<JobPositionEntity>>(
      getRepositoryToken(JobPositionEntity),
    );
  });

  it('should validate status transitions using state machine', async () => {
    const mockRec = { id: 'rec1', status: 'pending' };
    jest.spyOn(recRepo, 'findOne').mockResolvedValue(mockRec as any);
    jest.spyOn(recRepo, 'save').mockImplementation(async (rec) => rec as any);

    // Valid transition: pending -> submitted
    await service.updateStatus('rec1', 'submitted');
    expect(recRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'submitted' }),
    );

    // Invalid transition: pending -> interviewed
    jest
      .spyOn(recRepo, 'findOne')
      .mockResolvedValue({ id: 'rec1', status: 'pending' } as any);
    await expect(service.updateStatus('rec1', 'interviewed')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should prevent cross-tenant access in updateStatus', async () => {
    jest.spyOn(recRepo, 'findOne').mockResolvedValue(null); // Not found because of tenant filter

    await expect(
      service.updateStatus('rec1', 'submitted', 'wrong-tenant'),
    ).rejects.toThrow('Recommendation not found');
  });

  it('should scope client recommendations by tenant and enterprise', async () => {
    jest.spyOn(recRepo, 'findAndCount').mockResolvedValue([
      [
        {
          id: 'rec1',
          tenantId: 't1',
          candidateId: 'c1',
          jobPositionId: 'j1',
          status: 'submitted',
          matchScore: 88,
          aiAnalysis: { highlights: ['强匹配'], risks: [], interviewSuggestions: [], conclusion: '推荐' },
        },
      ] as any,
      1,
    ]);
    jest.spyOn(jobRepo, 'findOne').mockResolvedValue({ id: 'j1', enterpriseId: 'e1', title: '后端工程师' } as any);
    jest.spyOn(candidateRepo, 'findOne').mockResolvedValue({
      id: 'c1',
      name: '张三',
      phone: '13800138000',
      email: 'secret@example.com',
      currentTitle: '高级后端',
      currentCompany: '某公司',
      totalYears: 8,
      degree: '本科',
      school: '某大学',
      parsedTags: { skills: ['Java'] },
      workExperiences: [{ companyName: '某公司', position: '高级后端' }],
      projectExperiences: [{ projectName: '平台项目' }],
    } as any);

    const result = await service.findClientRecommendations('t1', 'e1');

    expect(jobRepo.findOne).toHaveBeenCalledWith({ where: { id: 'j1', tenantId: 't1', enterpriseId: 'e1' } });
    expect(result.items[0].candidate).toMatchObject({
      displayName: '张*',
      currentTitle: '高级后端',
      skills: ['Java'],
    });
    expect(result.items[0].candidate.phone).toBeUndefined();
    expect(result.items[0].candidate.email).toBeUndefined();
  });
});
