import 'reflect-metadata';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { randomUUID } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { CandidateStagingEntity } from '../../entities/candidate-staging.entity';
import { ImportQualityService } from './import-quality.service';

const BATCH_SIZE = 500;
const RAW_PAYLOAD_LIMIT = 100 * 1024;
const RESUME_TEXT_LIMIT = 50000;

export interface LegacyImportOptions {
  tenantId: string;
  sourceName: string;
}

export interface InsertOptions {
  dryRun: boolean;
}

export function parseLegacyFileContent(content: string) {
  const trimmed = content.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('{')) {
    return trimmed
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  }
  return parseCsv(trimmed);
}

export function buildLegacyStagingRows(rows: any[], options: LegacyImportOptions) {
  const quality = new ImportQualityService();
  return rows.map((source) => {
    const name = pickString(source, ['name', '姓名']);
    const phone = pickString(source, ['phone', 'mobile', '手机号', '电话']);
    const email = pickString(source, ['email', '邮箱']);
    const currentCompany = pickString(source, ['company', 'currentCompany', 'current_company', '公司']);
    const currentTitle = pickString(source, ['title', 'currentTitle', 'current_title', '职位']);
    const sourceRecordId = pickString(source, ['id', 'sourceRecordId', 'source_record_id']);
    const rawResumeText = pickString(source, ['resumeText', 'resume_text', 'rawText', '简历文本']) || '';
    const resumeText = rawResumeText.substring(0, RESUME_TEXT_LIMIT);
    const normalizedPhone = quality.normalizePhone(phone);
    const normalizedEmail = quality.normalizeEmail(email);
    const textHash = quality.computeTextHash(resumeText);
    const score = quality.score({
      name,
      normalizedPhone,
      normalizedEmail,
      resumeText,
      currentCompany,
      currentTitle,
      sourceRecordId,
    });

    return {
      tenantId: options.tenantId,
      traceId: randomUUID(),
      sourceType: 'legacy_db' as const,
      sourcePlatform: options.sourceName,
      sourceRecordId,
      rawPayload: capRawPayload({ sourceName: options.sourceName, source }),
      name,
      phone,
      email,
      normalizedPhone,
      normalizedEmail,
      currentCompany,
      currentTitle,
      resumeText,
      resumeTextTruncated: rawResumeText.length > RESUME_TEXT_LIMIT,
      textHash,
      qualityScore: score.score,
      qualityReasons: score.reasons,
      status: 'scored' as const,
      importDecision: score.decision,
      normalizedPayload: {},
    };
  });
}

export async function insertLegacyRowsInBatches(
  repo: Pick<Repository<CandidateStagingEntity>, 'insert'>,
  rows: CandidateStagingEntity[],
  options: InsertOptions,
) {
  let inserted = 0;
  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    const batch = rows.slice(index, index + BATCH_SIZE);
    if (!options.dryRun) {
      await repo.insert(batch as any);
    }
    inserted += batch.length;
  }
  return { inserted, dryRun: options.dryRun };
}

async function main() {
  loadDotEnv(resolve(process.cwd(), '.env'));
  const args = parseArgs(process.argv.slice(2));
  if (!args.file || !args.tenantId || !args.sourceName) {
    throw new Error(
      'Usage: pnpm --filter @yzschros/api import:legacy --file /path/to/legacy-candidates.ndjson --tenant-id <tenantId> --source-name old-platform-2026 --dry-run',
    );
  }

  const content = readFileSync(resolve(args.file), 'utf8');
  const sourceRows = parseLegacyFileContent(content);
  const stagingRows = buildLegacyStagingRows(sourceRows, {
    tenantId: args.tenantId,
    sourceName: args.sourceName,
  }) as CandidateStagingEntity[];

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'yzschros',
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME || 'yzschros',
    entities: [CandidateStagingEntity],
    synchronize: false,
    logging: false,
  });

  await dataSource.initialize();
  try {
    const result = await insertLegacyRowsInBatches(
      dataSource.getRepository(CandidateStagingEntity),
      stagingRows,
      { dryRun: args.dryRun },
    );
    const counts = stagingRows.reduce<Record<string, number>>((acc, row) => {
      acc[row.importDecision] = (acc[row.importDecision] || 0) + 1;
      return acc;
    }, {});
    console.log(
      JSON.stringify(
        {
          ...result,
          total: stagingRows.length,
          decisions: counts,
        },
        null,
        2,
      ),
    );
  } finally {
    await dataSource.destroy();
  }
}

function parseArgs(argv: string[]) {
  const args: { file?: string; tenantId?: string; sourceName?: string; dryRun: boolean } = {
    dryRun: false,
  };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--file') args.file = argv[++index];
    else if (arg === '--tenant-id') args.tenantId = argv[++index];
    else if (arg === '--source-name') args.sourceName = argv[++index];
    else if (arg === '--dry-run') args.dryRun = true;
  }
  return args;
}

function parseCsv(content: string) {
  const [headerLine, ...lines] = content.split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(headerLine);
  return lines.map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header] = values[index] || '';
      return row;
    }, {});
  });
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && next === '"') {
      current += '"';
      index++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values.map((value) => value.trim());
}

function pickString(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return undefined;
}

function capRawPayload(payload: Record<string, unknown>) {
  if (JSON.stringify(payload).length <= RAW_PAYLOAD_LIMIT) return payload;
  const capped = {
    ...payload,
    source: '[truncated]',
    sourcePreview: JSON.stringify(payload.source).substring(0, 8000),
  };
  while (JSON.stringify(capped).length > RAW_PAYLOAD_LIMIT && capped.sourcePreview.length > 0) {
    capped.sourcePreview = capped.sourcePreview.substring(0, Math.floor(capped.sourcePreview.length / 2));
  }
  return capped;
}

function loadDotEnv(path: string) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}
