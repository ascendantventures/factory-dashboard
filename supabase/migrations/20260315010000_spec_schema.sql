-- ============================================================
-- Phase 2 (#16): dash_station_history, dash_analytics_cache
-- + extend dash_deployment_cache with webhook metadata
-- ============================================================

-- ============================================================
-- dash_station_history
-- Records every station transition for every issue.
-- Written by the factory harness on each label change.
-- ============================================================

CREATE TABLE IF NOT EXISTS dash_station_history (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_number     integer NOT NULL,
  station          text NOT NULL,
  from_station     text,
  transitioned_at  timestamptz NOT NULL DEFAULT now(),
  actor            text NOT NULL DEFAULT 'harness',
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dash_station_history_issue_idx
  ON dash_station_history (issue_number, transitioned_at DESC);

CREATE INDEX IF NOT EXISTS dash_station_history_station_idx
  ON dash_station_history (station, transitioned_at DESC);

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

ALTER TABLE dash_station_history ENABLE ROW LEVEL SECURITY;

-- RLS policies (use DO blocks for IF NOT EXISTS idempotency)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'dash_station_history'
      AND policyname = 'dash_station_history_select_authenticated'
  ) THEN
    CREATE POLICY "dash_station_history_select_authenticated"
      ON dash_station_history FOR SELECT
      TO authenticated USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'dash_station_history'
      AND policyname = 'dash_station_history_insert_service'
  ) THEN
    CREATE POLICY "dash_station_history_insert_service"
      ON dash_station_history FOR INSERT
      TO service_role WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'dash_station_history'
      AND policyname = 'dash_station_history_update_service'
  ) THEN
    CREATE POLICY "dash_station_history_update_service"
      ON dash_station_history FOR UPDATE
      TO service_role USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'dash_station_history'
      AND policyname = 'dash_station_history_delete_service'
  ) THEN
    CREATE POLICY "dash_station_history_delete_service"
      ON dash_station_history FOR DELETE
      TO service_role USING (true);
  END IF;
END $$;

-- ============================================================
-- dash_analytics_cache
-- Caches Vercel Analytics API responses per repo (TTL: 1h).
-- ============================================================

CREATE TABLE IF NOT EXISTS dash_analytics_cache (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_full_name  text NOT NULL,
  metrics         jsonb,
  fetched_at      timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dash_analytics_cache_repo_unique UNIQUE (repo_full_name)
);

CREATE INDEX IF NOT EXISTS dash_analytics_cache_repo_idx
  ON dash_analytics_cache (repo_full_name);

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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'dash_analytics_cache'
      AND policyname = 'dash_analytics_cache_select_authenticated'
  ) THEN
    CREATE POLICY "dash_analytics_cache_select_authenticated"
      ON dash_analytics_cache FOR SELECT
      TO authenticated USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'dash_analytics_cache'
      AND policyname = 'dash_analytics_cache_insert_service'
  ) THEN
    CREATE POLICY "dash_analytics_cache_insert_service"
      ON dash_analytics_cache FOR INSERT
      TO service_role WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'dash_analytics_cache'
      AND policyname = 'dash_analytics_cache_update_service'
  ) THEN
    CREATE POLICY "dash_analytics_cache_update_service"
      ON dash_analytics_cache FOR UPDATE
      TO service_role USING (true);
  END IF;
END $$;

-- ============================================================
-- Extend dash_deployment_cache with webhook metadata
-- ============================================================

ALTER TABLE dash_deployment_cache
  ADD COLUMN IF NOT EXISTS last_webhook_at  timestamptz,
  ADD COLUMN IF NOT EXISTS webhook_event    text;
