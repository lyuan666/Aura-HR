import { ImportDedupeService } from './import-dedupe.service';

describe('ImportDedupeService', () => {
  it('delegates duplicate checks to CandidateDedupeService', async () => {
    const candidateDedupe = {
      findDuplicate: jest.fn().mockResolvedValue({
        status: 'duplicate',
        candidateId: 'c1',
        matchType: 'phone',
      }),
    };
    const service = new ImportDedupeService(candidateDedupe as any);

    await expect(
      service.findDuplicate({
        tenantId: 't1',
        normalizedPhone: '13800138000',
        normalizedEmail: 'a@b.com',
        textHash: 'text',
        fileHash: 'file',
        name: '张三',
        currentCompany: '某公司',
        sourcePlatform: 'boss',
      }),
    ).resolves.toMatchObject({ status: 'duplicate', candidateId: 'c1' });

    expect(candidateDedupe.findDuplicate).toHaveBeenCalledWith({
      tenantId: 't1',
      normalizedPhone: '13800138000',
      normalizedEmail: 'a@b.com',
      textHash: 'text',
      fileHash: 'file',
      name: '张三',
      currentCompany: '某公司',
      sourcePlatform: 'boss',
    });
  });
});
