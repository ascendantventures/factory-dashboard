'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';

interface Props {
  fileUrl: string;
  fileName?: string;
  issueNumber?: number;
  attachmentId?: string;
}

export default function PenDownloadButton({ fileUrl, fileName, issueNumber, attachmentId }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      let url = fileUrl;
      const name = fileName ?? `design-issue-${issueNumber ?? 'unknown'}.pen`;

      if (attachmentId) {
        const res = await fetch(`/api/designs/attachment/${attachmentId}`);
        if (res.ok) {
          const { signedUrl } = await res.json() as { signedUrl: string };
          url = signedUrl;
        }
      }

      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      data-testid="pen-download-btn"
      onClick={handleClick}
      disabled={loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        height: '40px',
        padding: '0 16px',
        background: '#E85D4C',
        border: 'none',
        borderRadius: '8px',
        fontFamily: '"Instrument Sans", system-ui, sans-serif',
        fontSize: '14px',
        fontWeight: 500,
        color: '#FFFFFF',
        cursor: loading ? 'wait' : 'pointer',
        opacity: loading ? 0.6 : 1,
        transition: 'background 150ms ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = '#C94A3B';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = '#E85D4C';
      }}
    >
      <Download size={16} />
      Download
    </button>
  );
}
