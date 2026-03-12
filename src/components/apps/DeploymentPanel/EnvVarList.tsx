'use client';

import { Check, X, ExternalLink } from 'lucide-react';
import type { VercelEnvVar } from '@/lib/vercel-api';

interface EnvVarListProps {
  vars: VercelEnvVar[];
  repoId: string;
}

export default function EnvVarList({ vars, repoId }: EnvVarListProps) {
  return (
    <div
      data-testid="env-var-list"
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
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Environment Variables</h3>
        <a
          href={`https://vercel.com/dashboard/${repoId}/settings/environment-variables`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12, color: '#3B82F6', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          Manage on Vercel
          <ExternalLink size={11} />
        </a>
      </div>

      <div style={{ padding: '8px 0' }}>
        {vars.length === 0 && (
          <div style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-muted)' }}>No environment variables found.</div>
        )}
        {vars.map((v, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 20px',
              borderBottom: i < vars.length - 1 ? '1px solid #1F1F28' : 'none',
            }}
          >
            {/* Present indicator */}
            {v.present ? (
              <Check size={14} style={{ color: '#22C55E', flexShrink: 0 }} />
            ) : (
              <X size={14} style={{ color: '#EF4444', flexShrink: 0 }} />
            )}

            {/* Key name */}
            <span
              style={{
                flex: 1,
                fontSize: 13,
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {v.key}
            </span>

            {/* Target badges */}
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              {v.target.map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: '#A1A1AA',
                    background: '#24242E',
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
