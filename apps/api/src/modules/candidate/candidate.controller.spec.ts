import { Test, TestingModule } from '@nestjs/testing';
import { CandidateController } from './candidate.controller';
import { CandidateService } from './candidate.service';
import { AiService } from '../ai/ai.service';

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
            update: jest.fn(),
          },
        },
        {
          provide: AiService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<CandidateController>(CandidateController);
    service = module.get<CandidateService>(CandidateService);
  });

  it('should pass tenantId and pagination from request to service', async () => {
    const req = { user: { tenantId: 't1' } };
    const query = { page: 2, pageSize: 50 };

    await controller.findAll(req as any, query.page, query.pageSize);

    expect(service.findAll).toHaveBeenCalledWith(2, 50, 't1');
  });
});
