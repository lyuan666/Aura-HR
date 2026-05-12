-- Notification configuration table
-- Run manually:
--   docker exec -i yzschros-postgres psql -U yzschros -d yzschros < apps/api/src/migrations/003-notification-configs.sql

CREATE TABLE IF NOT EXISTS notification_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(255),
  type VARCHAR(50) NOT NULL,
  config JSONB NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_configs_tenant_id
  ON notification_configs(tenant_id);

CREATE INDEX IF NOT EXISTS idx_notification_configs_type
  ON notification_configs(type);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_configs_tenant_type
  ON notification_configs(COALESCE(tenant_id, ''), type);
