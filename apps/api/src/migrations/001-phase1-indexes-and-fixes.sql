-- Phase 1 Migration: Indexes, Extensions, Functions, Data Cleanup
-- Run manually: psql -U yzschros -d yzschros -f 001-phase1-indexes-and-fixes.sql

-- ============================================================
-- 1. Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 2. pgvector HNSW index (critical for 10w scale)
-- ============================================================
-- Only create if not exists (safe to re-run)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_candidates_embedding_hnsw'
  ) THEN
    EXECUTE 'CREATE INDEX idx_candidates_embedding_hnsw
      ON candidates USING hnsw(embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64)';
  END IF;
END $$;

-- ============================================================
-- 3. HNSW index on job_positions.embedding
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_job_positions_embedding_hnsw'
  ) THEN
    EXECUTE 'CREATE INDEX idx_job_positions_embedding_hnsw
      ON job_positions USING hnsw(embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64)';
  END IF;
END $$;

-- ============================================================
-- 4. GIN index on parsedTags (jsonb)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_candidates_parsed_tags
  ON candidates USING gin("parsedTags");

-- ============================================================
-- 4. Name index for fuzzy match pre-filter
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_candidates_name
  ON candidates(name) WHERE name IS NOT NULL;

-- ============================================================
-- 5. cn_name_similarity function (Layer 3 dedup)
-- ============================================================
CREATE OR REPLACE FUNCTION cn_name_similarity(a text, b text)
RETURNS float AS $$
DECLARE
  ca text;
  cb text;
BEGIN
  IF a IS NULL OR b IS NULL THEN RETURN 0; END IF;

  -- Remove common company suffixes
  ca := regexp_replace(a, '(有限责任|有限|股份|集团|公司|科技|网络技术|信息技术|技术服务中心)$', '');
  cb := regexp_replace(b, '(有限责任|有限|股份|集团|公司|科技|网络技术|信息技术|技术服务中心)$', '');

  -- Remove city prefixes
  ca := regexp_replace(ca, '^(北京|上海|广州|深圳|杭州|浙江|江苏|四川|广东|中国)', '');
  cb := regexp_replace(cb, '^(北京|上海|广州|深圳|杭州|浙江|江苏|四川|广东|中国)', '');

  IF ca = '' OR cb = '' THEN RETURN 0; END IF;

  -- One contains the other → high similarity
  IF position(cb in ca) > 0 OR position(ca in cb) > 0 THEN
    RETURN 0.85;
  END IF;

  -- Otherwise use normalized edit distance
  RETURN 1.0 - (levenshtein(ca, cb)::float / GREATEST(length(ca), length(cb)));
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- 6. email_channels table (reserved for Phase 2)
-- ============================================================
CREATE TABLE IF NOT EXISTS email_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  imap_host VARCHAR(100) NOT NULL,
  imap_port INTEGER DEFAULT 993,
  email VARCHAR(255) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  poll_interval_ms INTEGER DEFAULT 60000,
  last_message_uid INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 7. Clean up corrupted random vector data
-- ============================================================
-- Detect: random vectors have near-zero mean, high variance
-- Simple approach: set all embeddings to NULL, re-queue later
-- Only run if there are existing candidates with embeddings
DO $$
DECLARE
  affected_count integer;
BEGIN
  SELECT COUNT(*) INTO affected_count
  FROM candidates
  WHERE embedding IS NOT NULL;

  IF affected_count > 0 THEN
    RAISE NOTICE 'Found % candidates with existing embeddings — setting to NULL for re-processing', affected_count;
    UPDATE candidates SET embedding = NULL WHERE embedding IS NOT NULL;
    RAISE NOTICE 'Done. Re-process via vectorize queue after Phase 2 deploy.';
  ELSE
    RAISE NOTICE 'No candidates with embeddings — nothing to clean.';
  END IF;
END $$;
