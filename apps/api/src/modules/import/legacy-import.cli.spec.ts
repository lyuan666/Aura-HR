import {
  buildLegacyStagingRows,
  insertLegacyRowsInBatches,
  parseLegacyFileContent,
} from './legacy-import.cli';

describe('legacy-import.cli', () => {
  it('parses NDJSON exports', () => {
    expect(parseLegacyFileContent('{"name":"张三"}\n{"name":"李四"}\n')).toEqual([
      { name: '张三' },
      { name: '李四' },
    ]);
  });

  it('normalizes rows for candidate_staging only', () => {
    const [row] = buildLegacyStagingRows(
      [
        {
          id: 'old-1',
          name: '张三',
          phone: ' 138-0013-8000 ',
          email: ' Test@Example.COM ',
          company: '某科技公司',
          title: '后端工程师',
          resumeText: 'Java Redis'.repeat(10000),
        },
      ],
      { tenantId: 't1', sourceName: 'old-platform-2026' },
    );

    expect(row.sourceType).toBe('legacy_db');
    expect(row.sourceRecordId).toBe('old-1');
    expect(row.normalizedPhone).toBe('13800138000');
    expect(row.normalizedEmail).toBe('test@example.com');
    expect(row.resumeText.length).toBeLessThanOrEqual(50000);
    expect(row.resumeTextTruncated).toBe(true);
    expect(row.traceId).toEqual(expect.any(String));
    expect(JSON.stringify(row.rawPayload).length).toBeLessThanOrEqual(100 * 1024);
  });

  it('inserts in batches of 500 and supports dry-run', async () => {
    const rows = Array.from({ length: 1001 }, (_, index) => ({ id: String(index) }));
    const repo = { insert: jest.fn() };

    await insertLegacyRowsInBatches(repo as any, rows as any, { dryRun: false });
    expect(repo.insert).toHaveBeenCalledTimes(3);
    expect(repo.insert.mock.calls[0][0]).toHaveLength(500);
    expect(repo.insert.mock.calls[2][0]).toHaveLength(1);

    repo.insert.mockClear();
    await insertLegacyRowsInBatches(repo as any, rows as any, { dryRun: true });
    expect(repo.insert).not.toHaveBeenCalled();
  });
});
