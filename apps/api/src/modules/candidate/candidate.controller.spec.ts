import { Test, TestingModule } from '@nestjs/testing';
import { CandidateController } from './candidate.controller';
import { CandidateService } from './candidate.service';
import { AiService } from '../ai/ai.service';
import { PdfExtractionService } from '../ai/pdf-extraction.service';
import { ProgressService } from './progress.service';
import { StorageService } from '../storage/storage.service';
import { getQueueToken } from '@nestjs/bullmq';
import { FeishuService } from './feishu.service';

describe('CandidateController', () => {
  let moduleRef: TestingModule;
  let controller: CandidateController;
  let service: CandidateService;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
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
          provide: PdfExtractionService,
          useValue: {
            extractStructuredText: jest.fn(),
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
            getObject: jest.fn(),
          },
        },
        {
          provide: FeishuService,
          useValue: {
            importFromBitable: jest.fn(),
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

    controller = moduleRef.get<CandidateController>(CandidateController);
    service = moduleRef.get<CandidateService>(CandidateService);
  });

  it('should pass tenantId and pagination from request to service', async () => {
    const req = { user: { tenantId: 't1' } };

    await controller.findAll(req as any, { page: 2, pageSize: 50 });

    expect(service.findAll).toHaveBeenCalledWith(2, 50, 't1');
  });

  it('should persist uploaded resume and pass resumeUrl into candidate creation', async () => {
    const aiService = moduleRef.get(AiService);
    const storage = moduleRef.get(StorageService);
    const req = { user: { tenantId: 'tenant-1' } };
    const file = {
      originalname: 'alice.pdf',
      mimetype: 'application/pdf',
      size: 128,
      buffer: Buffer.from('resume'),
    } as Express.Multer.File;

    aiService.parseFile.mockResolvedValue({
      basicInfo: { name: 'Alice', phoneNumber: '13800000000' },
      workExperience: [],
      education: [],
      projectExperience: [],
      metadata: { parseTime: '1s', engine: 'test-engine' },
      skills: [],
    });
    service.create.mockResolvedValue({ id: 'candidate-1' });

    await controller.uploadResume(file, req as any);

    expect(storage.putObject).toHaveBeenCalled();
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Alice',
        resumeUrl: expect.stringContaining('resumes/tenant-1/'),
      }),
      'tenant-1',
    );
  });

  it('should return extracted text preview metadata for docx resumes', async () => {
    const extractionService = moduleRef.get(PdfExtractionService);
    const storage = moduleRef.get(StorageService);

    service.findOne.mockResolvedValue({
      id: 'candidate-1',
      resumeUrl: 'resumes/tenant-1/alice.docx',
    });
    storage.getObject.mockResolvedValue(Buffer.from('docx-bytes'));
    extractionService.extractStructuredText.mockResolvedValue({
      text: 'Alice resume preview',
      format: 'plain',
      method: 'mammoth',
    });

    const result = await controller.getResumePreview('candidate-1', {
      user: { tenantId: 'tenant-1' },
    } as any);

    expect(result).toEqual(
      expect.objectContaining({
        previewType: 'text',
        fileName: 'alice.docx',
        text: 'Alice resume preview',
        method: 'mammoth',
      }),
    );
  });
});
