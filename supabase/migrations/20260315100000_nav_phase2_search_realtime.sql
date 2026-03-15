-- ============================================================
-- Factory Dashboard — Phase 2 Nav Search & Notifications
-- Migration: 20260315100000_nav_phase2_search_realtime.sql
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 0. Ensure dash_build_repos exists (guard in case prior
--    migration was recorded in schema_migrations but not
--    actually executed against the DB)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dash_build_repos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_number    integer NOT NULL,
  issue_title     text NOT NULL,
  github_repo     text NOT NULL,
  live_url        text,
  display_name    text NOT NULL,
  refreshed_at    timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(github_repo)
);

CREATE INDEX IF NOT EXISTS idx_dash_build_repos_github_repo
  ON dash_build_repos (github_repo);

CREATE INDEX IF NOT EXISTS idx_dash_build_repos_refreshed_at
  ON dash_build_repos (refreshed_at DESC);

ALTER TABLE dash_build_repos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'dash_build_repos'
      AND policyname = 'authenticated users can read dash_build_repos'
  ) THEN
    CREATE POLICY "authenticated users can read dash_build_repos"
      ON dash_build_repos FOR SELECT
      TO authenticated USING (true);
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 1. Full-text search: dash_issues
--    Generated ALWAYS column ensures index stays current
-- ────────────────────────────────────────────────────────────
ALTER TABLE dash_issues
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english',
        COALESCE(title,   '') || ' ' ||
        COALESCE(body,    '') || ' ' ||
        COALESCE(station, '') || ' ' ||
        COALESCE(repo,    '')
      )
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_dash_issues_search_vector
  ON dash_issues USING gin(search_vector);

-- ────────────────────────────────────────────────────────────
-- 2. Full-text search: dash_build_repos (Apps list)
-- ────────────────────────────────────────────────────────────
ALTER TABLE dash_build_repos
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english',
        COALESCE(display_name, '') || ' ' ||
        COALESCE(github_repo,  '') || ' ' ||
        COALESCE(live_url,     '')
      )
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_dash_build_repos_search_vector
  ON dash_build_repos USING gin(search_vector);

-- ────────────────────────────────────────────────────────────
-- 3. Enable Realtime on dash_webhook_events
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- Only add if not already in publication (idempotent)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'dash_webhook_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE dash_webhook_events;
  END IF;
END $$;

-- ============================================================
-- RLS: Existing policies on dash_issues and
-- dash_build_repos cover search results via SELECT policies.
-- ============================================================
