-- ============================================================
-- Cost Analytics Indexes — Issue #25
-- Adds performance indexes for analytics queries.
-- dash_stage_transitions and dash_agent_runs already exist.
-- ============================================================

-- Index for time-series queries on agent runs (trends endpoint)
CREATE INDEX IF NOT EXISTS idx_dash_agent_runs_started_at
  ON dash_agent_runs (started_at DESC);

-- Composite index for cost aggregations by station
CREATE INDEX IF NOT EXISTS idx_dash_agent_runs_station_cost
  ON dash_agent_runs (station, estimated_cost_usd, started_at);

-- Index for per-repo queries
CREATE INDEX IF NOT EXISTS idx_dash_agent_runs_repo_cost
  ON dash_agent_runs (repo, started_at);

-- Index for model breakdowns
CREATE INDEX IF NOT EXISTS idx_dash_agent_runs_model_cost
  ON dash_agent_runs (model, estimated_cost_usd);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_dash_agent_runs_run_status
  ON dash_agent_runs (run_status, started_at);
