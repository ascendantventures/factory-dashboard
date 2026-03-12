-- ============================================================
-- Issue #29: Webhook & Integration Configuration
-- fd_webhooks — registered webhook endpoints
-- ⚠️ No auth trigger on this table, but upsert() used if seeding/re-running.
-- ============================================================
CREATE TABLE IF NOT EXISTS fd_webhooks (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  url          TEXT        NOT NULL,
  secret_hash  TEXT,
  events       JSONB       NOT NULL DEFAULT '[]',
  enabled      BOOLEAN     NOT NULL DEFAULT true,
  created_by   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fd_webhooks_created_by_idx ON fd_webhooks(created_by);
CREATE INDEX IF NOT EXISTS fd_webhooks_enabled_idx    ON fd_webhooks(enabled);

-- ============================================================
-- fd_webhook_deliveries — rolling delivery log
-- ============================================================
CREATE TABLE IF NOT EXISTS fd_webhook_deliveries (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id    UUID        NOT NULL REFERENCES fd_webhooks(id) ON DELETE CASCADE,
  event         TEXT        NOT NULL,
  payload       JSONB       NOT NULL,
  status_code   INTEGER,
  response_body TEXT,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fd_webhook_deliveries_webhook_id_idx
  ON fd_webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS fd_webhook_deliveries_sent_at_idx
  ON fd_webhook_deliveries(sent_at DESC);

-- ============================================================
-- updated_at trigger — PATTERN 11: SECURITY DEFINER
-- ============================================================
CREATE OR REPLACE FUNCTION fd_set_updated_at()
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

DROP TRIGGER IF EXISTS fd_webhooks_updated_at ON fd_webhooks;
CREATE TRIGGER fd_webhooks_updated_at
  BEFORE UPDATE ON fd_webhooks
  FOR EACH ROW EXECUTE FUNCTION fd_set_updated_at();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE fd_webhooks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE fd_webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- fd_webhooks: owner-only CRUD
DROP POLICY IF EXISTS "fd_webhooks_select_own" ON fd_webhooks;
CREATE POLICY "fd_webhooks_select_own" ON fd_webhooks
  FOR SELECT USING (created_by = auth.uid());

DROP POLICY IF EXISTS "fd_webhooks_insert_own" ON fd_webhooks;
CREATE POLICY "fd_webhooks_insert_own" ON fd_webhooks
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "fd_webhooks_update_own" ON fd_webhooks;
CREATE POLICY "fd_webhooks_update_own" ON fd_webhooks
  FOR UPDATE USING (created_by = auth.uid());

DROP POLICY IF EXISTS "fd_webhooks_delete_own" ON fd_webhooks;
CREATE POLICY "fd_webhooks_delete_own" ON fd_webhooks
  FOR DELETE USING (created_by = auth.uid());

-- fd_webhook_deliveries: owner can read; service role inserts
DROP POLICY IF EXISTS "fd_deliveries_select_own" ON fd_webhook_deliveries;
CREATE POLICY "fd_deliveries_select_own" ON fd_webhook_deliveries
  FOR SELECT USING (
    webhook_id IN (
      SELECT id FROM fd_webhooks WHERE created_by = auth.uid()
    )
  );

-- INSERT via service role in API routes only — no user-level insert policy
