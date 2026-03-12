-- ============================================================
-- dash_deployment_cache
-- Caches the latest Vercel deployment per build repo.
-- Safe to re-run (CREATE TABLE IF NOT EXISTS + upsert trigger).
-- ============================================================

CREATE TABLE IF NOT EXISTS dash_deployment_cache (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_full_name        text NOT NULL,          -- e.g. "org/repo-name"
  vercel_deployment_id  text,
  deploy_url            text,
  deploy_state          text,                   -- READY | ERROR | BUILDING | CANCELED
  deployed_at           timestamptz,
  raw_payload           jsonb,                  -- full Vercel API response for debugging
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dash_deployment_cache_repo_unique UNIQUE (repo_full_name)
);

-- Index for fast lookup by repo
CREATE INDEX IF NOT EXISTS dash_deployment_cache_repo_idx
  ON dash_deployment_cache (repo_full_name);

-- Auto-update updated_at on upsert
-- SECURITY DEFINER — prevents RLS infinite recursion
CREATE OR REPLACE FUNCTION dash_set_deployment_cache_updated_at()
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

DROP TRIGGER IF EXISTS dash_deployment_cache_updated_at_trigger ON dash_deployment_cache;
CREATE TRIGGER dash_deployment_cache_updated_at_trigger
  BEFORE UPDATE ON dash_deployment_cache
  FOR EACH ROW
  EXECUTE FUNCTION dash_set_deployment_cache_updated_at();

-- RLS: only authenticated users can read; only service role can write
ALTER TABLE dash_deployment_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dash_deployment_cache_read" ON dash_deployment_cache;
CREATE POLICY "dash_deployment_cache_read"
  ON dash_deployment_cache FOR SELECT
  TO authenticated
  USING (true);
