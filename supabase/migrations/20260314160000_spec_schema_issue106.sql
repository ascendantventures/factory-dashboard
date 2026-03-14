-- ============================================================
-- harness_events — pipeline event log
-- ============================================================
CREATE TABLE IF NOT EXISTS harness_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  direction       text NOT NULL CHECK (direction IN ('incoming', 'outgoing', 'internal')),
  event_type      text NOT NULL,
  status          text NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failure', 'pending')),
  issue_number    int,
  submission_id   uuid,
  payload         jsonb,
  error_message   text,
  duration_ms     int
);

CREATE INDEX IF NOT EXISTS harness_events_created_at_idx    ON harness_events (created_at DESC);
CREATE INDEX IF NOT EXISTS harness_events_issue_number_idx  ON harness_events (issue_number);
CREATE INDEX IF NOT EXISTS harness_events_event_type_idx    ON harness_events (event_type);
CREATE INDEX IF NOT EXISTS harness_events_direction_idx     ON harness_events (direction);
CREATE INDEX IF NOT EXISTS harness_events_submission_id_idx ON harness_events (submission_id);

ALTER TABLE harness_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON harness_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- harness_webhooks — user-configured outbound webhook endpoints
-- ============================================================
CREATE TABLE IF NOT EXISTS harness_webhooks (
  webhook_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  name            text NOT NULL,
  url             text NOT NULL,
  secret          text,
  enabled         boolean NOT NULL DEFAULT true,
  events          text[] NOT NULL DEFAULT '{}',
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS harness_webhooks_enabled_idx    ON harness_webhooks (enabled);
CREATE INDEX IF NOT EXISTS harness_webhooks_created_by_idx ON harness_webhooks (created_by);

CREATE OR REPLACE FUNCTION harness_webhooks_set_updated_at()
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

DROP TRIGGER IF EXISTS harness_webhooks_updated_at ON harness_webhooks;
CREATE TRIGGER harness_webhooks_updated_at
  BEFORE UPDATE ON harness_webhooks
  FOR EACH ROW EXECUTE FUNCTION harness_webhooks_set_updated_at();

ALTER TABLE harness_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON harness_webhooks
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "owner_select" ON harness_webhooks
  FOR SELECT TO authenticated USING (created_by = auth.uid());
CREATE POLICY "owner_insert" ON harness_webhooks
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "owner_update" ON harness_webhooks
  FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "owner_delete" ON harness_webhooks
  FOR DELETE TO authenticated USING (created_by = auth.uid());
