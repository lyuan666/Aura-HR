ALTER TABLE users
  ADD COLUMN IF NOT EXISTS enterprise_id varchar NULL;

CREATE INDEX IF NOT EXISTS idx_users_enterprise_id ON users (enterprise_id);
