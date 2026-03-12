-- ============================================================
-- fdash_vercel_cache: TTL cache for Vercel API responses
-- Issue #38: Vercel Deployment Status & Management
-- ============================================================
CREATE TABLE IF NOT EXISTS fdash_vercel_cache (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key   text NOT NULL UNIQUE,
  data        jsonb NOT NULL DEFAULT '{}'::jsonb,
  cached_at   timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '2 minutes')
);

-- Index for fast key lookups and TTL sweeps
CREATE INDEX IF NOT EXISTS idx_fdash_vercel_cache_key
  ON fdash_vercel_cache (cache_key);

CREATE INDEX IF NOT EXISTS idx_fdash_vercel_cache_expires
  ON fdash_vercel_cache (expires_at);

-- Auto-cleanup trigger: remove expired rows on insert/update (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION fdash_purge_expired_vercel_cache()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM fdash_vercel_cache WHERE expires_at < now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fdash_purge_expired_cache ON fdash_vercel_cache;
CREATE TRIGGER trg_fdash_purge_expired_cache
  AFTER INSERT OR UPDATE ON fdash_vercel_cache
  FOR EACH STATEMENT
  EXECUTE FUNCTION fdash_purge_expired_vercel_cache();

-- RLS
ALTER TABLE fdash_vercel_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fdash_vercel_cache_read" ON fdash_vercel_cache;
CREATE POLICY "fdash_vercel_cache_read"
  ON fdash_vercel_cache FOR SELECT
  TO authenticated
  USING (true);

-- service_role bypasses RLS by default, so no explicit write policy needed
