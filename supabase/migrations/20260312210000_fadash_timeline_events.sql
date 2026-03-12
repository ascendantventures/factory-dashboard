-- fadash_timeline_events: tracks pipeline stage transitions per submission
-- Uses fadash_ prefix to avoid collisions with shared dash_ tables

CREATE TABLE IF NOT EXISTS fadash_timeline_events (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id    bigint NOT NULL REFERENCES dash_issues(id) ON DELETE CASCADE,
  event_type       text NOT NULL CHECK (event_type IN (
                     'station_entered', 'station_exited', 'failure', 'bugfix_loop', 'deployed'
                   )),
  station          text,
  occurred_at      timestamptz NOT NULL DEFAULT now(),
  duration_seconds integer,
  metadata         jsonb DEFAULT '{}'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fadash_timeline_events_submission_id_idx
  ON fadash_timeline_events(submission_id);

CREATE INDEX IF NOT EXISTS fadash_timeline_events_occurred_at_idx
  ON fadash_timeline_events(occurred_at DESC);

ALTER TABLE fadash_timeline_events ENABLE ROW LEVEL SECURITY;

-- authenticated users may SELECT all timeline events
CREATE POLICY "fadash_timeline_events: authenticated read"
  ON fadash_timeline_events FOR SELECT TO authenticated USING (true);

-- only service_role may INSERT/UPDATE/DELETE (enforced via RLS — no policy = deny for non-service roles)
