-- ============================================================
-- fd_user_roles
-- ⚠️ BUILD: use upsert() not insert() — auth trigger may
--    auto-create rows on user signup (PATTERN 2)
-- ============================================================
CREATE TABLE IF NOT EXISTS fd_user_roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'viewer'
                CHECK (role IN ('admin', 'operator', 'viewer')),
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid REFERENCES auth.users(id),
  CONSTRAINT fd_user_roles_user_id_key UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS fd_user_roles_user_id_idx ON fd_user_roles(user_id);
CREATE INDEX IF NOT EXISTS fd_user_roles_role_idx ON fd_user_roles(role);
CREATE INDEX IF NOT EXISTS fd_user_roles_is_active_idx ON fd_user_roles(is_active);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION fd_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fd_user_roles_updated_at ON fd_user_roles;
CREATE TRIGGER fd_user_roles_updated_at
  BEFORE UPDATE ON fd_user_roles
  FOR EACH ROW EXECUTE FUNCTION fd_set_updated_at();

-- ⚠️ AUTH TRIGGER NOTE: BUILD must use upsert() on fd_user_roles.
-- If a handle_new_user trigger exists that inserts into fd_user_roles,
-- a plain insert() will collide on the unique constraint.
-- DO NOT replace or modify any existing handle_new_user trigger.

-- ============================================================
-- fd_audit_log
-- ============================================================
CREATE TABLE IF NOT EXISTS fd_audit_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action          text NOT NULL,
  details         jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fd_audit_log_actor_id_idx ON fd_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS fd_audit_log_target_user_id_idx ON fd_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS fd_audit_log_action_idx ON fd_audit_log(action);
CREATE INDEX IF NOT EXISTS fd_audit_log_created_at_idx ON fd_audit_log(created_at DESC);

-- ============================================================
-- RLS Policies — fd_user_roles
-- ============================================================
ALTER TABLE fd_user_roles ENABLE ROW LEVEL SECURITY;

-- Admin can read all rows
CREATE POLICY "fd_user_roles_admin_select"
  ON fd_user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fd_user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
        AND ur.is_active = true
    )
  );

-- Users can read their own row
CREATE POLICY "fd_user_roles_self_select"
  ON fd_user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Only admins can insert
CREATE POLICY "fd_user_roles_admin_insert"
  ON fd_user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fd_user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
        AND ur.is_active = true
    )
  );

-- Only admins can update
CREATE POLICY "fd_user_roles_admin_update"
  ON fd_user_roles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fd_user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
        AND ur.is_active = true
    )
  );

-- No deletes — soft delete via is_active
-- (no DELETE policy = no deletes permitted)

-- ============================================================
-- RLS Policies — fd_audit_log
-- ============================================================
ALTER TABLE fd_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit log
CREATE POLICY "fd_audit_log_admin_select"
  ON fd_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fd_user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
        AND ur.is_active = true
    )
  );

-- Service role inserts audit entries (via API route with service key)
-- No client-side insert policy — all audit writes go through server routes
