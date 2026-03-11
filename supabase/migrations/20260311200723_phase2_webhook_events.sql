-- ============================================================
-- Factory Dashboard Phase 2 — Migration
-- Webhook event log table
-- ============================================================

CREATE TABLE IF NOT EXISTS dash_webhook_events (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  github_delivery_id text        UNIQUE NOT NULL,
  event_type         text        NOT NULL,
  repo               text        NOT NULL,
  issue_number       int,
  payload            jsonb       NOT NULL,
  received_at        timestamptz DEFAULT now() NOT NULL,
  processed_at       timestamptz,
  error              text
);

CREATE INDEX IF NOT EXISTS idx_dash_webhook_events_repo
  ON dash_webhook_events(repo, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_dash_webhook_events_issue
  ON dash_webhook_events(repo, issue_number)
  WHERE issue_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dash_webhook_events_pending
  ON dash_webhook_events(received_at)
  WHERE processed_at IS NULL;

ALTER TABLE dash_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read webhook events"
  ON dash_webhook_events FOR SELECT
  TO authenticated
  USING (true);
