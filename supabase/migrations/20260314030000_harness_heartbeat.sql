-- ─── harness_heartbeat ────────────────────────────────────────────────────────
-- Singleton table: harness upserts a single row ('main') on every loop tick.
-- Dashboard reads this to determine running status, PID, and agent count.

CREATE TABLE IF NOT EXISTS harness_heartbeat (
  id            TEXT        PRIMARY KEY DEFAULT 'main',
  pid           INTEGER,
  active_agents INTEGER     NOT NULL DEFAULT 0,
  lock_snapshot JSONB,          -- snapshot of /tmp/factory-loop.lock entries
  status        TEXT        NOT NULL DEFAULT 'running',
  last_seen     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for freshness check (dashboard queries WHERE id='main' ORDER BY last_seen DESC)
CREATE INDEX IF NOT EXISTS harness_heartbeat_last_seen_idx ON harness_heartbeat(last_seen DESC);

-- RLS: authenticated users (admin role) can SELECT; only service role can INSERT/UPDATE/DELETE
ALTER TABLE harness_heartbeat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view heartbeat"
  ON harness_heartbeat FOR SELECT
  TO authenticated
  USING (true);

-- Service role bypasses RLS by default — no INSERT/UPDATE/DELETE policies needed for non-service roles
