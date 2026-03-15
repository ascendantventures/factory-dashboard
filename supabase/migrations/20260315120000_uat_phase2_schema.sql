-- ============================================================
-- Phase 2: UAT Attachment Upload — Deferred Features
-- Issue #50 | Extends Phase 1 tables from Issue #49
-- ============================================================

-- -------------------------------------------------------
-- API Tokens table
-- ⚠️ BUILD must use upsert() on this table — has insert trigger
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS uat_api_tokens (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash      text NOT NULL UNIQUE,       -- SHA-256 of the raw token
  description     text NOT NULL DEFAULT '',
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active       boolean NOT NULL DEFAULT true,
  last_used_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS uat_api_tokens_token_hash_idx ON uat_api_tokens(token_hash);
CREATE INDEX IF NOT EXISTS uat_api_tokens_is_active_idx ON uat_api_tokens(is_active);

-- updated_at trigger (SECURITY DEFINER — PATTERN 11)
CREATE OR REPLACE FUNCTION uat_set_api_tokens_updated_at()
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

DROP TRIGGER IF EXISTS trg_uat_api_tokens_updated_at ON uat_api_tokens;
CREATE TRIGGER trg_uat_api_tokens_updated_at
  BEFORE UPDATE ON uat_api_tokens
  FOR EACH ROW EXECUTE FUNCTION uat_set_api_tokens_updated_at();

-- -------------------------------------------------------
-- Webhook events log table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS uat_webhook_events (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  github_delivery_id    text NOT NULL UNIQUE,
  event_type            text NOT NULL,          -- 'issues', 'issue_comment', etc.
  raw_payload           jsonb NOT NULL,
  github_issue_number   integer,
  processed             boolean NOT NULL DEFAULT false,
  processed_at          timestamptz,
  error_message         text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS uat_webhook_events_delivery_idx   ON uat_webhook_events(github_delivery_id);
CREATE INDEX IF NOT EXISTS uat_webhook_events_issue_num_idx  ON uat_webhook_events(github_issue_number);
CREATE INDEX IF NOT EXISTS uat_webhook_events_processed_idx  ON uat_webhook_events(processed);

-- -------------------------------------------------------
-- RLS: uat_api_tokens
-- Admins manage tokens; agents use token-based route (bypasses RLS)
-- -------------------------------------------------------
ALTER TABLE uat_api_tokens ENABLE ROW LEVEL SECURITY;

-- Authenticated users (admins) can read all tokens
CREATE POLICY "uat_api_tokens_select_auth"
  ON uat_api_tokens FOR SELECT
  USING (auth.role() = 'authenticated');

-- Authenticated users can insert
CREATE POLICY "uat_api_tokens_insert_auth"
  ON uat_api_tokens FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can update their own tokens
CREATE POLICY "uat_api_tokens_update_auth"
  ON uat_api_tokens FOR UPDATE
  USING (auth.role() = 'authenticated');

-- -------------------------------------------------------
-- RLS: uat_webhook_events
-- Read-only for authenticated users; inserts via service-role only
-- -------------------------------------------------------
ALTER TABLE uat_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "uat_webhook_events_select_auth"
  ON uat_webhook_events FOR SELECT
  USING (auth.role() = 'authenticated');

-- No INSERT/UPDATE policy — webhook route uses service-role key (server-side only)

-- -------------------------------------------------------
-- Extend uat_attachments with source column (Phase 2)
-- Tracks whether attachment came from manual upload or webhook
-- -------------------------------------------------------
ALTER TABLE uat_attachments ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'upload';
