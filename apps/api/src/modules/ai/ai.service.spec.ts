import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { ParsingService } from './parsing.service';
import { InsightService } from './insight.service';
import { LlmClientService } from './llm-client.service';

describe('AiService', () => {
  let service: AiService;
  let parsingService: ParsingService;
  let insightService: InsightService;
  let llmClient: LlmClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ParsingService,
          useValue: {
            parseResumeFast: jest.fn().mockResolvedValue({
              success: true,
              basicInfo: { name: 'Test' },
            }),
          },
        },
        {
          provide: InsightService,
          useValue: {
            generateMatchingReport: jest.fn().mockResolvedValue({ score: 90 }),
          },
        },
        {
          provide: LlmClientService,
          useValue: {
            callAi: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    parsingService = module.get<ParsingService>(ParsingService);
    insightService = module.get<InsightService>(InsightService);
    llmClient = module.get<LlmClientService>(LlmClientService);
  });

  it('should delegate parseFile to ParsingService.parseResumeFast', async () => {
    const result = await service.parseFile(
      Buffer.from(''),
      'test.pdf',
      'resume',
    );
    expect(parsingService.parseResumeFast).toHaveBeenCalled();
    expect(result.basicInfo.name).toBe('Test');
  });

  it('should delegate generateMatchingReport to InsightService', async () => {
    const result = await service.generateMatchingReport({}, {});
    expect(insightService.generateMatchingReport).toHaveBeenCalled();
    expect(result.score).toBe(90);
  });

  it('should normalize enterprise names through the LLM client', async () => {
    jest
      .spyOn(llmClient, 'callAi')
      .mockResolvedValue({ name: '腾讯科技有限公司' });

    await expect(service.normalizeEnterpriseName('腾讯')).resolves.toBe(
      '腾讯科技有限公司',
    );
  });

  it('should enrich enterprise information through the LLM client', async () => {
    const enriched = {
      industry: '互联网',
      scale: '10000人以上',
      description: '领先的互联网科技公司',
      website: 'https://www.tencent.com',
    };
    jest.spyOn(llmClient, 'callAi').mockResolvedValue(enriched);

    await expect(
      service.enrichEnterpriseInfo('腾讯科技有限公司', { industry: '' }),
    ).resolves.toEqual(enriched);
  });
});
