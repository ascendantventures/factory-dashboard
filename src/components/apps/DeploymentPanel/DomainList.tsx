'use client';

import { useState } from 'react';
import { Check, Copy, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import type { VercelDomain } from '@/lib/vercel-api';

interface DomainListProps {
  domains: VercelDomain[];
  repoId: string;
}

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      data-testid="copy-url-button"
      onClick={copy}
      title={copied ? 'Copied!' : 'Copy URL'}
      style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: copied ? '#22C55E' : '#71717A',
        transition: 'all 150ms',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!copied) (e.currentTarget as HTMLButtonElement).style.color = '#F4F4F5';
      }}
      onMouseLeave={(e) => {
        if (!copied) (e.currentTarget as HTMLButtonElement).style.color = '#71717A';
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

export default function DomainList({ domains, repoId }: DomainListProps) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Domains</h3>
        <a
          href={`https://vercel.com/dashboard/${repoId}/domains`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12, color: '#3B82F6', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          Manage on Vercel
          <ExternalLink size={11} />
        </a>
      </div>

      <div style={{ padding: '8px 0' }}>
        {domains.length === 0 && (
          <div style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-muted)' }}>No domains found.</div>
        )}
        {domains.map((domain, i) => (
          <div
            key={i}
            data-testid="domain-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderBottom: i < domains.length - 1 ? '1px solid #1F1F28' : 'none',
            }}
          >
            {/* Verified indicator */}
            {domain.verified ? (
              <CheckCircle size={14} style={{ color: '#22C55E', flexShrink: 0 }} />
            ) : (
              <AlertTriangle size={14} style={{ color: '#EAB308', flexShrink: 0 }} />
            )}

            <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {domain.name}
            </span>

            {domain.production && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: '#3B82F6',
                  background: 'rgba(59,130,246,0.1)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  flexShrink: 0,
                }}
              >
                Production
              </span>
            )}

            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: domain.verified ? '#22C55E' : '#EAB308',
                background: domain.verified ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                padding: '2px 6px',
                borderRadius: 4,
                flexShrink: 0,
              }}
            >
              {domain.verified ? 'Verified' : 'Unverified'}
            </span>

            <CopyButton url={`https://${domain.name}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
