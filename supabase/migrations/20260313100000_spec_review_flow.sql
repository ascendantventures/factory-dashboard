-- ============================================================
-- Migration: Spec Review & Approval Flow (Issue #18)
-- Applies to: factory-dashboard Supabase project
-- ============================================================

-- ------------------------------------------------------------
-- 1. Add spec approval columns to dash_issues
-- ------------------------------------------------------------

ALTER TABLE dash_issues
  ADD COLUMN IF NOT EXISTS spec_approved boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS spec_approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS spec_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS spec_approval_notes text;

-- ------------------------------------------------------------
-- 2. Create factory_spec_activities table
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS factory_spec_activities (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id        bigint      NOT NULL REFERENCES dash_issues(id) ON DELETE CASCADE,
  actor_id        uuid        NOT NULL REFERENCES auth.users(id),
  activity_type   text        NOT NULL CHECK (activity_type IN ('approved', 'feedback_requested', 'skip_design')),
  payload         jsonb       NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 3. Indexes
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_factory_spec_activities_issue_id
  ON factory_spec_activities (issue_id);

CREATE INDEX IF NOT EXISTS idx_factory_spec_activities_actor_id
  ON factory_spec_activities (actor_id);

CREATE INDEX IF NOT EXISTS idx_factory_spec_activities_created_at
  ON factory_spec_activities (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dash_issues_spec_approved
  ON dash_issues (spec_approved)
  WHERE spec_approved = true;

-- ------------------------------------------------------------
-- 4. Row Level Security
-- ------------------------------------------------------------

ALTER TABLE factory_spec_activities ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all activities
DROP POLICY IF EXISTS "factory_spec_activities_select_authenticated" ON factory_spec_activities;
CREATE POLICY "factory_spec_activities_select_authenticated"
  ON factory_spec_activities
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert their own activities
DROP POLICY IF EXISTS "factory_spec_activities_insert_authenticated" ON factory_spec_activities;
CREATE POLICY "factory_spec_activities_insert_authenticated"
  ON factory_spec_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- dash_issues: allow authenticated users to update spec approval fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'dash_issues'
    AND policyname = 'dash_issues_update_spec_approval_authenticated'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "dash_issues_update_spec_approval_authenticated"
        ON dash_issues
        FOR UPDATE
        TO authenticated
        USING (true)
        WITH CHECK (true)
    $policy$;
  END IF;
END;
$$;
