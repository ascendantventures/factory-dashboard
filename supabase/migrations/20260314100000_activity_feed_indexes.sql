-- ============================================================
-- Issue #104 fix: ensure indexes exist for activity feed queries
-- These are safe CREATE INDEX IF NOT EXISTS statements.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_dash_webhook_events_pending
  ON dash_webhook_events (received_at)
  WHERE processed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_dash_stage_transitions_created_at
  ON dash_stage_transitions (transitioned_at DESC);

CREATE INDEX IF NOT EXISTS idx_dash_stage_transitions_issue
  ON dash_stage_transitions (issue_id, transitioned_at DESC);
