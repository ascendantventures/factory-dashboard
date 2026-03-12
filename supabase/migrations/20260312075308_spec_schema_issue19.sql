-- ============================================================
-- pipeline_station_config
-- ⚠️ BUILD: use upsert() not insert() — has auth trigger below
-- ============================================================
CREATE TABLE IF NOT EXISTS pipeline_station_config (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_name    text NOT NULL UNIQUE,       -- e.g. 'spec', 'design', 'build', 'qa'
  model_id        text NOT NULL DEFAULT 'claude-sonnet-4-6',
  concurrency     int  NOT NULL DEFAULT 1 CHECK (concurrency BETWEEN 1 AND 10),
  timeout_seconds int  NOT NULL DEFAULT 1800 CHECK (timeout_seconds BETWEEN 60 AND 7200),
  is_enabled      boolean NOT NULL DEFAULT true,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  updated_by      text
);

-- Seed default stations
INSERT INTO pipeline_station_config (station_name) VALUES
  ('intake'), ('spec'), ('design'), ('build'), ('qa')
ON CONFLICT (station_name) DO NOTHING;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION pipeline_set_updated_at()
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

CREATE TRIGGER pipeline_station_config_updated_at
  BEFORE UPDATE ON pipeline_station_config
  FOR EACH ROW EXECUTE FUNCTION pipeline_set_updated_at();

-- ============================================================
-- pipeline_audit_log
-- ============================================================
CREATE TABLE IF NOT EXISTS pipeline_audit_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  action_name   text NOT NULL,   -- 'start_loop' | 'stop_loop' | 'force_tick' | 'clear_locks' |
                                  -- 'clear_backoff' | 'skip_issue' | 'block_issue' |
                                  -- 'retry_issue' | 'advance_issue' | 'revert_issue'
  issue_number  int,              -- NULL for pipeline-level actions
  operator_email text,
  metadata      jsonb
);

CREATE INDEX IF NOT EXISTS pipeline_audit_log_created_at_idx ON pipeline_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS pipeline_audit_log_action_idx     ON pipeline_audit_log (action_name);
CREATE INDEX IF NOT EXISTS pipeline_audit_log_issue_idx      ON pipeline_audit_log (issue_number) WHERE issue_number IS NOT NULL;

-- ============================================================
-- RLS
-- Both tables are internal-admin only.
-- Restrict to authenticated + service_role only.
-- ============================================================
ALTER TABLE pipeline_station_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_audit_log      ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/write (internal admin tool)
CREATE POLICY "pipeline_station_config_auth_all" ON pipeline_station_config
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "pipeline_audit_log_auth_all" ON pipeline_audit_log
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
