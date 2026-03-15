export const BUCKETS = {
  pencilDesigns: 'pencil-designs',       // user-uploaded .pen attachments (legacy)
  issueAttachments: 'issue-attachments', // issue #36 — images, PDFs, .pen files per issue
  uatAttachments: 'uat-attachments',     // issue #49 — UAT attachment upload feature
  evidenceFiles: 'ir-evidence-files',    // Phase 2 — IR evidence file uploads
  reports: 'irc-reports',               // Phase 2 — generated technical/compliance reports
} as const;

export const UAT_ATTACHMENTS_BUCKET = 'uat-attachments';
