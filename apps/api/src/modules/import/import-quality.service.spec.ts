import { CandidateStagingEntity } from '../../entities/candidate-staging.entity';
import { ImportBatchEntity } from '../../entities/import-batch.entity';

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
