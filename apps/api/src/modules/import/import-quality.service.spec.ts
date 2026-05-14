import { CandidateStagingEntity } from '../../entities/candidate-staging.entity';
import { ImportBatchEntity } from '../../entities/import-batch.entity';
import { ImportQualityService } from './import-quality.service';

describe('import staging entities', () => {
  it('defines staging source and quality fields', () => {
    const row = new CandidateStagingEntity();
    row.sourceType = 'legacy_db';
    row.importDecision = 'review';
    row.qualityScore = 60;
    expect(row.sourceType).toBe('legacy_db');
    expect(row.importDecision).toBe('review');
    expect(row.qualityScore).toBe(60);
  });

  it('defines import batch counters', () => {
    const batch = new ImportBatchEntity();
    batch.sourceType = 'legacy_db';
    batch.status = 'pending';
    batch.totalCount = 0;
    expect(batch.status).toBe('pending');
  });
});

describe('ImportQualityService', () => {
  let service: ImportQualityService;

  beforeEach(() => {
    service = new ImportQualityService();
  });

  it('normalizes phone, email, and text hashes', () => {
    expect(service.normalizePhone(' 138-0013-8000 ')).toBe('13800138000');
    expect(service.normalizeEmail(' Test@Example.COM ')).toBe('test@example.com');
    expect(service.computeTextHash('张三 Java Redis')).toHaveLength(64);
  });

  it('scores complete rows as candidate decisions', () => {
    expect(
      service.score({
        name: '张三',
        normalizedPhone: '13800138000',
        email: 'a@b.com',
        resumeText: '8年Java后端工程师，熟悉PostgreSQL和Redis'.repeat(20),
        currentCompany: '某科技公司',
        currentTitle: '高级后端工程师',
      }).decision,
    ).toBe('candidate');
  });

  it('rejects sparse rows', () => {
    expect(service.score({ name: '张三' }).decision).toBe('reject');
  });
});
