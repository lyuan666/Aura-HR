import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { CandidateDedupeService } from './candidate-dedupe.service';
import { CandidateEntity } from '../../entities/candidate.entity';

describe('CandidateDedupeService', () => {
  let service: CandidateDedupeService;
  let repo: any;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidateDedupeService,
        {
          provide: getRepositoryToken(CandidateEntity),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get(CandidateDedupeService);
  });

  it('phone match returns duplicate', async () => {
    repo.findOne.mockResolvedValueOnce({ id: 'c-phone' });

    await expect(
      service.findDuplicate({ tenantId: 't1', normalizedPhone: '13800138000' }),
    ).resolves.toMatchObject({ status: 'duplicate', candidateId: 'c-phone', matchType: 'phone' });
  });

  it('email match returns duplicate', async () => {
    repo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'c-email' });

    await expect(
      service.findDuplicate({ tenantId: 't1', normalizedPhone: 'nope', normalizedEmail: 'a@b.com' }),
    ).resolves.toMatchObject({ status: 'duplicate', candidateId: 'c-email', matchType: 'email' });
  });

  it('textHash match returns duplicate', async () => {
    repo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'c-text' });

    await expect(
      service.findDuplicate({
        tenantId: 't1',
        normalizedPhone: 'nope',
        normalizedEmail: 'nope@example.com',
        textHash: 'hash',
      }),
    ).resolves.toMatchObject({ status: 'duplicate', candidateId: 'c-text', matchType: 'text_hash' });
  });

  it('fileHash match returns duplicate', async () => {
    repo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'c-file' });

    await expect(
      service.findDuplicate({
        tenantId: 't1',
        normalizedPhone: 'nope',
        normalizedEmail: 'nope@example.com',
        textHash: 'text',
        fileHash: 'file',
      }),
    ).resolves.toMatchObject({ status: 'duplicate', candidateId: 'c-file', matchType: 'file_hash' });
  });

  it('same sourcePlatform and name returns duplicate', async () => {
    repo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'c-source' });

    await expect(
      service.findDuplicate({
        tenantId: 't1',
        normalizedPhone: 'nope',
        normalizedEmail: 'nope@example.com',
        textHash: 'text',
        fileHash: 'file',
        name: '张三',
        sourcePlatform: 'boss',
      }),
    ).resolves.toMatchObject({ status: 'duplicate', candidateId: 'c-source', matchType: 'name_source' });
  });

  it('no match returns unique', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(
      service.findDuplicate({ tenantId: 't1', name: '张三', currentCompany: '某公司' }),
    ).resolves.toEqual({ status: 'unique' });
  });
});
