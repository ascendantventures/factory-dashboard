-- ============================================================
-- fdash_event_log
-- Stores all incoming GitHub webhook events and outgoing
-- notification events for the Factory Dashboard event log.
-- ⚠️ BUILD: use upsert() (onConflict: 'id') not plain insert()
-- because the auth trigger below is SECURITY DEFINER.
-- ============================================================

CREATE TABLE IF NOT EXISTS fdash_event_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction       text NOT NULL CHECK (direction IN ('in', 'out')),
  event_type      text NOT NULL,
  source          text NOT NULL DEFAULT '',
  payload         jsonb NOT NULL DEFAULT '{}',
  status          text NOT NULL DEFAULT 'received'
                    CHECK (status IN ('received', 'delivered', 'failed')),
  retry_count     int NOT NULL DEFAULT 0,
  last_retried_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS fdash_event_log_created_at_idx
  ON fdash_event_log (created_at DESC);

CREATE INDEX IF NOT EXISTS fdash_event_log_direction_idx
  ON fdash_event_log (direction);

CREATE INDEX IF NOT EXISTS fdash_event_log_event_type_idx
  ON fdash_event_log (event_type);

CREATE INDEX IF NOT EXISTS fdash_event_log_status_idx
  ON fdash_event_log (status);

-- RLS: admin service role writes; authenticated admins read.
ALTER TABLE fdash_event_log ENABLE ROW LEVEL SECURITY;

-- SELECT: all authenticated users (admins) can read
CREATE POLICY "fdash_event_log_select" ON fdash_event_log
  FOR SELECT TO authenticated USING (true);

-- INSERT: only service_role (server-side API writes)
CREATE POLICY "fdash_event_log_insert_service" ON fdash_event_log
  FOR INSERT TO service_role WITH CHECK (true);

-- UPDATE: only service_role (retries, status updates)
CREATE POLICY "fdash_event_log_update_service" ON fdash_event_log
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);
