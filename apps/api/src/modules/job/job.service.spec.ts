import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JobService } from './job.service';
import { JobPositionEntity } from '../../entities/job-position.entity';
import { AiService } from '../ai/ai.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { BadRequestException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { Repository } from 'typeorm';

describe('JobService', () => {
  let service: JobService;
  let jobRepo: Repository<JobPositionEntity>;
  let aiService: AiService;
  let embeddingService: EmbeddingService;
  let jobEnhanceQueue: any;

  beforeEach(async () => {
    jobEnhanceQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobService,
        {
          provide: getRepositoryToken(JobPositionEntity),
          useValue: {
            create: jest.fn().mockImplementation(dto => dto),
            save: jest.fn().mockImplementation(job => Promise.resolve({ id: 'job1', ...job })),
            findOne: jest.fn(),
            findAndCount: jest.fn().mockResolvedValue([[], 0]),
            merge: jest.fn().mockImplementation((job, dto) => ({ ...job, ...dto })),
            manager: {
              getRepository: jest.fn().mockReturnValue({
                findOne: jest.fn().mockResolvedValue({ id: 'ent1' }),
                create: jest.fn().mockImplementation(dto => dto),
                save: jest.fn().mockImplementation(e => Promise.resolve({ id: 'ent1', ...e })),
              }),
            },
          },
        },
        {
          provide: AiService,
          useValue: {
            parseJobDescription: jest.fn(),
          },
        },
        {
          provide: EmbeddingService,
          useValue: {
            generateEmbedding: jest.fn(),
          },
        },
        {
          provide: getQueueToken('job-enhance'),
          useValue: jobEnhanceQueue,
        },
      ],
    }).compile();

    service = module.get<JobService>(JobService);
    jobRepo = module.get<Repository<JobPositionEntity>>(getRepositoryToken(JobPositionEntity));
    aiService = module.get<AiService>(AiService);
    embeddingService = module.get<EmbeddingService>(EmbeddingService);
  });

  it('should create a job and enqueue BullMQ enhancement', async () => {
    const dto = { title: 'Test Job', description: 'Need a senior dev', enterpriseId: 'ent1' };
    const tenantId = 't1';

    const result = await service.create(dto as any, tenantId);

    expect(result.id).toBe('job1');
    expect(jobEnhanceQueue.add).toHaveBeenCalledWith(
      'job-enhance',
      { jobId: 'job1', description: dto.description },
      { jobId: 'enhance-job1', removeOnComplete: { count: 100 } },
    );
  });

  describe('state machine', () => {
    it('should allow pending -> matching transition', async () => {
      jest.spyOn(jobRepo, 'findOne').mockResolvedValue({ id: 'j1', status: 'pending' } as any);
      jest.spyOn(jobRepo, 'merge').mockReturnValue({ id: 'j1', status: 'matching' } as any);
      jest.spyOn(jobRepo, 'save').mockResolvedValue({ id: 'j1', status: 'matching' } as any);

      const result = await service.update('j1', { status: 'matching' } as any);

      expect(result.status).toBe('matching');
    });

    it('should reject invalid transition pending -> closed', async () => {
      jest.spyOn(jobRepo, 'findOne').mockResolvedValue({ id: 'j1', status: 'pending' } as any);

      await expect(
        service.update('j1', { status: 'closed' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow update without status change', async () => {
      jest.spyOn(jobRepo, 'findOne').mockResolvedValue({ id: 'j1', status: 'matching', title: 'Old' } as any);
      jest.spyOn(jobRepo, 'merge').mockReturnValue({ id: 'j1', status: 'matching', title: 'New' } as any);
      jest.spyOn(jobRepo, 'save').mockResolvedValue({ id: 'j1', status: 'matching', title: 'New' } as any);

      const result = await service.update('j1', { title: 'New' } as any);

      expect(result.title).toBe('New');
    });
  });
});
