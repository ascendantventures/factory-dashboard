-- ============================================================
-- Issue #111 Phase 2 — Foundary Webhooks: format_type column
-- Extends existing fd_webhooks table (do NOT recreate)
-- ⚠️ fd_webhooks has an updated_at trigger — BUILD must use
--    upsert() not insert() if seeding or re-running.
-- ============================================================

-- Add format_type to fd_webhooks (safe to run multiple times)
ALTER TABLE fd_webhooks
  ADD COLUMN IF NOT EXISTS format_type TEXT NOT NULL DEFAULT 'standard';

-- Constrain to known values
ALTER TABLE fd_webhooks
  DROP CONSTRAINT IF EXISTS fd_webhooks_format_type_check;
ALTER TABLE fd_webhooks
  ADD CONSTRAINT fd_webhooks_format_type_check
  CHECK (format_type IN ('standard', 'slack', 'discord'));

-- Index for any future analytics on format breakdown
CREATE INDEX IF NOT EXISTS fd_webhooks_format_type_idx
  ON fd_webhooks(format_type);

-- ============================================================
-- No new tables required for Phase 2.
-- Retry reuses fd_webhook_deliveries (reads existing payload).
-- Fire-event endpoint uses existing fd_webhooks + fd_webhook_deliveries.
-- ============================================================
