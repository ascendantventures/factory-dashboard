export const BUCKETS = {
  pencilDesigns: 'pencil-designs',       // user-uploaded .pen attachments (legacy)
  issueAttachments: 'issue-attachments', // issue #36 — images, PDFs, .pen files per issue
  uatAttachments: 'uat-attachments',     // issue #49 — UAT attachment upload feature
} as const;

export const UAT_ATTACHMENTS_BUCKET = 'uat-attachments';
