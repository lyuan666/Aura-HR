import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CandidateService } from './candidate.service';
import { CandidateEntity } from '../../entities/candidate.entity';
import { EmbeddingService } from '../embedding/embedding.service';
import { QueueService } from '../queue/queue.service';
import { ConflictException } from '@nestjs/common';

describe('CandidateService', () => {
  let service: CandidateService;
  let repo: any;
  let embeddingService: any;
  let queueService: any;

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

    queueService = {
      enqueue: jest.fn(),
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
          provide: QueueService,
          useValue: queueService,
        },
      ],
    }).compile();

    service = module.get<CandidateService>(CandidateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw ConflictException if duplicate found', async () => {
      const dto = { name: 'Test', phone: '123' } as any;
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 'existing' }),
      };
      repo.createQueryBuilder.mockReturnValue(qb);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should create and enqueue vectorization if no duplicate', async () => {
      const dto = { name: 'Test', phone: '123' } as any;
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      repo.createQueryBuilder.mockReturnValue(qb);
      repo.create.mockReturnValue({ id: 'new-id', ...dto });
      repo.save.mockResolvedValue({ id: 'new-id', ...dto });

      const result = await service.create(dto, 'tenant-1');

      expect(result.id).toBe('new-id');
      expect(queueService.enqueue).toHaveBeenCalledWith(
        'vectorize',
        { candidateId: 'new-id' },
        'tenant-1',
      );
    });
  });
});
