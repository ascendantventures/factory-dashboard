-- ============================================================
-- UAT Attachment Upload Feature
-- Issue #49
-- ============================================================

-- Table: uat_attachments
-- Stores attachment metadata for pipeline issue testing
CREATE TABLE IF NOT EXISTS public.uat_attachments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  github_issue_number integer NOT NULL,
  attachment_id   text NOT NULL,
  file_url        text NOT NULL,
  file_name       text NOT NULL,
  file_type       text NOT NULL CHECK (file_type IN ('png', 'pdf', 'other')),
  file_size_bytes bigint,
  uploaded_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS uat_attachments_issue_idx
  ON public.uat_attachments (github_issue_number);

CREATE INDEX IF NOT EXISTS uat_attachments_file_type_idx
  ON public.uat_attachments (file_type);

-- updated_at trigger (PATTERN 2 — upsert-safe, SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.uat_set_updated_at()
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

CREATE OR REPLACE TRIGGER uat_attachments_updated_at
  BEFORE UPDATE ON public.uat_attachments
  FOR EACH ROW EXECUTE FUNCTION public.uat_set_updated_at();

-- RLS
ALTER TABLE public.uat_attachments ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all attachments
CREATE POLICY "uat_attachments_select"
  ON public.uat_attachments FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can insert their own attachments
CREATE POLICY "uat_attachments_insert"
  ON public.uat_attachments FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- Only the uploader can update
CREATE POLICY "uat_attachments_update"
  ON public.uat_attachments FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Only the uploader can delete
CREATE POLICY "uat_attachments_delete"
  ON public.uat_attachments FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Storage bucket for UAT attachments (insert-safe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uat-attachments',
  'uat-attachments',
  false,
  26214400, -- 25MB
  ARRAY['image/png', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for uat-attachments bucket
CREATE POLICY "uat_storage_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'uat-attachments');

CREATE POLICY "uat_storage_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'uat-attachments');

CREATE POLICY "uat_storage_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'uat-attachments');
