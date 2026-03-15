-- ============================================================
-- PHASE 2 AUDIT LOG — Issue #34
-- ⚠️ audit_log_entries already exists from Issue #28 migration
-- ⚠️ fd_user_roles already exists — DO NOT recreate
-- ⚠️ All new tables use fd_ prefix to avoid collision
-- ============================================================

-- ============================================================
-- 1. Retention config table
-- ⚠️ Has no auth trigger — standard insert() is safe
-- ============================================================

CREATE TABLE IF NOT EXISTS fd_audit_retention_config (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  retention_days  int NOT NULL DEFAULT 90 CHECK (retention_days >= 7),
  updated_at      timestamptz DEFAULT now() NOT NULL,
  updated_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Seed default row if table is empty
INSERT INTO fd_audit_retention_config (retention_days)
SELECT 90
WHERE NOT EXISTS (SELECT 1 FROM fd_audit_retention_config);

-- Index
CREATE INDEX IF NOT EXISTS idx_fd_audit_retention_config_updated_at
  ON fd_audit_retention_config (updated_at DESC);

-- RLS
ALTER TABLE fd_audit_retention_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fd_audit_retention_config_admin_read"
  ON fd_audit_retention_config
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fd_user_roles
      WHERE fd_user_roles.user_id = auth.uid()
        AND fd_user_roles.role = 'admin'
        AND fd_user_roles.is_active = true
    )
  );

CREATE POLICY "fd_audit_retention_config_service_write"
  ON fd_audit_retention_config
  FOR ALL
  TO service_role
  WITH CHECK (true);

-- ============================================================
-- 2. Purge function — SECURITY DEFINER (PATTERN 11)
--    Called by Vercel Cron route /api/admin/audit/purge
-- ============================================================

CREATE OR REPLACE FUNCTION purge_old_audit_entries()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_retention_days int;
  v_deleted_count  int;
BEGIN
  SELECT retention_days INTO v_retention_days
  FROM fd_audit_retention_config
  LIMIT 1;

  IF v_retention_days IS NULL THEN
    v_retention_days := 90;
  END IF;

  DELETE FROM audit_log_entries
  WHERE created_at < now() - (v_retention_days || ' days')::interval;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

-- ============================================================
-- 3. Alert rules table (Phase 2 — deferred, schema only)
-- ⚠️ No auth trigger — standard insert() is safe
-- ============================================================

CREATE TABLE IF NOT EXISTS fd_audit_alert_rules (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_action    text NOT NULL,         -- e.g. 'failed_login'
  threshold_count int NOT NULL DEFAULT 5,
  window_minutes  int NOT NULL DEFAULT 10,
  notify_emails   text[] NOT NULL DEFAULT '{}',
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fd_audit_alert_rules_action
  ON fd_audit_alert_rules (alert_action);

ALTER TABLE fd_audit_alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fd_audit_alert_rules_admin_read"
  ON fd_audit_alert_rules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fd_user_roles
      WHERE fd_user_roles.user_id = auth.uid()
        AND fd_user_roles.role = 'admin'
        AND fd_user_roles.is_active = true
    )
  );

CREATE POLICY "fd_audit_alert_rules_service_write"
  ON fd_audit_alert_rules
  FOR ALL
  TO service_role
  WITH CHECK (true);

-- Seed default failed_login rule (inactive until Phase 2 wired up)
INSERT INTO fd_audit_alert_rules (alert_action, threshold_count, window_minutes, notify_emails, is_active)
SELECT 'failed_login', 5, 10, '{}', false
WHERE NOT EXISTS (
  SELECT 1 FROM fd_audit_alert_rules WHERE alert_action = 'failed_login'
);
