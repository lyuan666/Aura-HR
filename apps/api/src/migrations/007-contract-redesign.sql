-- Contract Redesign Migration
-- Run manually:
--   docker exec -i yzschros-postgres psql -U yzschros -d yzschros < apps/api/src/migrations/007-contract-redesign.sql

-- Drop tables if they exist (to clean up the partial run from the first attempt with UUID type)
DROP TABLE IF EXISTS contract_generations CASCADE;
DROP TABLE IF EXISTS contract_templates CASCADE;

-- ============================================================
-- 1. Create contract_templates table
-- ============================================================
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255), -- NULL = System preset templates, NOT NULL = Enterprise custom templates
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- e.g. labor, service, nda, recommendation
  description TEXT,
  template_content TEXT NOT NULL,
  file_url VARCHAR(500),
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, active, archived
  version VARCHAR(50) NOT NULL DEFAULT '1.0',
  parent_id UUID,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT fk_contract_templates_parent
    FOREIGN KEY (parent_id)
    REFERENCES contract_templates(id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_contract_templates_tenant_id ON contract_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contract_templates_category ON contract_templates(category);
CREATE INDEX IF NOT EXISTS idx_contract_templates_status ON contract_templates(status);

-- ============================================================
-- 2. Create contract_generations table
-- ============================================================
CREATE TABLE IF NOT EXISTS contract_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL, -- Force multi-tenant isolation, matching character varying
  template_id UUID NOT NULL,
  template_snapshot JSONB NOT NULL, -- Lock template content/variables at generation time
  enterprise_id VARCHAR(255), -- Match character varying from enterprise
  contract_id UUID, -- Nullable, filled when formalized
  generation_no VARCHAR(100) NOT NULL UNIQUE, -- e.g. GEN-20260520-001
  variable_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  content TEXT NOT NULL, -- Generated HTML
  edited_content TEXT, -- Optional rich-text edited HTML
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, preview, formalized, cancelled
  risk_assessment JSONB, -- AI assessment result: { score, issues: [], suggestions: [], assessedAt }
  formalized_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT fk_contract_generations_template
    FOREIGN KEY (template_id)
    REFERENCES contract_templates(id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_contract_generations_tenant_id ON contract_generations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contract_generations_template_id ON contract_generations(template_id);
CREATE INDEX IF NOT EXISTS idx_contract_generations_enterprise_id ON contract_generations(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_contract_generations_contract_id ON contract_generations(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_generations_status ON contract_generations(status);

-- ============================================================
-- 3. Extend contracts table
-- ============================================================
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS generation_id UUID;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS renewed_from UUID;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS next_review_at TIMESTAMP;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS alert_days INTEGER DEFAULT 30;

-- Create indexes and foreign keys if not exist
CREATE INDEX IF NOT EXISTS idx_contracts_generation_id ON contracts(generation_id);

-- Backwards compatibility: add foreign keys safely (using DO block to avoid duplicate constraints)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_contracts_generation'
  ) THEN
    ALTER TABLE contracts
      ADD CONSTRAINT fk_contracts_generation
      FOREIGN KEY (generation_id)
      REFERENCES contract_generations(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_contracts_renewed_from'
  ) THEN
    ALTER TABLE contracts
      ADD CONSTRAINT fk_contracts_renewed_from
      FOREIGN KEY (renewed_from)
      REFERENCES contracts(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 4. Legacy Data Compatibility & Backfill
-- ============================================================
-- Assign a default tenant to legacy contracts without tenant_id (using string comparison)
UPDATE contracts 
SET tenant_id = COALESCE(
  (SELECT tenant_id FROM users WHERE tenant_id IS NOT NULL LIMIT 1),
  '00000000-0000-0000-0000-000000000000'
)
WHERE tenant_id IS NULL;
