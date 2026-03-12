-- ============================================================
-- fd_issue_attachments — Issue #36
-- File attachment system for Factory Dashboard issues
-- ============================================================

CREATE TABLE IF NOT EXISTS fd_issue_attachments (
  id             uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_number   integer          NOT NULL,
  filename       text             NOT NULL,
  file_type      text             NOT NULL,
  storage_path   text             NOT NULL,
  url            text             NOT NULL,
  uploaded_by    uuid             NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at     timestamptz      NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS fd_issue_attachments_issue_number_idx
  ON fd_issue_attachments (issue_number);

CREATE INDEX IF NOT EXISTS fd_issue_attachments_uploaded_by_idx
  ON fd_issue_attachments (uploaded_by);

-- RLS
ALTER TABLE fd_issue_attachments ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all attachments (pipeline visibility)
CREATE POLICY "fd_attachments_select"
  ON fd_issue_attachments FOR SELECT
  TO authenticated
  USING (true);

-- Only the uploader can insert their own attachments
CREATE POLICY "fd_attachments_insert"
  ON fd_issue_attachments FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- Only the uploader or admin can delete
CREATE POLICY "fd_attachments_delete"
  ON fd_issue_attachments FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
        AND u.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Supabase Storage bucket: issue-attachments
-- Public bucket, 10MB limit, allowed MIME types
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'issue-attachments',
  'issue-attachments',
  true,
  10485760,
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
    'application/pdf',
    'application/x-pencil',
    'application/octet-stream'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: allow authenticated users to upload
CREATE POLICY "authenticated_upload_issue_attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'issue-attachments');

-- Storage RLS: allow public read (bucket is public)
CREATE POLICY "public_read_issue_attachments"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'issue-attachments');

-- Storage RLS: allow uploader to delete their own files
CREATE POLICY "owner_delete_issue_attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'issue-attachments' AND owner = auth.uid());
