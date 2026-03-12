'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  body: string;
  isAgent: boolean;
  isDocument: boolean;
  children: React.ReactNode;
}

const COLLAPSE_THRESHOLD = 1500;
const PREVIEW_CHARS = 300;

export function CollapsibleComment({ body, isDocument, children }: Props) {
  const isLong = body.length > COLLAPSE_THRESHOLD;
  const [expanded, setExpanded] = useState(isDocument || !isLong);

  if (!isLong) {
    return <>{children}</>;
  }

  return (
    <div>
      {expanded ? (
        <>
          {children}
          <button
            onClick={() => setExpanded(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 8,
              fontSize: 13,
              color: '#D97706',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontWeight: 500,
            }}
          >
            <ChevronUp size={14} />
            Show less
          </button>
        </>
      ) : (
        <div>
          <div style={{ position: 'relative', overflow: 'hidden', maxHeight: 120 }}>
            <div style={{ color: '#44403C', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {body.slice(0, PREVIEW_CHARS)}
              {body.length > PREVIEW_CHARS ? '…' : ''}
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 48,
                background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.95))',
                pointerEvents: 'none',
              }}
            />
          </div>
          <button
            onClick={() => setExpanded(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 8,
              fontSize: 13,
              color: '#D97706',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontWeight: 500,
            }}
          >
            <ChevronDown size={14} />
            Show more
          </button>
        </div>
      )}
    </div>
  );
}
