import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VectorizeProcessor } from './vectorize.processor';
import { CandidateEntity } from '../../entities/candidate.entity';
import { EmbeddingService } from '../embedding/embedding.service';
import { getQueueToken } from '@nestjs/bullmq';
import { Job } from 'bullmq';

describe('VectorizeProcessor', () => {
  let processor: VectorizeProcessor;
  let candidateRepo: any;
  let embeddingService: any;
  let matchPushQueue: any;

  beforeEach(async () => {
    candidateRepo = {
      findOne: jest.fn(),
      query: jest.fn(),
    };

    embeddingService = {
      generateEmbedding: jest.fn(),
    };

    matchPushQueue = {
      add: jest.fn().mockResolvedValue({ id: 'match-job-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VectorizeProcessor,
        {
          provide: getRepositoryToken(CandidateEntity),
          useValue: candidateRepo,
        },
        {
          provide: EmbeddingService,
          useValue: embeddingService,
        },
        {
          provide: getQueueToken('match-push'),
          useValue: matchPushQueue,
        },
      ],
    }).compile();

    processor = module.get<VectorizeProcessor>(VectorizeProcessor);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('should skip if candidate not found', async () => {
    candidateRepo.findOne.mockResolvedValue(null);

    const job = { data: { candidateId: 'missing' } } as Job<any>;
    await processor.process(job);

    expect(embeddingService.generateEmbedding).not.toHaveBeenCalled();
  });

  it('should vectorize candidate and trigger match-push', async () => {
    const candidate = {
      id: 'c1',
      name: 'Test',
      resumeText: 'Experienced Python developer',
      parsedTags: { skills: ['Python', 'LLM'] },
    };
    const embedding = new Array(1024).fill(0.1);

    candidateRepo.findOne.mockResolvedValue(candidate);
    embeddingService.generateEmbedding.mockResolvedValue(embedding);

    const job = { data: { candidateId: 'c1', tenantId: 't1' } } as Job<any>;
    await processor.process(job);

    expect(embeddingService.generateEmbedding).toHaveBeenCalled();
    expect(candidateRepo.query).toHaveBeenCalledWith(
      'UPDATE candidates SET embedding = $1::vector WHERE id = $2',
      [JSON.stringify(embedding), 'c1'],
    );
    expect(matchPushQueue.add).toHaveBeenCalledWith(
      'match-push',
      { candidateId: 'c1', tenantId: 't1' },
      expect.objectContaining({ jobId: 'match-c1' }),
    );
  });

  it('should skip if insufficient text', async () => {
    candidateRepo.findOne.mockResolvedValue({
      id: 'c2',
      name: 'A',
      resumeText: '',
    });

    const job = { data: { candidateId: 'c2' } } as Job<any>;
    await processor.process(job);

    expect(embeddingService.generateEmbedding).not.toHaveBeenCalled();
  });
});
