import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { ParsingService } from './parsing.service';
import { InsightService } from './insight.service';
import { LlmClientService } from './llm-client.service';

describe('AiService', () => {
  let service: AiService;
  let parsingService: ParsingService;
  let insightService: InsightService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ParsingService,
          useValue: {
            parseResumeFast: jest
              .fn()
              .mockResolvedValue({
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
});
