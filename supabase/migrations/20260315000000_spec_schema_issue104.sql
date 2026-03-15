-- ============================================================
-- Issue #104 fix: ensure dash_webhook_events table exists
-- This migration was in the codebase (phase2_webhook_events)
-- but may not have been applied. IF NOT EXISTS guards are safe.
-- ============================================================

CREATE TABLE IF NOT EXISTS dash_webhook_events (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  github_delivery_id text        UNIQUE NOT NULL,
  event_type         text        NOT NULL,
  repo               text        NOT NULL,
  issue_number       int,
  payload            jsonb       NOT NULL DEFAULT '{}',
  received_at        timestamptz NOT NULL DEFAULT now(),
  processed_at       timestamptz,
  error              text
);

CREATE INDEX IF NOT EXISTS idx_dash_webhook_events_repo
  ON dash_webhook_events (repo, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_dash_webhook_events_issue
  ON dash_webhook_events (repo, issue_number)
  WHERE issue_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dash_webhook_events_pending
  ON dash_webhook_events (received_at)
  WHERE processed_at IS NULL;

ALTER TABLE dash_webhook_events ENABLE ROW LEVEL SECURITY;

-- Policy already exists from phase2 migration — use IF NOT EXISTS equivalent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'dash_webhook_events'
      AND policyname = 'Authenticated users can read webhook events'
  ) THEN
    CREATE POLICY "Authenticated users can read webhook events"
      ON dash_webhook_events FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END$$;

-- ============================================================
-- Additional indexes for activity feed performance on
-- dash_stage_transitions (safe to re-run — all use IF NOT EXISTS)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_dash_stage_transitions_transitioned_at
  ON dash_stage_transitions (transitioned_at DESC);

CREATE INDEX IF NOT EXISTS idx_dash_stage_transitions_repo_transitioned
  ON dash_stage_transitions (repo, transitioned_at DESC);
