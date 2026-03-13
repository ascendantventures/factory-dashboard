-- Test Fixtures for build-work Supabase instance
-- Purpose: Enables full interactive UAT on PR preview deployments
--
-- HOW TO APPLY:
--   Option A (Supabase CLI):
--     supabase db push --db-url $BUILD_WORK_DB_URL < supabase/seeds/test-fixtures.sql
--   Option B (psql):
--     psql $BUILD_WORK_DB_URL -f supabase/seeds/test-fixtures.sql
--
-- All inserts are idempotent (ON CONFLICT DO NOTHING / DO UPDATE).
-- Safe to run multiple times.

-- ─── dash_build_repos fixture ────────────────────────────────────────────────
-- Columns: id (uuid, auto), issue_number (int), issue_title (text),
--          github_repo (text UNIQUE), live_url (text), display_name (text)
INSERT INTO dash_build_repos (
  issue_number,
  issue_title,
  github_repo,
  live_url,
  display_name
)
VALUES (
  2,
  'Factory Dashboard — Internal ops tool',
  'ascendantventures/factory-dashboard',
  'https://factory-dashboard-tau.vercel.app',
  'Factory Dashboard'
)
ON CONFLICT (github_repo) DO NOTHING;

-- ─── dash_issues fixtures ────────────────────────────────────────────────────
-- Columns: id (bigint PK — must be provided), issue_number (int), repo (text),
--          title (text), body (text), state (text), station (text),
--          created_at (timestamptz), updated_at (timestamptz)
--
-- body MUST contain "build_repo: ascendantventures/factory-dashboard" so that
-- the bodyMatch logic in /api/apps links these issues to the repo above.
-- Unique constraint: (repo, issue_number)
INSERT INTO dash_issues (id, issue_number, repo, title, body, state, station, created_at, updated_at)
VALUES
  (
    9000101,
    101,
    'ascendantventures/harness-beta-test',
    '[Test] Feature: auth flow',
    E'## Test Issue\n\nbuild_repo: ascendantventures/factory-dashboard\n\nThis is a test fixture issue for the auth flow feature.',
    'closed',
    'done',
    now() - interval '5 days',
    now() - interval '4 days'
  ),
  (
    9000102,
    102,
    'ascendantventures/harness-beta-test',
    '[Test] Fix: sign-out redirect',
    E'## Test Issue\n\nbuild_repo: ascendantventures/factory-dashboard\n\nFix sign-out URL to redirect to production domain.',
    'open',
    'build',
    now() - interval '2 days',
    now() - interval '1 day'
  ),
  (
    9000103,
    103,
    'ascendantventures/harness-beta-test',
    '[Test] Enhancement: stats count consistency',
    E'## Test Issue\n\nbuild_repo: ascendantventures/factory-dashboard\n\nStats count consistency between header and stats bar.',
    'open',
    'QA',
    now() - interval '1 day',
    now()
  )
ON CONFLICT (repo, issue_number) DO NOTHING;
