import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MatchingService } from './matching.service';
import { CandidateEntity } from '../../entities/candidate.entity';
import { JobPositionEntity } from '../../entities/job-position.entity';
import { AiService } from '../ai/ai.service';

describe('MatchingService', () => {
  let service: MatchingService;
  let candidateRepo: any;
  let jobRepo: any;

  beforeEach(async () => {
    candidateRepo = {
      query: jest.fn(),
      findOne: jest.fn(),
    };
    jobRepo = {
      findOne: jest.fn(),
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingService,
        {
          provide: getRepositoryToken(CandidateEntity),
          useValue: candidateRepo,
        },
        {
          provide: getRepositoryToken(JobPositionEntity),
          useValue: jobRepo,
        },
        {
          provide: AiService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<MatchingService>(MatchingService);
  });

  describe('findBestMatches', () => {
    it('should return top matches using pgvector and app-level scoring', async () => {
      const jobId = 'job-1';
      const tenantId = 'tenant-1';
      jobRepo.findOne.mockResolvedValue({
        id: jobId,
        embedding: [0.1, 0.2],
        skillTags: ['Node.js'],
        salaryMax: 10000,
      });

      candidateRepo.query.mockResolvedValue([
        {
          id: 'c1',
          name: 'Match 1',
          semantic_score: 0.9,
          parsed_tags: { skills: ['Node.js', 'Typescript'] },
          total_years: 5,
        },
        {
          id: 'c2',
          name: 'Match 2',
          semantic_score: 0.4,
          parsed_tags: { skills: ['Java'] },
          expected_salary: 20000, // Hard match penalty
        },
      ]);

      const results = await service.findBestMatches(jobId, tenantId);

      expect(results.length).toBe(1);
      expect(results[0].candidate.id).toBe('c1');
      expect(results[0].score).toBeGreaterThan(50);
    });
  });
});
