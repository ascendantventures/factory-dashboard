-- ============================================================
-- pencil_designs
-- Metadata for .pen files committed to build repos by pipeline
-- No auth trigger on this table — BUILD may use insert() safely
-- ============================================================
CREATE TABLE IF NOT EXISTS pencil_designs (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id       TEXT         NOT NULL,
  issue_number  INTEGER      NOT NULL,
  file_url      TEXT         NOT NULL,
  commit_sha    TEXT,
  version       INTEGER      NOT NULL DEFAULT 1,
  source        TEXT         NOT NULL DEFAULT 'pipeline' CHECK (source IN ('pipeline', 'user')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pencil_designs_repo_id_idx
  ON pencil_designs(repo_id);

CREATE INDEX IF NOT EXISTS pencil_designs_repo_issue_idx
  ON pencil_designs(repo_id, issue_number);

-- updated_at auto-update trigger (SECURITY DEFINER — PATTERN 11)
CREATE OR REPLACE FUNCTION pencil_designs_set_updated_at()
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

DROP TRIGGER IF EXISTS pencil_designs_updated_at ON pencil_designs;
CREATE TRIGGER pencil_designs_updated_at
  BEFORE UPDATE ON pencil_designs
  FOR EACH ROW EXECUTE FUNCTION pencil_designs_set_updated_at();

-- RLS
ALTER TABLE pencil_designs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all designs
CREATE POLICY "pencil_designs_select_authenticated"
  ON pencil_designs FOR SELECT
  TO authenticated
  USING (true);

-- Service role can insert/update (pipeline writes via service role)
CREATE POLICY "pencil_designs_insert_service"
  ON pencil_designs FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "pencil_designs_update_service"
  ON pencil_designs FOR UPDATE
  TO service_role
  USING (true);


-- ============================================================
-- pencil_design_attachments
-- User-uploaded .pen files attached to issues
-- Has NO auth trigger — BUILD may use insert() safely
-- ============================================================
CREATE TABLE IF NOT EXISTS pencil_design_attachments (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id       TEXT         NOT NULL,
  issue_number  INTEGER      NOT NULL,
  storage_path  TEXT         NOT NULL,
  file_name     TEXT         NOT NULL,
  file_size     INTEGER,
  uploaded_by   UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pencil_design_attachments_issue_idx
  ON pencil_design_attachments(repo_id, issue_number);

CREATE INDEX IF NOT EXISTS pencil_design_attachments_uploaded_by_idx
  ON pencil_design_attachments(uploaded_by);

-- RLS
ALTER TABLE pencil_design_attachments ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all attachments
CREATE POLICY "pencil_design_attachments_select_authenticated"
  ON pencil_design_attachments FOR SELECT
  TO authenticated
  USING (true);

-- Any authenticated user can insert (upload their own .pen)
CREATE POLICY "pencil_design_attachments_insert_authenticated"
  ON pencil_design_attachments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

-- Users can delete their own attachments; service role can delete any
CREATE POLICY "pencil_design_attachments_delete_own"
  ON pencil_design_attachments FOR DELETE
  TO authenticated
  USING (auth.uid() = uploaded_by);

CREATE POLICY "pencil_design_attachments_delete_service"
  ON pencil_design_attachments FOR DELETE
  TO service_role
  USING (true);

-- Storage bucket for user-uploaded .pen files
INSERT INTO storage.buckets (id, name, public)
VALUES ('pencil-designs', 'pencil-designs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: authenticated users can upload their own files
CREATE POLICY "pencil_designs_storage_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'pencil-designs');

CREATE POLICY "pencil_designs_storage_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'pencil-designs');

CREATE POLICY "pencil_designs_storage_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'pencil-designs' AND owner::uuid = auth.uid());
