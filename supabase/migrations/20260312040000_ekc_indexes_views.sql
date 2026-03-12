-- ============================================================
-- Migration: Enhanced Kanban Cards — indexes + views
-- Tables already exist; using real column names from schema
-- ============================================================

-- Index: fast lookup of agent runs by issue_id
CREATE INDEX IF NOT EXISTS idx_dash_agent_runs_issue_id
  ON dash_agent_runs(issue_id);

-- Index: fast lookup of stage transitions by issue_id
CREATE INDEX IF NOT EXISTS idx_dash_stage_transitions_issue_id
  ON dash_stage_transitions(issue_id);

-- Index: running agent indicator — partial index on active runs
CREATE INDEX IF NOT EXISTS idx_dash_agent_runs_running
  ON dash_agent_runs(issue_id)
  WHERE run_status = 'running';

-- View: pre-aggregates cost per issue (using actual column names)
CREATE OR REPLACE VIEW dash_issue_cost_summary AS
SELECT
  issue_id,
  COALESCE(SUM(estimated_cost_usd), 0)::numeric(10,4) AS total_cost_usd,
  COUNT(*)                                              AS total_runs,
  COUNT(*) FILTER (WHERE run_status = 'running')       AS active_runs,
  MAX(started_at) FILTER (WHERE run_status = 'running') AS last_run_started_at
FROM dash_agent_runs
GROUP BY issue_id;

-- View: when did issue enter current station
CREATE OR REPLACE VIEW dash_issue_stage_entry AS
SELECT DISTINCT ON (issue_id)
  issue_id,
  to_station     AS current_station,
  transitioned_at AS entered_at
FROM dash_stage_transitions
ORDER BY issue_id, transitioned_at DESC;
