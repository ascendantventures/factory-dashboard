'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { PencilDesignRow } from '@/lib/pen-types';
import Link from 'next/link';

interface Props {
  repoId: string;
  issueNumber: number;
  versions: PencilDesignRow[];
}

export default function DesignVersionHistory({ repoId, issueNumber, versions }: Props) {
  const [open, setOpen] = useState(false);

  if (versions.length <= 1) return null;

  const sorted = [...versions].sort((a, b) => b.version - a.version);

  return (
    <div style={{ marginTop: '8px' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          all: 'unset',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: '"Instrument Sans", system-ui, sans-serif',
          fontSize: '13px',
          fontWeight: 500,
          color: '#6366F1',
        }}
      >
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        Version history ({versions.length})
      </button>

      {open && (
        <div style={{
          marginTop: '8px',
          border: '1px solid #E8E5E1',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          {sorted.map((v, i) => (
            <div
              key={v.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: i === 0 ? '#F9F8F6' : '#FFFFFF',
                borderBottom: i < sorted.length - 1 ? '1px solid #E8E5E1' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {i === 0 && (
                  <span style={{
                    padding: '2px 8px',
                    background: '#DCFCE7',
                    color: '#16A34A',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    fontFamily: '"Instrument Sans", system-ui, sans-serif',
                  }}>
                    Current
                  </span>
                )}
                <span style={{
                  fontFamily: '"Instrument Sans", system-ui, sans-serif',
                  fontSize: '13px',
                  color: '#1F1E1C',
                }}>
                  v{v.version}
                </span>
                <span style={{
                  fontFamily: '"Instrument Sans", system-ui, sans-serif',
                  fontSize: '12px',
                  color: '#9C9792',
                }}>
                  {v.source === 'user' ? 'User upload' : 'Pipeline'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  fontFamily: '"Instrument Sans", system-ui, sans-serif',
                  fontSize: '12px',
                  color: '#9C9792',
                }}>
                  {new Date(v.created_at).toLocaleDateString()}
                </span>
                <Link
                  href={`/dashboard/apps/${repoId}/designs/${issueNumber}?version=${v.version}`}
                  style={{
                    fontFamily: '"Instrument Sans", system-ui, sans-serif',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#6366F1',
                    textDecoration: 'none',
                  }}
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
