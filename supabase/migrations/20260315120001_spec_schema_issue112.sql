-- ============================================================
-- TABLE: users_page_role_audit
-- ============================================================
CREATE TABLE IF NOT EXISTS users_page_role_audit (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  changed_at    timestamptz NOT NULL DEFAULT now(),
  target_user_id uuid NOT NULL,
  changed_by_id  uuid NOT NULL,
  old_role      text NOT NULL,
  new_role      text NOT NULL,
  notes         text
);

CREATE INDEX IF NOT EXISTS users_page_role_audit_target_idx
  ON users_page_role_audit (target_user_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS users_page_role_audit_changed_by_idx
  ON users_page_role_audit (changed_by_id, changed_at DESC);

ALTER TABLE users_page_role_audit ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='users_page_role_audit' AND policyname='admins_read_role_audit'
  ) THEN
    CREATE POLICY "admins_read_role_audit"
      ON users_page_role_audit FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM fd_user_roles
          WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
        )
      );
  END IF;
END; $$;

-- ============================================================
-- TABLE: users_page_purge_log
-- ============================================================
CREATE TABLE IF NOT EXISTS users_page_purge_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purged_at       timestamptz NOT NULL DEFAULT now(),
  triggered_by    text NOT NULL,
  accounts_deleted int NOT NULL DEFAULT 0,
  accounts_skipped int NOT NULL DEFAULT 0,
  deleted_emails  text[] NOT NULL DEFAULT '{}',
  error_message   text
);

ALTER TABLE users_page_purge_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='users_page_purge_log' AND policyname='admins_read_purge_log'
  ) THEN
    CREATE POLICY "admins_read_purge_log"
      ON users_page_purge_log FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM fd_user_roles
          WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
        )
      );
  END IF;
END; $$;

-- ============================================================
-- TRIGGER: capture role changes on fd_user_roles table
-- ============================================================
CREATE OR REPLACE FUNCTION users_page_fn_role_change_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO users_page_role_audit (
      target_user_id,
      changed_by_id,
      old_role,
      new_role
    ) VALUES (
      NEW.user_id,
      COALESCE(NEW.updated_by, auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      OLD.role,
      NEW.role
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_page_trg_role_change_audit ON fd_user_roles;

CREATE TRIGGER users_page_trg_role_change_audit
  AFTER UPDATE OF role ON fd_user_roles
  FOR EACH ROW
  EXECUTE FUNCTION users_page_fn_role_change_audit();
