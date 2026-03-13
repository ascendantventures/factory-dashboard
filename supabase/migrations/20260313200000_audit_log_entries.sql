-- ============================================================
-- AUDIT LOG: audit_log_entries
-- Issue #28 — Full audit trail for all factory dashboard actions
-- ⚠️ Uses upsert() on this table (PATTERN 2) — login trigger
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log_entries (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now() NOT NULL,
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email   text NOT NULL,
  action        text NOT NULL,
  category      text NOT NULL CHECK (category IN (
                  'user_management',
                  'pipeline',
                  'issues',
                  'settings',
                  'auth'
                )),
  target_type   text,
  target_id     text,
  details       jsonb,
  ip_address    text
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_log_entries_created_at
  ON audit_log_entries (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_entries_user_id
  ON audit_log_entries (user_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_entries_action
  ON audit_log_entries (action);

CREATE INDEX IF NOT EXISTS idx_audit_log_entries_category
  ON audit_log_entries (category);

CREATE INDEX IF NOT EXISTS idx_audit_log_entries_actor_email
  ON audit_log_entries (actor_email);

-- GIN index for JSONB details search
CREATE INDEX IF NOT EXISTS idx_audit_log_entries_details
  ON audit_log_entries USING gin (details);

-- ============================================================
-- Auth trigger: record login events
-- SECURITY DEFINER — runs as table owner (PATTERN 11)
-- ⚠️ Does NOT replace or modify any existing auth.users trigger.
-- ============================================================

CREATE OR REPLACE FUNCTION record_auth_login_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_log_entries (
    user_id, actor_email, action, category, details
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    'login',
    'auth',
    jsonb_build_object('provider', NEW.app_metadata->>'provider')
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- Only create trigger if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_login_record'
  ) THEN
    CREATE TRIGGER on_auth_login_record
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION record_auth_login_event();
  END IF;
END;
$$;

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE audit_log_entries ENABLE ROW LEVEL SECURITY;

-- Admins can read all audit log entries
CREATE POLICY "audit_log_entries_admin_read"
  ON audit_log_entries
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

-- Service role can insert (used by server-side audit service)
CREATE POLICY "audit_log_entries_service_insert"
  ON audit_log_entries
  FOR INSERT
  TO service_role
  WITH CHECK (true);
