import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { CandidateEntity } from '../../entities/candidate.entity';
import { SHARED_REDIS } from '../redis/redis.module';
import { LlmRouterService } from './llm-router.service';
import { ParsingV2Service } from './parsing-v2.service';
import { PdfExtractionService } from './pdf-extraction.service';
import { StorageService } from '../storage/storage.service';

describe('ParsingV2Service parse cache', () => {
  let service: ParsingV2Service;
  let llmRouter: any;
  let redis: any;

  beforeEach(async () => {
    llmRouter = {
      callForJson: jest.fn().mockResolvedValue({ name: '张三' }),
    };
    redis = {
      get: jest.fn().mockResolvedValue(null),
      setex: jest.fn().mockResolvedValue('OK'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParsingV2Service,
        {
          provide: PdfExtractionService,
          useValue: {},
        },
        {
          provide: LlmRouterService,
          useValue: llmRouter,
        },
        {
          provide: StorageService,
          useValue: {},
        },
        {
          provide: getRepositoryToken(CandidateEntity),
          useValue: {},
        },
        {
          provide: SHARED_REDIS,
          useValue: redis,
        },
      ],
    }).compile();

    service = module.get(ParsingV2Service);
  });

  it('same textHash within 24h reuses cached structured profile', async () => {
    redis.get.mockResolvedValue(JSON.stringify({ name: '缓存候选人' }));

    await expect((service as any).extractStructured('张三 Java Redis', 'resume.pdf')).resolves.toEqual({
      name: '缓存候选人',
    });
    expect(llmRouter.callForJson).not.toHaveBeenCalled();
  });

  it('cache miss calls LlmRouterService once', async () => {
    await (service as any).extractStructured('张三 Java Redis', 'resume.pdf');

    expect(llmRouter.callForJson).toHaveBeenCalledTimes(1);
  });

  it('cache write stores structured profile by textHash', async () => {
    await (service as any).extractStructured('张三 Java Redis', 'resume.pdf');

    const textHash = ParsingV2Service.computeTextHash('张三 Java Redis');
    expect(redis.setex).toHaveBeenCalledWith(
      `llm:resume-parse:${textHash}`,
      86400,
      JSON.stringify({ name: '张三' }),
    );
  });

  it('cache failure does not fail parsing', async () => {
    redis.get.mockRejectedValue(new Error('redis down'));
    redis.setex.mockRejectedValue(new Error('redis still down'));

    await expect((service as any).extractStructured('张三 Java Redis', 'resume.pdf')).resolves.toEqual({
      name: '张三',
    });
  });
});
