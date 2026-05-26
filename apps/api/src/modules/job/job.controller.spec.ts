import { Test, TestingModule } from '@nestjs/testing';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { AiService } from '../ai/ai.service';

describe('JobController', () => {
  let controller: JobController;
  let aiService: jest.Mocked<AiService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobController],
      providers: [
        {
          provide: JobService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: AiService,
          useValue: {
            parseFile: jest.fn(),
            parseJobDescription: jest.fn(),
            generateJobDescription: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<JobController>(JobController);
    aiService = module.get(AiService);
  });

  it('returns a basic parsed job when AI parsing is unavailable', async () => {
    aiService.parseJobDescription.mockRejectedValue(new Error('Unauthorized'));

    await expect(
      controller.parseJdText('我想招聘一个财务经理的岗位，负责预算和财务分析。'),
    ).resolves.toEqual({
      title: '财务经理',
      summary: '我想招聘一个财务经理的岗位，负责预算和财务分析。',
      requiredSkills: [],
    });
  });
});
