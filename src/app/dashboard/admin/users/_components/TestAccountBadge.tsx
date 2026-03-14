'use client';

import { FlaskConical } from 'lucide-react';

export function TestAccountBadge() {
  return (
    <span
      data-testid="test-account-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '4px',
        background: 'rgba(245, 158, 11, 0.12)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '10px',
        fontWeight: 500,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.02em',
        color: '#FCD34D',
        flexShrink: 0,
      }}
    >
      <FlaskConical size={10} />
      TEST
    </span>
  );
}
