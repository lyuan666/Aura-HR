-- Email aggregation tables
-- Run manually:
--   docker exec -i yzschros-postgres psql -U yzschros -d yzschros < apps/api/src/migrations/002-email-tables.sql

CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID,
  email VARCHAR(255) NOT NULL,
  imap_host VARCHAR(255) NOT NULL,
  imap_port INTEGER NOT NULL DEFAULT 993,
  imap_tls BOOLEAN NOT NULL DEFAULT true,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(512) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMP,
  sync_error VARCHAR(1000),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_accounts_tenant_id
  ON email_accounts(tenant_id);

CREATE TABLE IF NOT EXISTS email_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_account_id UUID NOT NULL,
  tenant_id UUID,
  message_id VARCHAR(512) NOT NULL,
  "from" VARCHAR(255),
  "to" VARCHAR(255),
  subject VARCHAR(255),
  body_text TEXT,
  body_html TEXT,
  sent_at TIMESTAMP,
  candidate_id UUID,
  processed BOOLEAN NOT NULL DEFAULT false,
  has_attachments BOOLEAN NOT NULL DEFAULT false,
  attachment_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT fk_email_messages_account
    FOREIGN KEY (email_account_id)
    REFERENCES email_accounts(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_email_messages_candidate
    FOREIGN KEY (candidate_id)
    REFERENCES candidates(id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_email_messages_email_account_id
  ON email_messages(email_account_id);

CREATE INDEX IF NOT EXISTS idx_email_messages_tenant_id
  ON email_messages(tenant_id);

CREATE INDEX IF NOT EXISTS idx_email_messages_message_id
  ON email_messages(message_id);

CREATE INDEX IF NOT EXISTS idx_email_messages_candidate_id
  ON email_messages(candidate_id);
