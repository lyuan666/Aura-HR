import { Test, TestingModule } from '@nestjs/testing';
import { CandidateController } from './candidate.controller';
import { CandidateService } from './candidate.service';
import { AiService } from '../ai/ai.service';
import { ProgressService } from './progress.service';
import { StorageService } from '../storage/storage.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bullmq';

describe('CandidateController', () => {
  let controller: CandidateController;
  let service: CandidateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CandidateController],
      providers: [
        {
          provide: CandidateService,
          useValue: {
            findAll: jest.fn().mockResolvedValue({ items: [], total: 0 }),
            findOne: jest.fn(),
            create: jest.fn(),
            semanticSearch: jest.fn(),
          },
        },
        {
          provide: AiService,
          useValue: {
            parseFile: jest.fn(),
          },
        },
        {
          provide: ProgressService,
          useValue: {
            getStream: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            putObject: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
        {
          provide: getQueueToken('parse-resume'),
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CandidateController>(CandidateController);
    service = module.get<CandidateService>(CandidateService);
  });

  it('should pass tenantId and pagination from request to service', async () => {
    const req = { user: { tenantId: 't1' } };

    await controller.findAll(req as any, { page: 2, pageSize: 50 });

    expect(service.findAll).toHaveBeenCalledWith(2, 50, 't1');
  });
});
