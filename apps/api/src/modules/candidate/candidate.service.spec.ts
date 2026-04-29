import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CandidateService } from './candidate.service';
import { CandidateEntity } from '../../entities/candidate.entity';
import { EmbeddingService } from '../embedding/embedding.service';
import { ConflictException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';

describe('CandidateService', () => {
  let service: CandidateService;
  let repo: any;
  let embeddingService: any;
  let vectorizeQueue: any;

  beforeEach(async () => {
    repo = {
      createQueryBuilder: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      query: jest.fn(),
    };

    embeddingService = {
      generateEmbedding: jest.fn(),
    };

    vectorizeQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidateService,
        {
          provide: getRepositoryToken(CandidateEntity),
          useValue: repo,
        },
        {
          provide: EmbeddingService,
          useValue: embeddingService,
        },
        {
          provide: getQueueToken('vectorize'),
          useValue: vectorizeQueue,
        },
      ],
    }).compile();

    service = module.get<CandidateService>(CandidateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw ConflictException if phone duplicate found', async () => {
      const dto = { name: 'Test', phone: '123' } as any;
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 'existing' }),
      };
      repo.createQueryBuilder.mockReturnValue(qb);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should create and enqueue BullMQ vectorization', async () => {
      const dto = { name: 'Test', phone: '123' } as any;
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      repo.createQueryBuilder.mockReturnValue(qb);
      repo.create.mockReturnValue({ id: 'new-id', ...dto });
      repo.save.mockResolvedValue({ id: 'new-id', ...dto });

      const result = await service.create(dto, 'tenant-1');

      expect(result.id).toBe('new-id');
      expect(vectorizeQueue.add).toHaveBeenCalledWith(
        'vectorize',
        { candidateId: 'new-id', tenantId: 'tenant-1' },
        { jobId: 'vec-new-id', removeOnComplete: { count: 100 } },
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[{ id: '1' }], 1]),
      };
      repo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll(1, 20, 'tenant-1');

      expect(result).toEqual({ items: [{ id: '1' }], total: 1, page: 1, pageSize: 20 });
    });
  });

  describe('semanticSearch', () => {
    it('should return empty if no embedding generated', async () => {
      embeddingService.generateEmbedding.mockResolvedValue([]);

      const result = await service.semanticSearch('test query');

      expect(result).toEqual([]);
    });

    it('should query candidates with vector similarity', async () => {
      const fakeEmbedding = new Array(1024).fill(0.1);
      embeddingService.generateEmbedding.mockResolvedValue(fakeEmbedding);
      repo.query.mockResolvedValue([
        { id: 'c1', match_score: 0.95 },
      ]);

      const result = await service.semanticSearch('Python developer', 'tenant-1');

      expect(result).toHaveLength(1);
      expect(result[0].matchScore).toBe(95);
      expect(repo.query).toHaveBeenCalledWith(
        expect.stringContaining('embedding <=> $1::vector'),
        expect.arrayContaining([JSON.stringify(fakeEmbedding)]),
      );
    });
  });
});
