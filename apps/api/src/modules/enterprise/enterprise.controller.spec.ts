import { Test, TestingModule } from '@nestjs/testing';
import { EnterpriseController } from './enterprise.controller';
import { EnterpriseService } from './enterprise.service';

describe('EnterpriseController', () => {
  let controller: EnterpriseController;
  let service: jest.Mocked<EnterpriseService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnterpriseController],
      providers: [
        {
          provide: EnterpriseService,
          useValue: {
            findAll: jest.fn().mockResolvedValue({ items: [], total: 0 }),
            create: jest.fn(),
            findOne: jest.fn(),
            updateStatus: jest.fn(),
            addContact: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EnterpriseController>(EnterpriseController);
    service = module.get(EnterpriseService);
  });

  it('should pass query filters through to service when listing enterprises', async () => {
    const req = { user: { tenantId: 'tenant-1' } };

    await controller.findAll(req as any, 2, 15, '天选', 'following');

    expect(service.findAll).toHaveBeenCalledWith(2, 15, 'tenant-1', {
      name: '天选',
      status: 'following',
    });
  });
});
