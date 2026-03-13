'use client';

import { Download } from 'lucide-react';

interface ExportButtonProps {
  from: string;
  to: string;
  repo: string;
}

export default function ExportButton({ from, to, repo }: ExportButtonProps) {
  const params = new URLSearchParams({ from, to });
  if (repo) params.set('repo', repo);
  const href = `/api/analytics/export?${params}`;

  return (
    <a
      href={href}
      download
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        background: 'transparent',
        color: 'var(--text-primary)',
        fontSize: '14px',
        fontWeight: 500,
        fontFamily: 'var(--font-ui, "Instrument Sans", system-ui, sans-serif)',
        textDecoration: 'none',
        transition: 'all 150ms ease-out',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLAnchorElement).style.background = '#1A1B24';
        (e.currentTarget as HTMLAnchorElement).style.borderColor = '#3B82F6';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)';
      }}
    >
      <Download size={16} />
      Export CSV
    </a>
  );
}
