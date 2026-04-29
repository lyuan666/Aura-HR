import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportService } from './report.service';
import { RecommendationEntity } from '../../entities/recommendation.entity';
import { CandidateEntity } from '../../entities/candidate.entity';
import { JobPositionEntity } from '../../entities/job-position.entity';

// Mock pdfmake/js/Printer
jest.mock('pdfmake/js/Printer', () => {
  return {
    default: jest.fn().mockImplementation(() => {
      return {
        createPdfKitDocument: jest.fn().mockReturnValue({
          on: jest.fn(),
          end: jest.fn(),
        }),
      };
    }),
  };
});

describe('ReportService', () => {
  let service: ReportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        {
          provide: getRepositoryToken(RecommendationEntity),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(CandidateEntity),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(JobPositionEntity),
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
