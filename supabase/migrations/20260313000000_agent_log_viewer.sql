-- ============================================================
-- Live Agent Log Viewer — schema additions
-- Migration: 20260313000000_agent_log_viewer.sql
-- ============================================================

-- Add log_file_path and pid to dash_agent_runs
-- ⚠️ PATTERN 2 (upsert): dash_agent_runs already has no auth trigger,
--    but any INSERT from harness should use upsert() in case of retries.
ALTER TABLE dash_agent_runs
  ADD COLUMN IF NOT EXISTS log_file_path text,
  ADD COLUMN IF NOT EXISTS pid integer;

-- Index for fast lookup by log_file_path (harness writes, dashboard queries)
CREATE INDEX IF NOT EXISTS idx_dash_agent_runs_log_file_path
  ON dash_agent_runs (log_file_path)
  WHERE log_file_path IS NOT NULL;

-- Index: fetch active runs for a specific issue quickly (used by log viewer open)
CREATE INDEX IF NOT EXISTS idx_dash_agent_runs_issue_running
  ON dash_agent_runs (issue_id, run_status)
  WHERE run_status = 'running';

-- ============================================================
-- Storage bucket: dash-agent-logs
-- BUILD NOTE: create this bucket via Supabase dashboard or CLI:
--   supabase storage create dash-agent-logs --public false
-- RLS: only authenticated users can read; service role writes.
-- ============================================================

-- ⚠️ BUILD owns RLS policies. SPEC owns tables + indexes.
-- ============================================================
