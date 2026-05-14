CREATE TABLE IF NOT EXISTS import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id varchar NULL,
  source_type varchar NOT NULL,
  source_name varchar NULL,
  operator_id varchar NULL,
  trace_id varchar NULL,
  status varchar NOT NULL DEFAULT 'pending',
  total_count integer NOT NULL DEFAULT 0,
  accepted_count integer NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  rejected_count integer NOT NULL DEFAULT 0,
  duplicate_count integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS candidate_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id varchar NULL,
  batch_id varchar NULL,
  trace_id varchar NULL,
  source_type varchar NOT NULL,
  source_platform varchar NULL,
  source_url text NULL,
  source_record_id varchar NULL,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  name varchar NULL,
  phone varchar NULL,
  email varchar NULL,
  normalized_phone varchar NULL,
  normalized_email varchar NULL,
  current_company varchar NULL,
  current_title varchar NULL,
  resume_text text NULL,
  resume_text_truncated boolean NOT NULL DEFAULT false,
  file_hash varchar NULL,
  staging_file_key varchar NULL,
  text_hash varchar NULL,
  quality_score integer NOT NULL DEFAULT 0,
  quality_reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  status varchar NOT NULL DEFAULT 'raw',
  import_decision varchar NOT NULL DEFAULT 'review',
  reject_reason varchar NULL,
  review_reason varchar NULL,
  matched_candidate_id varchar NULL,
  created_candidate_id varchar NULL,
  normalized_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS candidate_merge_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id varchar NULL,
  staging_candidate_id varchar NOT NULL,
  candidate_id varchar NOT NULL,
  match_type varchar NOT NULL,
  confidence decimal(4, 2) NOT NULL DEFAULT 0,
  operator_id varchar NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_import_batches_tenant_created_at ON import_batches (tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_import_batches_tenant_status ON import_batches (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_import_batches_tenant_id ON import_batches (tenant_id);
CREATE INDEX IF NOT EXISTS idx_import_batches_trace_id ON import_batches (trace_id);

-- Staging indexes are intentionally non-unique.
-- Repeated captures/import attempts must remain visible for review and source auditing.
CREATE INDEX IF NOT EXISTS idx_candidate_staging_tenant_created_at ON candidate_staging (tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_candidate_staging_tenant_status ON candidate_staging (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_candidate_staging_tenant_decision ON candidate_staging (tenant_id, import_decision);
CREATE INDEX IF NOT EXISTS idx_candidate_staging_review_created_at
  ON candidate_staging (tenant_id, created_at DESC)
  WHERE import_decision = 'review';
CREATE INDEX IF NOT EXISTS idx_candidate_staging_phone ON candidate_staging (tenant_id, normalized_phone);
CREATE INDEX IF NOT EXISTS idx_candidate_staging_email ON candidate_staging (tenant_id, normalized_email);
CREATE INDEX IF NOT EXISTS idx_candidate_staging_text_hash ON candidate_staging (tenant_id, text_hash);
CREATE INDEX IF NOT EXISTS idx_candidate_staging_trace_id ON candidate_staging (trace_id);
CREATE INDEX IF NOT EXISTS idx_candidate_staging_tenant_id ON candidate_staging (tenant_id);
CREATE INDEX IF NOT EXISTS idx_candidate_staging_batch_id ON candidate_staging (batch_id);

CREATE INDEX IF NOT EXISTS idx_candidate_merge_links_staging ON candidate_merge_links (tenant_id, staging_candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_merge_links_candidate ON candidate_merge_links (tenant_id, candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_merge_links_tenant_id ON candidate_merge_links (tenant_id);
