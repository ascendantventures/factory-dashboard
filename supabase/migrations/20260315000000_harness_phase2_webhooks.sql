-- ============================================================
-- harness_events: add metadata column for structured context (e.g. github webhook fields)
-- ============================================================
ALTER TABLE harness_events ADD COLUMN IF NOT EXISTS metadata jsonb;

-- ============================================================
-- Phase 2: harness_webhook_deliveries — outbound webhook delivery log
-- ⚠️ No auth trigger on this table. Standard insert() is fine.
--    RLS: service_role full access; owner read their own deliveries.
-- ============================================================

CREATE TABLE IF NOT EXISTS harness_webhook_deliveries (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  webhook_id       uuid        NOT NULL REFERENCES harness_webhooks(webhook_id) ON DELETE CASCADE,
  event_id         uuid        REFERENCES harness_events(id) ON DELETE SET NULL,
  event_type       text        NOT NULL,
  payload          jsonb       NOT NULL DEFAULT '{}',
  attempt_number   int         NOT NULL DEFAULT 1,
  delivery_status  text        NOT NULL DEFAULT 'pending'
                   CHECK (delivery_status IN ('pending','success','failed','retrying')),
  response_code    int,
  error_message    text,
  delivered_at     timestamptz,
  next_retry_at    timestamptz
);

-- Index: process pending/retrying deliveries in order
CREATE INDEX IF NOT EXISTS idx_harness_webhook_deliveries_pending
  ON harness_webhook_deliveries (next_retry_at ASC)
  WHERE delivery_status IN ('pending', 'retrying');

-- Index: look up deliveries for a webhook
CREATE INDEX IF NOT EXISTS idx_harness_webhook_deliveries_webhook_id
  ON harness_webhook_deliveries (webhook_id);

-- Index: look up deliveries for an event
CREATE INDEX IF NOT EXISTS idx_harness_webhook_deliveries_event_id
  ON harness_webhook_deliveries (event_id)
  WHERE event_id IS NOT NULL;

-- updated_at trigger (SECURITY DEFINER — PATTERN 11)
CREATE OR REPLACE FUNCTION harness_set_webhook_delivery_updated_at()
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_harness_webhook_deliveries_updated_at'
      AND tgrelid = 'harness_webhook_deliveries'::regclass
  ) THEN
    CREATE TRIGGER trg_harness_webhook_deliveries_updated_at
      BEFORE UPDATE ON harness_webhook_deliveries
      FOR EACH ROW EXECUTE FUNCTION harness_set_webhook_delivery_updated_at();
  END IF;
END;
$$;

-- ============================================================
-- RLS — harness_webhook_deliveries
-- ============================================================

ALTER TABLE harness_webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- service_role: unrestricted (for delivery worker)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='harness_webhook_deliveries' AND policyname='service_role full access on harness_webhook_deliveries'
  ) THEN
    CREATE POLICY "service_role full access on harness_webhook_deliveries"
      ON harness_webhook_deliveries
      AS PERMISSIVE FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END; $$;

-- authenticated: read own deliveries (via webhook ownership)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='harness_webhook_deliveries' AND policyname='owner read harness_webhook_deliveries'
  ) THEN
    CREATE POLICY "owner read harness_webhook_deliveries"
      ON harness_webhook_deliveries
      AS PERMISSIVE FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM harness_webhooks hw
          WHERE hw.webhook_id = harness_webhook_deliveries.webhook_id
            AND hw.created_by = auth.uid()
        )
      );
  END IF;
END; $$;

-- ============================================================
-- harness_events: add index for real-time subscription efficiency
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_harness_events_created_at_desc
  ON harness_events (created_at DESC);

-- ============================================================
-- Event retention: purge function (called by Edge Function cron)
-- ============================================================
CREATE OR REPLACE FUNCTION harness_purge_old_events(
  event_ttl_days int DEFAULT 90,
  delivery_ttl_days int DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  events_deleted     int;
  deliveries_deleted int;
BEGIN
  DELETE FROM harness_events
  WHERE created_at < NOW() - (event_ttl_days || ' days')::interval;
  GET DIAGNOSTICS events_deleted = ROW_COUNT;

  DELETE FROM harness_webhook_deliveries
  WHERE created_at < NOW() - (delivery_ttl_days || ' days')::interval;
  GET DIAGNOSTICS deliveries_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'events_deleted', events_deleted,
    'deliveries_deleted', deliveries_deleted
  );
END;
$$;
