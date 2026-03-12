-- ============================================================
-- dash_build_repos — cache of repos extracted from done issues
-- Optional: app can also derive on the fly; this table speeds
-- up repeated modal opens by caching parsed results.
-- ⚠️ No auth trigger on this table — BUILD may use insert()
-- ============================================================

CREATE TABLE IF NOT EXISTS dash_build_repos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_number    integer NOT NULL,
  issue_title     text NOT NULL,
  github_repo     text NOT NULL,           -- e.g. "ascendantventures/chat-platform"
  live_url        text,                    -- nullable, e.g. "https://chat-platform.vercel.app"
  display_name    text NOT NULL,           -- e.g. "chat-platform — Chat Platform API"
  refreshed_at    timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(github_repo)
);

CREATE INDEX IF NOT EXISTS idx_dash_build_repos_github_repo
  ON dash_build_repos (github_repo);

CREATE INDEX IF NOT EXISTS idx_dash_build_repos_refreshed_at
  ON dash_build_repos (refreshed_at DESC);

-- RLS: authenticated read, service_role write
ALTER TABLE dash_build_repos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can read dash_build_repos"
  ON dash_build_repos FOR SELECT
  TO authenticated
  USING (true);
