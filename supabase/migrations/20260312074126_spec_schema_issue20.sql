-- ============================================================
-- Issue #20: Template & Environment Management
-- Project prefix: dash_
-- ============================================================

-- ⚠️ No auth trigger on dash_templates — BUILD may use insert()
-- TABLE: dash_templates
-- Registry of build pipeline templates
-- ============================================================
CREATE TABLE IF NOT EXISTS dash_templates (
  template_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_slug  text NOT NULL UNIQUE,       -- e.g. "nextjs-supabase"
  template_name  text NOT NULL,              -- e.g. "Next.js + Supabase"
  description    text,
  source_repo    text NOT NULL,              -- e.g. "ascendantventures/template-nextjs-supabase"
  deploy_target  text NOT NULL DEFAULT 'vercel',  -- "vercel" | "railway" | "self-hosted"
  project_type   text NOT NULL DEFAULT 'web',     -- "web" | "api" | "mobile"
  is_default     boolean NOT NULL DEFAULT false,
  metadata       jsonb NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  created_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_dash_templates_slug
  ON dash_templates (template_slug);

CREATE INDEX IF NOT EXISTS idx_dash_templates_project_type
  ON dash_templates (project_type);

-- Enforce only one default per project_type
CREATE UNIQUE INDEX IF NOT EXISTS idx_dash_templates_one_default
  ON dash_templates (project_type)
  WHERE is_default = true;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION dash_templates_set_updated_at()
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

CREATE TRIGGER dash_templates_updated_at
  BEFORE UPDATE ON dash_templates
  FOR EACH ROW EXECUTE FUNCTION dash_templates_set_updated_at();

-- RLS
ALTER TABLE dash_templates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "authenticated read dash_templates"
  ON dash_templates FOR SELECT
  TO authenticated
  USING (true);

-- Only admin can insert/update/delete
CREATE POLICY "admin write dash_templates"
  ON dash_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dash_user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dash_user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );


-- ⚠️ No auth trigger on dash_key_rotation_log — BUILD may use insert()
-- TABLE: dash_key_rotation_log
-- Audit trail of API key rotation events
-- ============================================================
CREATE TABLE IF NOT EXISTS dash_key_rotation_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name     text NOT NULL,               -- e.g. "GITHUB_TOKEN"
  rotated_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rotated_at   timestamptz NOT NULL DEFAULT now(),
  notes        text,
  metadata     jsonb NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_dash_key_rotation_key_name
  ON dash_key_rotation_log (key_name, rotated_at DESC);

-- RLS: admin-only
ALTER TABLE dash_key_rotation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin read dash_key_rotation_log"
  ON dash_key_rotation_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dash_user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "admin insert dash_key_rotation_log"
  ON dash_key_rotation_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dash_user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );