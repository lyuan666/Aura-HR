# Data Entry, Chrome Extension, and Client HR Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a controlled data-ingestion foundation first, then connect the Chrome extension and client HR portal without polluting the production talent library.

**Architecture:** Add a staging import layer that receives legacy database rows, browser-extension captures, and manual uploads before they become formal `CandidateEntity` records. Chrome extension sync writes into staging, not directly into `candidates`. Client HR starts as an authenticated portal over existing recommendation/share data, while public share links remain the lightweight external review path.

**Tech Stack:** NestJS 11, TypeORM, PostgreSQL, BullMQ, Redis, Next.js App Router, React, Ant Design, Chrome Extension Manifest V3, Jest.

---

## Scope Decision

This is three related systems, but they should not be implemented as one large feature:

1. **P0 Data Intake/Staging Foundation** — required first. It protects the database from dirty imports and gives every source one controlled entry path.
2. **P1 Chrome Extension Sync** — depends on staging. It should upload captured page text and later attachments into staging.
3. **P2 Client HR Portal** — can reuse current share-link MVP first, then grow into authenticated HR workspace.

The execution order is fixed: P0 first, then P1 and P2 can proceed in parallel.

## Route Decisions and Hard Constraints

These decisions are mandatory for execution:

1. **Staging stage does not call LLM.** Staging only normalizes, dedupes, scores, stores source evidence, and creates review decisions. LLM parsing happens only after manual promotion or an explicit background enrichment action.
2. **Legacy database bulk import uses a CLI script, not HTTP and not BullMQ.** The script writes staging rows directly to Postgres in batches of 500 to avoid Redis/API pressure.
3. **Chrome extension is currently blocked by the global JWT guard.** Extension work is a fix, not a nice-to-have. The baseline must record that the existing extension cannot work reliably in production/multi-tenant mode until token handling and CORS are implemented.
4. **Promote must reuse `CandidateService.create()` or a shared creation method that enqueues vectorization.** Direct `candidateRepo.save()` is forbidden because it skips embedding generation and match-push.
5. **Dedupe must have one source of truth.** Extract a shared `CandidateDedupeService` and make both `CandidateService.create()` and import promotion use it. `ImportDedupeService` may be a thin wrapper, but it must not define separate duplicate rules or a separate text-hash algorithm.
6. **Staging rows are intentionally not unique on file/text/contact fields.** Repeated captures are allowed in staging so reviewers can see source history. Unique constraints stay on formal `candidates`.
7. **Client HR users require explicit enterprise scope.** `hr_client` without `tenantId` or `enterpriseId` must fail authentication. No random tenant fallback is allowed for client HR.
8. **Extension tokens are stored in `chrome.storage.local`, never `chrome.storage.sync`.** Tokens must not sync across the user's Google account devices.
9. **P0 active source types are only `legacy_db`, `chrome_extension`, and `manual_upload`.** `email` and `feishu` are deferred source adapters and are not implemented in this plan.
10. **Production SQL migrations are manual until a separate migration-runner plan is approved.** Every deploy step that adds tables must include `psql -f apps/api/src/migrations/004-import-staging.sql` before restarting API/worker. Converting 001-004 into TypeORM TS migrations is a separate infrastructure plan.
11. **ECS/Postgres capacity is constrained.** List endpoints must never `SELECT raw_payload` or `resume_text`; detail endpoints fetch heavy fields by ID only.
12. **Mac mini LLM throughput is constrained.** `LLM_CONCURRENCY=1` remains the default. Legacy bulk import and staging scoring must not enqueue large LLM backlogs.
13. **Staging attachments use a staging bucket/prefix with retention.** Rejected staging files should expire after 30 days; promoted files move or copy into the normal uploads location.
14. **Every import has a `traceId`.** Extension capture, staging row, optional BullMQ job, promotion, and final candidate must carry the same trace ID for debug.

## File Structure

### Backend Entities and Migrations

- Create: `apps/api/src/entities/import-batch.entity.ts`
  - Owns import batch metadata: source type, status, counters, operator, timestamps.
- Create: `apps/api/src/entities/candidate-staging.entity.ts`
  - Owns normalized-but-unapproved talent records from legacy DB, extension, or manual batch import.
- Create: `apps/api/src/entities/candidate-merge-link.entity.ts`
  - Tracks staging-to-candidate merge decisions and duplicate relationships.
- Modify: `apps/api/src/entities/index.ts`
  - Exports new entities.
- Modify: `apps/api/src/app.module.ts`
  - Registers new entities with TypeORM.
- Create: `apps/api/src/migrations/004-import-staging.sql`
  - Adds staging tables, indexes, uniqueness guards, and status enums where needed.

### Backend Module

- Create: `apps/api/src/modules/import/import.module.ts`
- Create: `apps/api/src/modules/import/import.controller.ts`
- Create: `apps/api/src/modules/import/import.service.ts`
- Create: `apps/api/src/modules/import/import.dto.ts`
- Create: `apps/api/src/modules/import/import-quality.service.ts`
- Create: `apps/api/src/modules/import/import-dedupe.service.ts`
- Create: `apps/api/src/modules/import/import.service.spec.ts`
- Create: `apps/api/src/modules/import/import-quality.service.spec.ts`
- Create: `apps/api/src/modules/import/import-dedupe.service.spec.ts`
- Create: `apps/api/src/modules/import/legacy-import.cli.ts`
  - Direct-to-Postgres batch importer for old owned databases.
- Create: `apps/api/src/modules/candidate/candidate-dedupe.service.ts`
  - Shared duplicate detection used by normal candidate creation and import promotion.
- Modify: `apps/api/src/app.module.ts`
  - Imports `ImportModule`.

### Backend Queue

- No new import queue in P0.
- Existing vectorize/match queues run only after promotion through `CandidateService.create()`.
- Attachment parsing or LLM enrichment can be queued in a later enrichment task, but staging creation itself must stay synchronous and rule-based.

### Chrome Extension

- Modify: `apps/extension/src/background.ts`
  - Replace direct `/candidates` creation with `/import/extension-capture`.
- Modify: `apps/extension/src/content.ts`
  - Add capture preview state and source metadata.
- Modify: `apps/extension/src/popup.tsx`
  - Add API base URL/token settings.
- Modify: `apps/extension/public/manifest.json`
  - Add configurable API host permissions and downloads permission only when attachment capture is implemented.

### Auth, CORS, and Client Visibility

- Modify: `apps/api/src/modules/auth/jwt.strategy.ts`
  - Reject `hr_client` users without `tenantId` and `enterpriseId`; keep internal-user tenant fallback only for non-client roles.
- Modify: `apps/api/src/entities/user.entity.ts`
  - Add `enterpriseId` for client HR MVP scope.
- Create: `apps/api/src/modules/client/client-visibility.ts`
  - Single whitelist for fields visible to authenticated client HR users.
- Modify: `apps/api/src/main.ts`
  - Support extension origins from `CORS_ORIGINS` and document production extension ID configuration.
- Modify: `apps/web/src/middleware.ts`
  - Role-aware routing for `/client/*` and internal routes.

### Web App: Internal Review Workbench

- Create: `apps/web/src/app/(app)/imports/page.tsx`
- Create: `apps/web/src/components/imports/ImportBatchTable.tsx`
- Create: `apps/web/src/components/imports/StagingCandidateTable.tsx`
- Create: `apps/web/src/components/imports/StagingCandidateDrawer.tsx`
- Modify: `apps/web/src/components/v2/V2Sidebar.tsx`
  - Add "数据导入" navigation item.

### Web App: Client HR Portal

- Create: `apps/web/src/app/client/login/page.tsx`
- Create: `apps/web/src/app/client/(portal)/layout.tsx`
- Create: `apps/web/src/app/client/(portal)/recommendations/page.tsx`
- Create: `apps/web/src/app/client/(portal)/recommendations/[id]/page.tsx`
- Create: `apps/web/src/components/client/ClientRecommendationCard.tsx`
- Create: `apps/web/src/components/client/ClientFeedbackPanel.tsx`
- Modify: `apps/api/src/modules/share/share.service.ts`
  - Reuse public share formatting for client portal recommendation cards.
- Modify: `apps/api/src/modules/recommendation/recommendation.controller.ts`
  - Add HR-client scoped recommendation endpoints only after permission boundaries are tested.

---

## Phase 0: Pre-Implementation Audit

### Task 0.1: Capture Current Baseline

**Files:**
- Read: `apps/api/src/entities/candidate.entity.ts`
- Read: `apps/api/src/modules/candidate/candidate.service.ts`
- Read: `apps/api/src/modules/ai/parsing-v2.service.ts`
- Read: `apps/api/src/modules/share/share.service.ts`
- Read: `apps/extension/src/background.ts`
- Read: `apps/extension/src/content.ts`
- Read: `apps/api/src/modules/auth/jwt.strategy.ts`
- Read: `apps/api/src/main.ts`
- Read: `apps/web/src/middleware.ts`

- [ ] **Step 1: Record baseline behavior**

Run:

```bash
pnpm --filter @yzschros/api test --runInBand
pnpm --filter @yzschros/api build
pnpm --filter @yzschros/extension build
pnpm --filter @yzschros/web lint:ci
```

Expected:

```text
API tests pass.
API build passes.
Extension build passes.
Web lint passes or reports only existing unrelated issues.
```

- [ ] **Step 2: Record known baseline defects**

Record these known issues in the task notes before starting implementation:

```text
Extension background currently calls protected API endpoints without Authorization token.
Global JwtAuthGuard blocks extension API calls in production/multi-tenant mode.
JwtStrategy auto-generates tenantId for users without tenantId; this is unsafe for hr_client.
Middleware only checks token presence; it does not route by role.
Production migrations are raw SQL files and are not auto-run.
```

- [ ] **Step 3: Verify database backup exists**

On ECS, run a production backup before any migration or legacy import:

```bash
ssh root@47.97.62.57 'mkdir -p /opt/yzschros/backups && cd /opt/yzschros && docker compose -f deploy/docker-compose.prod.yml exec -T postgres pg_dump -U yzschros yzschros > backups/pre-import-$(date +%Y%m%d%H%M%S).sql'
```

Expected:

```text
The command exits 0 and creates a non-empty backups/pre-import-*.sql file.
```

- [ ] **Step 4: Commit no code in this task**

This task is audit-only. If unexpected failures appear, stop and record them before implementing staging.

### Task 0.2: Production Migration SOP

**Files:**
- Create: `docs/ops/import-staging-deploy-sop.md`

- [ ] **Step 1: Write the migration SOP**

Create `docs/ops/import-staging-deploy-sop.md`:

````md
# Import Staging Production Deploy SOP

## Preconditions

- Confirm current commit is deployed to `/opt/yzschros`.
- Confirm Postgres backup exists under `/opt/yzschros/backups`.
- Confirm API and worker are healthy before migration.

## Apply SQL Migration

Run on ECS:

```bash
cd /opt/yzschros
docker compose -f deploy/docker-compose.prod.yml exec -T postgres \
  psql -U yzschros -d yzschros \
  < /opt/yzschros/apps/api/src/migrations/004-import-staging.sql
```

> 注意：SQL 文件在宿主机上，Postgres 容器只挂了 `pgdata` 卷，没有挂 `/opt/yzschros`。这里用宿主机的 stdin 重定向（`<`）把 SQL 内容喂给容器里的 psql，不能用 `-f /opt/yzschros/...`（容器里没这个路径）。

## Restart Services

```bash
pm2 restart yzschros-api
```

Run on Mac mini:

```bash
cd /Users/lee/yzschros
pnpm --filter @yzschros/api build
pm2 restart yzschros-worker --update-env
pm2 save
```

## Verify

```bash
ssh root@47.97.62.57 'cd /opt/yzschros && curl -sS http://127.0.0.1:3001/api'
ssh -i ~/.ssh/id_rsa lee@192.168.3.47 'zsh -lc "export PATH=/usr/local/bin:/opt/homebrew/bin:/Users/lee/.npm-global/bin:/usr/bin:/bin:/usr/sbin:/sbin; pm2 status yzschros-worker"'
```
````

- [ ] **Step 2: Commit**

```bash
git add docs/ops/import-staging-deploy-sop.md
git commit -m "docs: add import staging deploy SOP"
```

---

## Phase 1: Data Intake/Staging Foundation

### Task 1.1: Add Staging Entities and Migration

**Files:**
- Create: `apps/api/src/entities/import-batch.entity.ts`
- Create: `apps/api/src/entities/candidate-staging.entity.ts`
- Create: `apps/api/src/entities/candidate-merge-link.entity.ts`
- Create: `apps/api/src/migrations/004-import-staging.sql`
- Modify: `apps/api/src/entities/index.ts`
- Modify: `apps/api/src/app.module.ts`
- Test: `apps/api/src/modules/import/import-quality.service.spec.ts`

- [ ] **Step 1: Create failing compile check**

Add temporary import references in the upcoming test file:

```ts
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
```

Run:

```bash
pnpm --filter @yzschros/api test --runInBand apps/api/src/modules/import/import-quality.service.spec.ts
```

Expected: fail because entity files do not exist.

- [ ] **Step 2: Create `ImportBatchEntity`**

Create `apps/api/src/entities/import-batch.entity.ts`:

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type ImportSourceType = 'legacy_db' | 'chrome_extension' | 'manual_upload';
export type ImportBatchStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

@Entity('import_batches')
@Index(['tenantId', 'createdAt'])
@Index(['tenantId', 'status'])
export class ImportBatchEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', nullable: true })
  @Index()
  tenantId: string;

  @Column({ name: 'source_type' })
  sourceType: ImportSourceType;

  @Column({ name: 'source_name', nullable: true })
  sourceName: string;

  @Column({ name: 'operator_id', nullable: true })
  operatorId: string;

  @Column({ name: 'trace_id', nullable: true })
  @Index()
  traceId: string;

  @Column({ default: 'pending' })
  status: ImportBatchStatus;

  @Column({ name: 'total_count', default: 0 })
  totalCount: number;

  @Column({ name: 'accepted_count', default: 0 })
  acceptedCount: number;

  @Column({ name: 'review_count', default: 0 })
  reviewCount: number;

  @Column({ name: 'rejected_count', default: 0 })
  rejectedCount: number;

  @Column({ name: 'duplicate_count', default: 0 })
  duplicateCount: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

- [ ] **Step 3: Create `CandidateStagingEntity`**

Create `apps/api/src/entities/candidate-staging.entity.ts`:

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { ImportSourceType } from './import-batch.entity';

export type StagingDecision = 'reject' | 'review' | 'candidate';
export type StagingStatus = 'raw' | 'normalized' | 'deduped' | 'scored' | 'merged' | 'rejected' | 'failed';

@Entity('candidate_staging')
@Index(['tenantId', 'createdAt'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'importDecision'])
@Index(['tenantId', 'normalizedPhone'])
@Index(['tenantId', 'normalizedEmail'])
@Index(['tenantId', 'textHash'])
export class CandidateStagingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', nullable: true })
  @Index()
  tenantId: string;

  @Column({ name: 'batch_id', nullable: true })
  @Index()
  batchId: string;

  @Column({ name: 'trace_id', nullable: true })
  @Index()
  traceId: string;

  @Column({ name: 'source_type' })
  sourceType: ImportSourceType;

  @Column({ name: 'source_platform', nullable: true })
  sourcePlatform: string;

  @Column({ name: 'source_url', type: 'text', nullable: true })
  sourceUrl: string;

  @Column({ name: 'source_record_id', nullable: true })
  sourceRecordId: string;

  @Column({ name: 'raw_payload', type: 'jsonb', default: {} })
  rawPayload: Record<string, unknown>;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ name: 'normalized_phone', nullable: true })
  normalizedPhone: string;

  @Column({ name: 'normalized_email', nullable: true })
  normalizedEmail: string;

  @Column({ name: 'current_company', nullable: true })
  currentCompany: string;

  @Column({ name: 'current_title', nullable: true })
  currentTitle: string;

  @Column({ name: 'resume_text', type: 'text', nullable: true })
  resumeText: string;

  @Column({ name: 'resume_text_truncated', default: false })
  resumeTextTruncated: boolean;

  @Column({ name: 'file_hash', nullable: true })
  fileHash: string;

  @Column({ name: 'staging_file_key', nullable: true })
  stagingFileKey: string;

  @Column({ name: 'text_hash', nullable: true })
  textHash: string;

  @Column({ name: 'quality_score', default: 0 })
  qualityScore: number;

  @Column({ name: 'quality_reasons', type: 'jsonb', default: [] })
  qualityReasons: string[];

  @Column({ default: 'raw' })
  status: StagingStatus;

  @Column({ name: 'import_decision', default: 'review' })
  importDecision: StagingDecision;

  @Column({ name: 'reject_reason', nullable: true })
  rejectReason: string;

  @Column({ name: 'review_reason', nullable: true })
  reviewReason: string;

  @Column({ name: 'matched_candidate_id', nullable: true })
  matchedCandidateId: string;

  @Column({ name: 'created_candidate_id', nullable: true })
  createdCandidateId: string;

  @Column({ name: 'normalized_payload', type: 'jsonb', default: {} })
  normalizedPayload: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

Staging storage limits:

```text
rawPayload must stay under 100KB after JSON serialization.
resumeText must be capped at 50,000 characters in staging.
resumeTextTruncated must be true when the source text was longer than 50,000 characters.
candidate_staging must not have embedding columns.
candidate_staging must not have unique constraints on fileHash, textHash, phone, or email.
```

- [ ] **Step 4: Create `CandidateMergeLinkEntity`**

Create `apps/api/src/entities/candidate-merge-link.entity.ts`:

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('candidate_merge_links')
@Index(['tenantId', 'stagingCandidateId'])
@Index(['tenantId', 'candidateId'])
export class CandidateMergeLinkEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', nullable: true })
  @Index()
  tenantId: string;

  @Column({ name: 'staging_candidate_id' })
  stagingCandidateId: string;

  @Column({ name: 'candidate_id' })
  candidateId: string;

  @Column({ name: 'match_type' })
  matchType: 'phone' | 'email' | 'text_hash' | 'file_hash' | 'name_source' | 'name_company' | 'manual';

  @Column({ type: 'decimal', precision: 4, scale: 2, default: 0 })
  confidence: number;

  @Column({ name: 'operator_id', nullable: true })
  operatorId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

- [ ] **Step 5: Register entities**

Modify `apps/api/src/entities/index.ts` to export:

```ts
export { ImportBatchEntity } from './import-batch.entity';
export { CandidateStagingEntity } from './candidate-staging.entity';
export { CandidateMergeLinkEntity } from './candidate-merge-link.entity';
```

Modify `apps/api/src/app.module.ts` imports and TypeORM entity list to include:

```ts
ImportBatchEntity,
CandidateStagingEntity,
CandidateMergeLinkEntity,
```

- [ ] **Step 6: Add migration**

Create `apps/api/src/migrations/004-import-staging.sql` with tables matching the entities, plus these indexes:

```sql
-- Staging indexes are intentionally non-unique.
-- Repeated captures/import attempts must remain visible for review and source auditing.
CREATE INDEX IF NOT EXISTS idx_import_batches_tenant_status ON import_batches (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_candidate_staging_tenant_decision ON candidate_staging (tenant_id, import_decision);
CREATE INDEX IF NOT EXISTS idx_candidate_staging_review_created_at
  ON candidate_staging (tenant_id, created_at DESC)
  WHERE import_decision = 'review';
CREATE INDEX IF NOT EXISTS idx_candidate_staging_phone ON candidate_staging (tenant_id, normalized_phone);
CREATE INDEX IF NOT EXISTS idx_candidate_staging_email ON candidate_staging (tenant_id, normalized_email);
CREATE INDEX IF NOT EXISTS idx_candidate_staging_text_hash ON candidate_staging (tenant_id, text_hash);
CREATE INDEX IF NOT EXISTS idx_candidate_staging_trace_id ON candidate_staging (trace_id);
CREATE INDEX IF NOT EXISTS idx_candidate_merge_links_staging ON candidate_merge_links (tenant_id, staging_candidate_id);
```

- [ ] **Step 7: Verify**

Run:

```bash
pnpm --filter @yzschros/api test --runInBand apps/api/src/modules/import/import-quality.service.spec.ts
pnpm --filter @yzschros/api build
```

Expected: tests and build pass.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/entities apps/api/src/app.module.ts apps/api/src/migrations/004-import-staging.sql apps/api/src/modules/import/import-quality.service.spec.ts
git commit -m "feat: add candidate import staging entities"
```

### Task 1.2: Add Shared Dedupe, Normalization, and Quality Score Services

**Files:**
- Create: `apps/api/src/modules/candidate/candidate-dedupe.service.ts`
- Modify: `apps/api/src/modules/candidate/candidate.module.ts`
- Modify: `apps/api/src/modules/candidate/candidate.service.ts`
- Create: `apps/api/src/modules/import/import-quality.service.ts`
- Create: `apps/api/src/modules/import/import-dedupe.service.ts`
- Create: `apps/api/src/modules/import/import.dto.ts`
- Test: `apps/api/src/modules/import/import-quality.service.spec.ts`
- Test: `apps/api/src/modules/import/import-dedupe.service.spec.ts`
- Test: `apps/api/src/modules/candidate/candidate-dedupe.service.spec.ts`

- [ ] **Step 1: Write quality service tests**

Create tests covering:

```ts
expect(service.normalizePhone(' 138-0013-8000 ')).toBe('13800138000');
expect(service.normalizeEmail(' Test@Example.COM ')).toBe('test@example.com');
expect(service.computeTextHash('张三 Java Redis')).toHaveLength(64);
expect(service.score({
  name: '张三',
  normalizedPhone: '13800138000',
  email: 'a@b.com',
  resumeText: '8年Java后端工程师，熟悉PostgreSQL和Redis'.repeat(20),
  currentCompany: '某科技公司',
  currentTitle: '高级后端工程师',
}).decision).toBe('candidate');
expect(service.score({ name: '张三' }).decision).toBe('reject');
```

Run:

```bash
pnpm --filter @yzschros/api test --runInBand apps/api/src/modules/import/import-quality.service.spec.ts
```

Expected: fail because service is missing.

- [ ] **Step 2: Implement `ImportQualityService`**

Create methods:

```ts
normalizePhone(value?: string): string | null
normalizeEmail(value?: string): string | null
computeTextHash(value?: string): string | null
score(input: QualityInput): { score: number; reasons: string[]; decision: 'reject' | 'review' | 'candidate' }
```

Scoring rules:

```text
+25 phone or email exists
+5 both phone and email exist
+15 resumeText length >= 500
+10 resumeText length >= 2000
+10 currentCompany exists
+10 currentTitle exists
+10 name exists
+5 sourceUrl or sourceRecordId exists
candidate: score >= 65
review: score 35-64
reject: score < 35
```

- [ ] **Step 3: Write shared candidate dedupe tests**

Create `apps/api/src/modules/candidate/candidate-dedupe.service.spec.ts`. Mock `CandidateEntity` repository and test:

```ts
phone match returns { status: 'duplicate', matchType: 'phone' }
email match returns { status: 'duplicate', matchType: 'email' }
textHash match returns { status: 'duplicate', matchType: 'text_hash' }
fileHash match returns { status: 'duplicate', matchType: 'file_hash' }
same sourcePlatform + same name returns { status: 'duplicate', matchType: 'name_source' }
no match returns { status: 'unique' }
```

- [ ] **Step 4: Implement `CandidateDedupeService` as the only duplicate-rule owner**

Create:

```ts
findDuplicate(input: {
  tenantId?: string;
  normalizedPhone?: string | null;
  normalizedEmail?: string | null;
  textHash?: string | null;
  fileHash?: string | null;
  name?: string | null;
  currentCompany?: string | null;
  sourcePlatform?: string | null;
}): Promise<{ status: 'unique' | 'duplicate'; candidateId?: string; matchType?: string; confidence?: number }>
```

Use existing `CandidateEntity` repository and query in this order:

```text
phone -> email -> textHash -> fileHash -> sourcePlatform + name -> name + currentCompany
```

`CandidateDedupeService` must use `ParsingV2Service.computeTextHash()` wherever it needs text hashing. It must not introduce a second text-hash algorithm.

- [ ] **Step 5: Update `CandidateService.create()` to use shared dedupe**

Replace local duplicate queries in `CandidateService.create()` with `CandidateDedupeService.findDuplicate()`.

Expected behavior:

```text
Existing duplicate cases in CandidateService tests still pass.
Vectorize queue is still enqueued after successful candidate creation.
ConflictException still returns a clear duplicate message.
```

- [ ] **Step 6: Implement `ImportDedupeService` as a thin wrapper**

`ImportDedupeService` should delegate to `CandidateDedupeService.findDuplicate()` and only translate staging-specific input names. It must not query `CandidateEntity` directly.

`CandidateModule` must export `CandidateDedupeService`, and `ImportModule` must import `CandidateModule` to access it. If Nest reports a circular dependency with queue/candidate imports, use `forwardRef(() => CandidateModule)` in `ImportModule`.

Example wrapper shape:

```ts
return this.candidateDedupe.findDuplicate({
  tenantId: input.tenantId,
  normalizedPhone: input.normalizedPhone,
  normalizedEmail: input.normalizedEmail,
  textHash: input.textHash,
  fileHash: input.fileHash,
  name: input.name,
  currentCompany: input.currentCompany,
  sourcePlatform: input.sourcePlatform,
});
```

- [ ] **Step 7: Verify**

```bash
pnpm --filter @yzschros/api test --runInBand apps/api/src/modules/import
pnpm --filter @yzschros/api test --runInBand apps/api/src/modules/candidate
pnpm --filter @yzschros/api build
```

Expected: tests and build pass.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/modules/import apps/api/src/modules/candidate
git commit -m "feat: share candidate dedupe across imports"
```

### Task 1.3: Add Import API

**Files:**
- Create: `apps/api/src/modules/import/import.module.ts`
- Create: `apps/api/src/modules/import/import.controller.ts`
- Create: `apps/api/src/modules/import/import.service.ts`
- Modify: `apps/api/src/app.module.ts`
- Test: `apps/api/src/modules/import/import.service.spec.ts`

- [ ] **Step 1: Write API service tests**

Test `createExtensionCapture()`:

```ts
await service.createExtensionCapture({
  sourcePlatform: 'boss_zhipin',
  sourceUrl: 'https://www.zhipin.com/web/geek/resume',
  name: '张三',
  rawText: '张三 8年 Java Redis PostgreSQL',
}, { tenantId: 't1', operatorId: 'u1' });
```

Expected staging row:

```ts
sourceType === 'chrome_extension'
status === 'scored'
importDecision is one of ['reject', 'review', 'candidate']
rawPayload.sourceUrl is preserved
traceId is present
resumeText.length <= 50000
```

- [ ] **Step 2: Implement DTOs**

Create `CreateExtensionCaptureDto`:

```ts
sourcePlatform: string;
sourceUrl: string;
name?: string;
company?: string;
title?: string;
rawText: string;
sourceRecordId?: string;
traceId?: string;
```

Create `ReviewStagingCandidateDto`:

```ts
decision: 'reject' | 'review' | 'candidate';
rejectReason?: string;
```

- [ ] **Step 3: Implement controller**

Routes:

```text
POST /api/import/extension-capture
GET  /api/import/batches
GET  /api/import/staging
GET  /api/import/staging/:id
PATCH /api/import/staging/:id/decision
POST /api/import/staging/:id/promote
```

Every route requires JWT. Tenant comes from `req.user.tenantId`.

List endpoints must select only light fields:

```text
id, traceId, sourceType, sourcePlatform, sourceUrl, name, phone, email,
currentCompany, currentTitle, qualityScore, qualityReasons,
status, importDecision, matchedCandidateId, createdCandidateId,
createdAt, updatedAt
```

List endpoints must not select:

```text
rawPayload, normalizedPayload, resumeText
```

Detail endpoint by ID may return heavy fields.

- [ ] **Step 4: Implement `promoteToCandidate()`**

Promotion creates a normal candidate only when:

```text
importDecision === 'candidate' or explicit manual promotion
no high-confidence duplicate exists
name exists
phone or email or resumeText exists
```

Use existing `CandidateService.create()` or a shared method that enqueues vectorization. Direct `candidateRepo.save()` is forbidden.

Preserve source:

```ts
sourcePlatform: staging.sourcePlatform || staging.sourceType
importedBy: operatorId
parsedTags: {
  ...staging.normalizedPayload,
  legacy: staging.rawPayload,
  import: { stagingId, batchId, sourceUrl }
}
```

Race-condition handling:

```text
If CandidateService.create() throws ConflictException during promotion,
catch it and convert the staging row to a merged state instead of returning 500.
Set status = 'merged', importDecision = 'candidate', and matchedCandidateId to the existing candidate ID when available.
Return a frontend-safe result: { status: 'merged', candidateId: matchedCandidateId }.
```

- [ ] **Step 5: Enforce staging-only scoring**

`createExtensionCapture()` and manual staging creation must not call:

```text
LlmRouterService
LlmClientService
ParsingV2Service.extractStructured()
EmbeddingService
```

They may call only pure normalization, quality scoring, and dedupe checks.

- [ ] **Step 6: Verify**

```bash
pnpm --filter @yzschros/api test --runInBand apps/api/src/modules/import
pnpm --filter @yzschros/api build
```

Expected: tests and build pass.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/import apps/api/src/app.module.ts
git commit -m "feat: add candidate import staging API"
```

### Task 1.4: Add Legacy Database Direct Import CLI

**Files:**
- Create: `apps/api/src/modules/import/legacy-import.cli.ts`
- Create: `docs/ops/legacy-import.md`
- Test: `apps/api/src/modules/import/legacy-import.cli.spec.ts`

- [ ] **Step 1: Define CLI input contract**

The CLI accepts an exported NDJSON or CSV file from the owned legacy database. It does not connect to unknown external services.

Required command shape:

```bash
pnpm --filter @yzschros/api import:legacy --file /path/to/legacy-candidates.ndjson --tenant-id <tenantId> --source-name old-platform-2026 --dry-run
```

- [ ] **Step 2: Implement batch insert behavior**

Rules:

```text
Batch size: 500 rows
Target: candidate_staging only
HTTP: not used
BullMQ: not used
LLM: not used
Embedding: not used
rawPayload: max 100KB JSON
resumeText: max 50,000 characters
traceId: generate per row
```

- [ ] **Step 3: Add package script**

Modify `apps/api/package.json`:

```json
{
  "scripts": {
    "import:legacy": "tsx src/modules/import/legacy-import.cli.ts"
  }
}
```

- [ ] **Step 4: Write dry-run docs**

Create `docs/ops/legacy-import.md` with:

```md
# Legacy Candidate Import

1. Export old owned database candidates to NDJSON.
2. Run dry-run first.
3. Review counts by decision.
4. Run actual import.
5. Open `/imports` to review staging rows.
6. Promote only A/B quality rows.

The importer never writes directly to `candidates`.
```

- [ ] **Step 5: Verify**

```bash
pnpm --filter @yzschros/api test --runInBand apps/api/src/modules/import
pnpm --filter @yzschros/api build
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/import apps/api/package.json docs/ops/legacy-import.md
git commit -m "feat: add legacy candidate staging importer"
```

### Task 1.5: Add LLM Parse Cache Guard for Future Enrichment

**Files:**
- Modify: `apps/api/src/modules/ai/parsing-v2.service.ts`
- Test: `apps/api/src/modules/ai/parsing-v2.service.spec.ts`

- [ ] **Step 1: Write cache behavior tests**

Test:

```text
same textHash within 24h reuses cached structured profile
cache miss calls LlmRouterService once
cache write stores structured profile by textHash
cache failure does not fail parsing
```

- [ ] **Step 2: Implement Redis cache around structured extraction**

Add cache key:

```text
llm:resume-parse:<textHash>
```

TTL:

```text
86400 seconds
```

Cache only the LLM structured output. Do not cache raw files or raw payloads.

The cache key intentionally does not include `tenantId` because current structured resume extraction is tenant-agnostic: identical resume text should produce identical extracted fields. If future prompts add tenant-specific extraction rules, upgrade the key format to:

```text
llm:resume-parse:<tenantId>:<textHash>
```

- [ ] **Step 3: Keep staging independent**

Do not call this cache from staging creation. This cache only protects future promotion/enrichment paths that explicitly choose to run LLM parsing.

- [ ] **Step 4: Verify**

```bash
pnpm --filter @yzschros/api test --runInBand apps/api/src/modules/ai
pnpm --filter @yzschros/api build
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/ai
git commit -m "perf: cache resume parse results by text hash"
```

---

## Phase 2: Internal Import Review Workbench

### Task 2.1: Add Import Review Page

**Files:**
- Create: `apps/web/src/app/(app)/imports/page.tsx`
- Create: `apps/web/src/components/imports/ImportBatchTable.tsx`
- Create: `apps/web/src/components/imports/StagingCandidateTable.tsx`
- Create: `apps/web/src/components/imports/StagingCandidateDrawer.tsx`
- Modify: `apps/web/src/components/v2/V2Sidebar.tsx`

- [ ] **Step 1: Create page shell**

Page must show:

```text
顶部统计: 总暂存 / 可入库 / 待复核 / 重复 / 拒绝
左侧批次列表
右侧 staging candidates table
抽屉详情: 原始文本、标准化字段、质量原因、重复命中、操作按钮
```

- [ ] **Step 2: Add API calls**

Use existing `apps/web/src/lib/api.ts`:

```ts
api.get('/import/batches')
api.get('/import/staging', { params: { page, pageSize, decision } })
api.patch(`/import/staging/${id}/decision`, { decision, rejectReason })
api.post(`/import/staging/${id}/promote`)
```

- [ ] **Step 3: Add navigation**

Add sidebar item:

```ts
{ key: 'imports', label: '数据导入', icon: <Database size={20} />, path: '/imports' }
```

- [ ] **Step 4: Verify**

Run:

```bash
pnpm --filter @yzschros/web lint:ci
pnpm --filter @yzschros/web build
```

Expected: web lint/build pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/'(app)'/imports apps/web/src/components/imports apps/web/src/components/v2/V2Sidebar.tsx
git commit -m "feat: add import review workbench"
```

---

## Phase 3: Chrome Extension Sync

### Task 3.1: Add Extension Authentication Settings

**Files:**
- Modify: `apps/extension/src/popup.tsx`
- Modify: `apps/extension/src/background.ts`
- Modify: `apps/extension/public/manifest.json`
- Modify: `apps/api/src/main.ts`

- [ ] **Step 1: Add popup settings**

Popup stores values in `chrome.storage.local`, not `chrome.storage.sync`:

```ts
apiBaseUrl: string; // default http://localhost:3001/api
accessToken: string;
tokenSavedAt: number;
```

Use:

```ts
chrome.storage.local.set({ apiBaseUrl, accessToken, tokenSavedAt: Date.now() })
chrome.storage.local.get(['apiBaseUrl', 'accessToken', 'tokenSavedAt'])
```

If `Date.now() - tokenSavedAt > 7 * 24 * 60 * 60 * 1000`, clear the token and ask the user to log in again.

- [ ] **Step 2: Update background API client**

Every request uses:

```ts
Authorization: `Bearer ${accessToken}`
```

If missing token, return:

```ts
{ success: false, message: '请先在插件设置中填写 YZSCHROS Token' }
```

- [ ] **Step 3: Make API base URL truly configurable**

The extension must not hardcode `http://localhost:3001/api`. It must read `apiBaseUrl` for every request. Default:

```text
http://localhost:3001/api
```

Production users can set:

```text
http://47.97.62.57:3001/api
```

or a future HTTPS domain.

- [ ] **Step 4: Update manifest permissions**

Use broad host permissions only for API calls and explicit user-triggered captures:

```json
"host_permissions": [
  "<all_urls>"
]
```

The content script matches remain limited to supported recruitment sites:

```json
"matches": ["https://www.zhipin.com/*", "https://www.liepin.com/*"]
```

- [ ] **Step 5: Add CORS configuration requirement**

Modify `apps/api/src/main.ts` only if needed to document and support extension origins from `CORS_ORIGINS`.

Production `CORS_ORIGINS` must include:

```text
chrome-extension://<extension-id>
```

Development may temporarily include `chrome-extension://*` because unpacked extension IDs can change during local testing. Production must replace that with the fixed packaged extension ID. Do not use wildcard production CORS origins.

- [ ] **Step 6: Verify**

```bash
pnpm --filter @yzschros/extension build
pnpm --filter @yzschros/api build
```

Expected: extension build passes.

- [ ] **Step 7: Commit**

```bash
git add apps/extension apps/api/src/main.ts
git commit -m "feat: add extension API authentication settings"
```

### Task 3.2: Route Captures into Staging

**Files:**
- Modify: `apps/extension/src/background.ts`
- Modify: `apps/extension/src/content.ts`

- [ ] **Step 1: Replace direct candidate creation**

Change background from:

```text
POST /ai/parse-resume
POST /candidates
```

to:

```text
POST /import/extension-capture
```

Payload:

```ts
{
  sourcePlatform,
  sourceUrl: url,
  sourceRecordId,
  name,
  company,
  title,
  rawText
}
```

- [ ] **Step 2: Update UI copy**

Content panel success should say:

```text
已进入数据导入暂存区
质量评分: xx
处理状态: 待复核 / 可入库 / 重复 / 拒绝
```

It must not claim "已成功入库" unless backend response includes `createdCandidateId`.

- [ ] **Step 3: Verify**

```bash
pnpm --filter @yzschros/extension build
```

Expected: extension build passes.

- [ ] **Step 4: Commit**

```bash
git add apps/extension
git commit -m "feat: send extension captures to import staging"
```

### Task 3.3: Attachment Sync MVP

**Files:**
- Modify: `apps/extension/public/manifest.json`
- Modify: `apps/extension/src/content.ts`
- Modify: `apps/extension/src/background.ts`
- Modify: `apps/api/src/modules/import/import.controller.ts`
- Modify: `apps/api/src/modules/import/import.service.ts`

- [ ] **Step 1: Add backend endpoint**

Add:

```text
POST /api/import/extension-attachment
Content-Type: multipart/form-data
fields: sourcePlatform, sourceUrl, sourceRecordId, name, company, title
file: resume
```

Service saves file using existing `StorageService` and records a staging row with `fileHash`. It must not queue parse automatically in the MVP.

For MVP, do not run LLM parsing at staging time. Store:

```text
stagingFileKey
fileHash
sourceUrl
traceId
qualityScore from rule-based metadata
```

Use a staging bucket or prefix:

```text
staging/resumes/<traceId>/<filename>
```

Add ops note: rejected staging attachments expire after 30 days; promoted attachments are copied or moved to the normal uploads location.

- [ ] **Step 2: Add content script detection**

Detect only explicit PDF/DOC/DOCX links:

```ts
const links = [...document.querySelectorAll('a[href]')]
  .filter((a) => /\.(pdf|doc|docx)(\?|$)/i.test((a as HTMLAnchorElement).href));
```

Require user click. No background bulk scraping.

- [ ] **Step 3: Add extension upload**

On click:

```ts
fetch(fileUrl)
FormData.append('resume', blob, fileName)
POST /import/extension-attachment
```

- [ ] **Step 4: Verify**

```bash
pnpm --filter @yzschros/api test --runInBand apps/api/src/modules/import
pnpm --filter @yzschros/api build
pnpm --filter @yzschros/extension build
```

Expected: tests/build pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/import apps/extension
git commit -m "feat: add extension resume attachment sync"
```

### Task 3.4: Add Extension Endpoint Production Guardrails

**Files:**
- Modify: `deploy/nginx.conf`
- Modify: `docs/ops/import-staging-deploy-sop.md`

- [ ] **Step 1: Add rate-limit guidance**

Document Nginx guardrail:

```nginx
limit_req_zone $http_authorization zone=ext_zone:10m rate=10r/s;

location /api/import/extension-capture {
  limit_req zone=ext_zone burst=20 nodelay;
  proxy_pass http://127.0.0.1:3001;
}

location /api/import/extension-attachment {
  limit_req zone=ext_zone burst=10 nodelay;
  client_max_body_size 20m;
  proxy_pass http://127.0.0.1:3001;
}
```

- [ ] **Step 2: Verify production config manually**

Run on ECS after config update:

```bash
nginx -t
systemctl reload nginx
```

- [ ] **Step 3: Commit**

```bash
git add deploy/nginx.conf docs/ops/import-staging-deploy-sop.md
git commit -m "ops: add extension import endpoint guardrails"
```

---

## Phase 4: Client HR Portal

### Task 4.1: Define Client HR Identity, Scope, and Visibility Boundary

**Files:**
- Modify: `apps/api/src/entities/user.entity.ts`
- Modify: `apps/api/src/modules/auth/jwt.strategy.ts`
- Create: `apps/api/src/modules/client/client-visibility.ts`
- Modify: `apps/api/src/modules/recommendation/recommendation.controller.ts`
- Modify: `apps/api/src/modules/recommendation/recommendation.service.ts`
- Test: `apps/api/src/modules/recommendation/recommendation.service.spec.ts`
- Test: `apps/api/src/modules/auth/auth.service.spec.ts`

- [ ] **Step 1: Add client HR enterprise scope**

Modify `UserEntity`:

```ts
@Column({ name: 'enterprise_id', nullable: true })
@Index()
enterpriseId: string;
```

For this MVP, `enterpriseId` is the single enterprise scope for an `hr_client`. A future many-to-many `UserEnterpriseScope` table is out of scope.

- [ ] **Step 2: Fix JwtStrategy tenant fallback**

Rules:

```text
role === 'hr_client' and missing tenantId -> UnauthorizedException
role === 'hr_client' and missing enterpriseId -> UnauthorizedException
non-client roles may keep existing tenant fallback behavior for now
```

Returned JWT user object must include:

```ts
{
  sub: user.id,
  email: user.email,
  role: user.role,
  tenantId,
  enterpriseId: user.enterpriseId,
}
```

- [ ] **Step 3: Create client field visibility whitelist**

Create `apps/api/src/modules/client/client-visibility.ts`:

```ts
export const CLIENT_RECOMMENDATION_CANDIDATE_FIELDS = {
  publicShare: ['name', 'skills', 'education', 'yearsOfExperience'],
  authenticatedClient: [
    'displayName',
    'currentTitle',
    'currentCompany',
    'totalYears',
    'degree',
    'school',
    'skills',
    'workExperiencesSummary',
    'projectExperiencesSummary',
  ],
  hidden: ['phone', 'email', 'wechat', 'resumeUrl', 'resumeText'],
} as const;
```

Authenticated client HR can see a stronger profile than anonymous share links, but still cannot see contact fields or raw resume files by default.

- [ ] **Step 4: Write tests**

Test:

```text
hr_client without tenantId is rejected by JwtStrategy
hr_client without enterpriseId is rejected by JwtStrategy
hr_client can only read recommendations linked to its tenant and enterprise scope
hr_client cannot create recommendations
hr_client cannot see candidate phone/email by default
consultant/admin existing behavior stays unchanged
```

- [ ] **Step 5: Add service methods**

Add:

```ts
findClientRecommendations(tenantId: string, enterpriseId: string, page = 1, pageSize = 20)
findClientRecommendationDetail(id: string, tenantId: string, enterpriseId: string)
submitClientFeedback(id: string, tenantId: string, enterpriseId: string, feedback: string)
```

These methods return the `authenticatedClient` visibility profile from `client-visibility.ts`: stronger than anonymous share links, but with contact fields and raw resume fields hidden by default.

- [ ] **Step 6: Verify**

```bash
pnpm --filter @yzschros/api test --runInBand apps/api/src/modules/auth
pnpm --filter @yzschros/api test --runInBand apps/api/src/modules/recommendation
pnpm --filter @yzschros/api build
```

Expected: recommendation tests and build pass.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/entities/user.entity.ts apps/api/src/modules/client apps/api/src/modules/recommendation apps/api/src/modules/auth
git commit -m "feat: add client HR recommendation permissions"
```

### Task 4.2: Add Role-Aware Routing Middleware

**Files:**
- Modify: `apps/web/src/middleware.ts`
- Add dependency only if needed: `apps/web/package.json`

- [ ] **Step 1: Make `/client/login` public**

`publicPaths` must include:

```ts
'/client/login'
```

- [ ] **Step 2: Decode role from token**

Use a tiny local decode helper or `jwt-decode`. Middleware behavior:

```text
No token + /client/* except /client/login -> redirect /client/login
No token + internal route -> redirect /login
hr_client + internal route -> redirect /client/recommendations
admin/manager/consultant + /client/* -> redirect /dashboard
hr_client + /client/* -> allow
internal user + internal route -> allow
```

Wrap token decode in `try/catch`. If decode fails, treat it as an invalid session: clear the `token` cookie and redirect to the correct login route.

- [ ] **Step 3: Verify**

```bash
pnpm --filter @yzschros/web lint:ci
pnpm --filter @yzschros/web build
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/middleware.ts apps/web/package.json
git commit -m "feat: add role-aware client routing"
```

### Task 4.3: Add Client HR Portal Pages

**Files:**
- Create: `apps/web/src/app/client/login/page.tsx`
- Create: `apps/web/src/app/client/(portal)/layout.tsx`
- Create: `apps/web/src/app/client/(portal)/recommendations/page.tsx`
- Create: `apps/web/src/app/client/(portal)/recommendations/[id]/page.tsx`
- Create: `apps/web/src/components/client/ClientRecommendationCard.tsx`
- Create: `apps/web/src/components/client/ClientFeedbackPanel.tsx`

- [ ] **Step 1: Build `/client/login`**

Use same auth API as internal login but route successful `hr_client` users to:

```text
/client/recommendations
```

Non-`hr_client` users are redirected to:

```text
/dashboard
```

- [ ] **Step 2: Build recommendation list**

List fields:

```text
候选人脱敏名
岗位
匹配度
推荐时间
当前状态
反馈按钮
```

- [ ] **Step 3: Build detail page**

Sections:

```text
候选人概要
AI 亮点
潜在风险
面试建议
猎头备注
反馈区: 发起面试 / 不合适 / 需要更多信息
```

- [ ] **Step 4: Verify**

```bash
pnpm --filter @yzschros/web lint:ci
pnpm --filter @yzschros/web build
```

Expected: web lint/build pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/client apps/web/src/components/client
git commit -m "feat: add client HR portal MVP"
```

---

## Phase 5: Rollout and QA

### Task 5.1: End-to-End QA

**Files:**
- No production code unless QA finds defects.

- [ ] **Step 1: API regression**

```bash
pnpm --filter @yzschros/api test --runInBand
pnpm --filter @yzschros/api build
```

- [ ] **Step 2: Frontend regression**

```bash
pnpm --filter @yzschros/web lint:ci
pnpm --filter @yzschros/web build
```

- [ ] **Step 3: Extension regression**

```bash
pnpm --filter @yzschros/extension build
```

- [ ] **Step 4: Manual smoke**

Smoke paths:

```text
/dashboard
/candidates
/imports
/share/:token
/client/login
/client/recommendations
Chrome extension popup
Chrome extension capture on supported test page
```

- [ ] **Step 5: Commit fixes only if needed**

```bash
git add <fixed-files>
git commit -m "fix: stabilize import and client HR rollout"
```

### Task 5.2: Add Import Observability

**Files:**
- Modify: `apps/api/src/modules/import/import.service.ts`
- Create: `apps/api/src/modules/import/import-events.ts`
- Create: `apps/api/src/modules/import/import-observability.service.ts`
- Test: `apps/api/src/modules/import/import-observability.service.spec.ts`

- [ ] **Step 1: Define event names**

Create `apps/api/src/modules/import/import-events.ts`:

```ts
export const IMPORT_EVENTS = {
  stagingCreated: 'import.staging.created',
  stagingDuplicate: 'import.staging.duplicate',
  stagingPromoted: 'import.staging.promoted',
  stagingRejected: 'import.staging.rejected',
  stagingFailed: 'import.staging.failed',
} as const;
```

- [ ] **Step 2: Emit events from service actions**

Every event payload includes:

```ts
{
  traceId: string;
  tenantId?: string;
  stagingId?: string;
  candidateId?: string;
  sourceType: string;
  decision?: string;
  qualityScore?: number;
  errorMessage?: string;
}
```

- [ ] **Step 3: Add lightweight log subscriber**

Use `EventEmitterModule` already registered in `app.module.ts`. Subscriber logs structured JSON strings so future Sentry/APM integration can reuse the same event names.

- [ ] **Step 4: Verify**

```bash
pnpm --filter @yzschros/api test --runInBand apps/api/src/modules/import
pnpm --filter @yzschros/api build
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/import
git commit -m "feat: add import staging observability"
```

### Task 5.3: Production Capacity Notes

**Files:**
- Modify: `docs/ops/import-staging-deploy-sop.md`
- Modify: `deploy/docker-compose.prod.yml` only if approved during deployment.

- [ ] **Step 1: Document database capacity constraints**

Add to SOP:

```text
Import list APIs must not select raw_payload/resume_text.
Legacy import batch size is 500.
If import review list queries exceed 500ms, inspect candidate_staging indexes before increasing API pool size.
```

- [ ] **Step 2: Document optional Postgres tuning**

Add optional production tuning for review, not automatic change:

```yaml
command:
  - postgres
  - -c
  - shared_buffers=256MB
  - -c
  - work_mem=8MB
  - -c
  - max_connections=100
```

- [ ] **Step 3: Commit docs**

```bash
git add docs/ops/import-staging-deploy-sop.md
git commit -m "docs: add import staging capacity notes"
```

## Acceptance Criteria

### Data Intake/Staging

- Legacy/extension records can be stored without creating formal candidates.
- Every staging row has `traceId`, source, raw payload, normalized fields, quality score, decision, and audit trail.
- Staging creation does not call LLM, embedding, or BullMQ.
- List APIs do not return `rawPayload`, `normalizedPayload`, or `resumeText`.
- A staging row can be promoted into `candidates` only after dedupe and quality checks.
- Promotion reuses `CandidateService.create()` or an equivalent shared creation method that enqueues vectorization.
- Duplicate detection covers phone, email, text hash, file hash, source/name, and name/company through the shared `CandidateDedupeService`.
- Legacy bulk import writes staging rows directly to Postgres in batches and never writes formal candidates.

### Chrome Extension

- Extension can save API base URL and token in `chrome.storage.local`.
- Extension can capture BOSS/猎聘 visible profile text into staging.
- Extension does not claim formal入库 unless a formal candidate was created.
- Attachment sync requires user click and records source URL.
- Extension API calls include Authorization headers and pass production CORS checks.
- Extension endpoints have documented Nginx rate limits before production rollout.

### Client HR Portal

- Public share link remains available for lightweight external review.
- Authenticated HR portal exists under `/client`.
- HR users only see scoped recommendations.
- `hr_client` users without `tenantId` or `enterpriseId` are rejected by JWT validation.
- `/client/*` and internal routes are role-routed by middleware.
- Candidate contact fields are hidden unless explicitly allowed later.
- HR feedback updates recommendation workflow.

## Explicit Non-Goals

- No bulk scraping from recruitment platforms.
- No automatic browser background crawling.
- No direct mass insert into `candidates`.
- No LLM calls during staging creation.
- No email/Feishu import adapter implementation in this plan; source types are deferred.
- No full SaaS tenant billing system.
- No large-model upgrade as part of this plan.
- No online deployment of local-only review/QA agents.

## Plan Self-Review

- Spec coverage: Covers old database/staging foundation, extension JWT/CORS repair, Chrome extension sync, attachment sync MVP, production SOP, observability, and client HR portal.
- Placeholder scan: passed; no open-ended implementation placeholders remain.
- Type consistency: `traceId`, `importDecision`, `sourceType`, `qualityScore`, `normalizedPhone`, `normalizedEmail`, and `enterpriseId` are defined before use.
- Scope check: The feature is intentionally split into five phases with P0 staging first to avoid database pollution.
