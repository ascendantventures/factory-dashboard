-- ============================================================
-- dash activity feed — enable Realtime on pipeline event tables
-- Migration: 20260312120000_activity_feed_realtime.sql
-- ============================================================

-- Enable Realtime on dash_stage_transitions (stage change events)
-- No new tables created — this is a publication registration only
ALTER PUBLICATION supabase_realtime ADD TABLE dash_stage_transitions;

-- Enable Realtime on dash_agent_runs (agent spawn / cost / QA events)
ALTER PUBLICATION supabase_realtime ADD TABLE dash_agent_runs;

-- ============================================================
-- No auth triggers required (no new user-linked tables)
-- No upsert patterns required (read-only feed from existing tables)
-- ============================================================
