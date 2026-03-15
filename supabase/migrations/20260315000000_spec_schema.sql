-- ============================================================
-- Phase 2: kanban_user_prefs
-- Stores per-user column order and visibility preferences
-- ============================================================

CREATE TABLE IF NOT EXISTS kanban_user_prefs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  column_order   jsonb       NOT NULL DEFAULT '[]'::jsonb,
  hidden_columns jsonb       NOT NULL DEFAULT '[]'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Fast per-user lookup
CREATE INDEX IF NOT EXISTS kanban_user_prefs_user_id_idx
  ON kanban_user_prefs (user_id);

-- ⚠️ BUILD: table has trigger — always use upsert(), never insert()
-- Auto-update updated_at on every row modification (PATTERN 11: SECURITY DEFINER)
CREATE OR REPLACE FUNCTION kanban_user_prefs_set_updated_at()
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

DROP TRIGGER IF EXISTS kanban_user_prefs_updated_at ON kanban_user_prefs;
CREATE TRIGGER kanban_user_prefs_updated_at
  BEFORE UPDATE ON kanban_user_prefs
  FOR EACH ROW
  EXECUTE FUNCTION kanban_user_prefs_set_updated_at();

-- RLS
ALTER TABLE kanban_user_prefs ENABLE ROW LEVEL SECURITY;

-- Roles with access: authenticated (own rows only — no admin override needed)
CREATE POLICY "kanban_user_prefs_select_own"
  ON kanban_user_prefs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "kanban_user_prefs_insert_own"
  ON kanban_user_prefs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "kanban_user_prefs_update_own"
  ON kanban_user_prefs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "kanban_user_prefs_delete_own"
  ON kanban_user_prefs FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
