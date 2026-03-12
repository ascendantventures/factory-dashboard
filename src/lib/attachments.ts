'use client';

export interface IssueAttachment {
  id: string;
  issue_number: number;
  filename: string;
  file_type: string;
  storage_path: string;
  url: string;
  uploaded_by: string;
  created_at: string;
}

export const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
  'application/x-pencil',
  'application/octet-stream', // .pen files sometimes detected as this
] as const;

export const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.pdf', '.pen'];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_PER_ISSUE = 10;

export function isAllowedFileType(file: File): boolean {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (ext === '.pen') return true;
  return ALLOWED_MIME_TYPES.some((type) => file.type === type);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageType(fileType: string, filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return (
    fileType.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext ?? '')
  );
}

export function isPdfType(fileType: string, filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return fileType === 'application/pdf' || ext === 'pdf';
}

export function isPenType(fileType: string, filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return fileType === 'application/x-pencil' || ext === 'pen';
}

export async function uploadAttachment(
  issueNumber: number,
  file: File,
  onProgress?: (pct: number) => void
): Promise<IssueAttachment> {
  const formData = new FormData();
  formData.append('file', file);

  // Simulate progress since fetch doesn't support upload progress natively
  onProgress?.(10);

  const res = await fetch(`/api/issues/${issueNumber}/attachments`, {
    method: 'POST',
    body: formData,
  });

  onProgress?.(90);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Upload failed');
  }

  onProgress?.(100);
  return res.json();
}

export async function listAttachments(issueNumber: number): Promise<IssueAttachment[]> {
  const res = await fetch(`/api/issues/${issueNumber}/attachments`);
  if (!res.ok) throw new Error('Failed to fetch attachments');
  return res.json();
}

export async function deleteAttachment(issueNumber: number, id: string): Promise<void> {
  const res = await fetch(`/api/issues/${issueNumber}/attachments/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Delete failed');
  }
}
