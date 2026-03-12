'use client';

import { ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface Props {
  fileUrl: string;
  attachmentId?: string; // if user upload, fetch signed URL first
}

export default function PenOpenButton({ fileUrl, attachmentId }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      let url = fileUrl;
      if (attachmentId) {
        const res = await fetch(`/api/designs/attachment/${attachmentId}`);
        if (res.ok) {
          const { signedUrl } = await res.json() as { signedUrl: string };
          url = signedUrl;
        }
      }
      const deepLink = `pencil://open?url=${encodeURIComponent(url)}`;
      window.location.href = deepLink;
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        height: '40px',
        padding: '0 16px',
        background: 'transparent',
        border: '1px solid #E8E5E1',
        borderRadius: '8px',
        fontFamily: '"Instrument Sans", system-ui, sans-serif',
        fontSize: '14px',
        fontWeight: 500,
        color: '#1F1E1C',
        cursor: loading ? 'wait' : 'pointer',
        opacity: loading ? 0.6 : 1,
        transition: 'all 150ms ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = '#F9F8F6';
        (e.currentTarget as HTMLButtonElement).style.borderColor = '#D4D1CC';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        (e.currentTarget as HTMLButtonElement).style.borderColor = '#E8E5E1';
      }}
    >
      <ExternalLink size={16} />
      Open in Pencil
    </button>
  );
}
