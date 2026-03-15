-- ─── Phase 2 (#43): fadash_timeline_events table + auto-population trigger ────
-- NOTE: The factory-dashboard Supabase project does not contain the harness
-- `submissions` table. The trigger is attached to `dash_issues.station` instead,
-- which is updated by the sync process whenever the pipeline advances an issue.
-- `fadash_timeline_events.submission_id` = dash_issues.id (bigint = GitHub issue number).

-- ─── TABLE: fadash_timeline_events ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fadash_timeline_events (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id    bigint      NOT NULL REFERENCES dash_issues(id) ON DELETE CASCADE,
  event_type       text        NOT NULL CHECK (event_type IN (
                                 'station_entered', 'station_exited',
                                 'failure', 'bugfix_loop', 'deployed'
                               )),
  station          text,
  occurred_at      timestamptz NOT NULL DEFAULT now(),
  duration_seconds integer,
  metadata         jsonb       DEFAULT '{}'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fadash_timeline_events_submission_idx
  ON fadash_timeline_events(submission_id);

CREATE INDEX IF NOT EXISTS fadash_timeline_events_occurred_idx
  ON fadash_timeline_events(occurred_at DESC);

ALTER TABLE fadash_timeline_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "fadash_timeline_events: authenticated read"
    ON fadash_timeline_events FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── TRIGGER FUNCTION: fadash_on_station_change ────────────────────────────────
-- Fires AFTER UPDATE OF station ON dash_issues.
-- Emits station_exited for old station (with duration) + station_entered for new.
-- NEW.id = dash_issues.id = GitHub issue number (bigint) = fadash_timeline_events.submission_id.
-- SECURITY DEFINER: bypasses RLS so inserts always succeed.

CREATE OR REPLACE FUNCTION fadash_on_station_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_entered_at  timestamptz;
  v_duration_seconds integer;
BEGIN
  -- Only fire if station actually changed
  IF OLD.station IS NOT DISTINCT FROM NEW.station THEN
    RETURN NEW;
  END IF;

  -- Find when the old station was entered (most recent station_entered for this issue+station)
  SELECT occurred_at
    INTO v_last_entered_at
    FROM fadash_timeline_events
   WHERE submission_id = NEW.id
     AND station = OLD.station
     AND event_type = 'station_entered'
   ORDER BY occurred_at DESC
   LIMIT 1;

  -- Compute duration if we have an entry timestamp
  IF v_last_entered_at IS NOT NULL THEN
    v_duration_seconds := EXTRACT(EPOCH FROM (now() - v_last_entered_at))::integer;
  END IF;

  -- Emit station_exited for old station
  IF OLD.station IS NOT NULL THEN
    INSERT INTO fadash_timeline_events (
      submission_id, event_type, station, occurred_at, duration_seconds, metadata
    ) VALUES (
      NEW.id,
      'station_exited',
      OLD.station,
      now(),
      v_duration_seconds,
      jsonb_build_object('transitioned_to', NEW.station)
    );
  END IF;

  -- Emit station_entered for new station
  INSERT INTO fadash_timeline_events (
    submission_id, event_type, station, occurred_at, metadata
  ) VALUES (
    NEW.id,
    'station_entered',
    NEW.station,
    now(),
    jsonb_build_object('transitioned_from', OLD.station)
  );

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Best-effort: never cause the dash_issues UPDATE to fail
  RETURN NEW;
END;
$$;

-- Drop old trigger if exists (idempotent)
DROP TRIGGER IF EXISTS fadash_station_change_trigger ON dash_issues;

-- Attach trigger to dash_issues (not submissions — harness table is in a different DB project)
CREATE TRIGGER fadash_station_change_trigger
  AFTER UPDATE OF station ON dash_issues
  FOR EACH ROW
  EXECUTE FUNCTION fadash_on_station_change();
