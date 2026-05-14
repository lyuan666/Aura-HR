import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { ImportService } from './import.service';
import { ImportQualityService } from './import-quality.service';
import { ImportDedupeService } from './import-dedupe.service';
import { CandidateService } from '../candidate/candidate.service';
import { CandidateStagingEntity } from '../../entities/candidate-staging.entity';
import { CandidateMergeLinkEntity } from '../../entities/candidate-merge-link.entity';
import { ImportBatchEntity } from '../../entities/import-batch.entity';

describe('ImportService', () => {
  let service: ImportService;
  let stagingRepo: any;
  let importDedupe: any;

  beforeEach(async () => {
    stagingRepo = {
      create: jest.fn((row) => row),
      save: jest.fn(async (row) => ({ id: 'staging-1', ...row })),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };
    importDedupe = {
      findDuplicate: jest.fn().mockResolvedValue({ status: 'unique' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportService,
        ImportQualityService,
        {
          provide: ImportDedupeService,
          useValue: importDedupe,
        },
        {
          provide: CandidateService,
          useValue: { create: jest.fn() },
        },
        {
          provide: getRepositoryToken(CandidateStagingEntity),
          useValue: stagingRepo,
        },
        {
          provide: getRepositoryToken(ImportBatchEntity),
          useValue: {},
        },
        {
          provide: getRepositoryToken(CandidateMergeLinkEntity),
          useValue: { create: jest.fn(), save: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(ImportService);
  });

  it('creates scored staging rows for extension captures', async () => {
    const result = await service.createExtensionCapture(
      {
        sourcePlatform: 'boss_zhipin',
        sourceUrl: 'https://www.zhipin.com/web/geek/resume',
        name: '张三',
        rawText: '张三 8年 Java Redis PostgreSQL'.repeat(4000),
      },
      { tenantId: 't1', operatorId: 'u1' },
    );

    expect(result.sourceType).toBe('chrome_extension');
    expect(result.status).toBe('scored');
    expect(['reject', 'review', 'candidate']).toContain(result.importDecision);
    expect(result.rawPayload.sourceUrl).toBe('https://www.zhipin.com/web/geek/resume');
    expect(result.traceId).toEqual(expect.any(String));
    expect(result.resumeText.length).toBeLessThanOrEqual(50000);
    expect(result.resumeTextTruncated).toBe(true);
    expect(stagingRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 't1',
        sourceType: 'chrome_extension',
        sourcePlatform: 'boss_zhipin',
      }),
    );
  });
});
