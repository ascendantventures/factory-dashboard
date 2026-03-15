-- ============================================================
-- dash_station_history
-- Records every station transition for every issue.
-- Written by the factory harness on each label change.
-- Safe to re-run (IF NOT EXISTS + upsert trigger).
-- ⚠️ BUILD: use upsert() not insert() on this table (PATTERN 2).
-- ============================================================

CREATE TABLE IF NOT EXISTS dash_station_history (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_number     integer NOT NULL,
  station          text NOT NULL,           -- the station being entered
  from_station     text,                    -- null for first recorded transition
  transitioned_at  timestamptz NOT NULL DEFAULT now(),
  actor            text NOT NULL DEFAULT 'harness',  -- 'harness' | 'human' | 'agent'
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup by issue
CREATE INDEX IF NOT EXISTS dash_station_history_issue_idx
  ON dash_station_history (issue_number, transitioned_at DESC);

-- Index for station-level analytics
CREATE INDEX IF NOT EXISTS dash_station_history_station_idx
  ON dash_station_history (station, transitioned_at DESC);

-- updated_at trigger (SECURITY DEFINER per PATTERN 11)
CREATE OR REPLACE FUNCTION dash_set_station_history_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.created_at = COALESCE(NEW.created_at, now());
  RETURN NEW;
END;
$$;

-- RLS
ALTER TABLE dash_station_history ENABLE ROW LEVEL SECURITY;

-- SELECT: authenticated users only
DROP POLICY IF EXISTS "dash_station_history select authenticated" ON dash_station_history;
CREATE POLICY "dash_station_history select authenticated"
  ON dash_station_history FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: service_role only (harness writes via service key)
DROP POLICY IF EXISTS "dash_station_history insert service_role" ON dash_station_history;
CREATE POLICY "dash_station_history insert service_role"
  ON dash_station_history FOR INSERT
  TO service_role
  WITH CHECK (true);

-- UPDATE: service_role only
DROP POLICY IF EXISTS "dash_station_history update service_role" ON dash_station_history;
CREATE POLICY "dash_station_history update service_role"
  ON dash_station_history FOR UPDATE
  TO service_role
  USING (true);

-- DELETE: service_role only
DROP POLICY IF EXISTS "dash_station_history delete service_role" ON dash_station_history;
CREATE POLICY "dash_station_history delete service_role"
  ON dash_station_history FOR DELETE
  TO service_role
  USING (true);

-- ============================================================
-- dash_analytics_cache
-- Caches Vercel Analytics API responses per repo (TTL: 1h).
-- ⚠️ BUILD: use upsert() not insert() on this table (PATTERN 2).
-- ============================================================

CREATE TABLE IF NOT EXISTS dash_analytics_cache (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_full_name  text NOT NULL,
  metrics         jsonb,                    -- raw Vercel Analytics response
  fetched_at      timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dash_analytics_cache_repo_unique UNIQUE (repo_full_name)
);

CREATE INDEX IF NOT EXISTS dash_analytics_cache_repo_idx
  ON dash_analytics_cache (repo_full_name);

-- updated_at trigger (SECURITY DEFINER per PATTERN 11)
CREATE OR REPLACE FUNCTION dash_set_analytics_updated_at()
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

CREATE OR REPLACE TRIGGER dash_analytics_cache_updated_at
  BEFORE UPDATE ON dash_analytics_cache
  FOR EACH ROW EXECUTE FUNCTION dash_set_analytics_updated_at();

ALTER TABLE dash_analytics_cache ENABLE ROW LEVEL SECURITY;

-- SELECT: authenticated users
DROP POLICY IF EXISTS "dash_analytics_cache select authenticated" ON dash_analytics_cache;
CREATE POLICY "dash_analytics_cache select authenticated"
  ON dash_analytics_cache FOR SELECT
  TO authenticated
  USING (true);

-- INSERT/UPDATE: service_role only
DROP POLICY IF EXISTS "dash_analytics_cache insert service_role" ON dash_analytics_cache;
CREATE POLICY "dash_analytics_cache insert service_role"
  ON dash_analytics_cache FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "dash_analytics_cache update service_role" ON dash_analytics_cache;
CREATE POLICY "dash_analytics_cache update service_role"
  ON dash_analytics_cache FOR UPDATE
  TO service_role
  USING (true);

-- ============================================================
-- Extend dash_deployment_cache with webhook metadata
-- (table created in Phase 1 migration — extend only)
-- ============================================================

ALTER TABLE dash_deployment_cache
  ADD COLUMN IF NOT EXISTS last_webhook_at  timestamptz,
  ADD COLUMN IF NOT EXISTS webhook_event    text;        -- last event type received
