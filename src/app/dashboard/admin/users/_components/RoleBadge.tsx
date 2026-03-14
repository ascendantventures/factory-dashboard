'use client';

import { Shield, User } from 'lucide-react';

const ROLE_STYLES: Record<string, { bg: string; color: string; border: string; label: string; icon: typeof Shield }> = {
  admin: {
    bg: 'rgba(168, 85, 247, 0.12)',
    color: '#C4B5FD',
    border: 'rgba(168, 85, 247, 0.25)',
    label: 'Admin',
    icon: Shield,
  },
  operator: {
    bg: 'rgba(99, 102, 241, 0.12)',
    color: '#A5B4FC',
    border: 'rgba(99, 102, 241, 0.25)',
    label: 'Operator',
    icon: User,
  },
  viewer: {
    bg: 'rgba(113, 113, 122, 0.12)',
    color: '#A1A1AA',
    border: 'rgba(113, 113, 122, 0.25)',
    label: 'Viewer',
    icon: User,
  },
};

export function RoleBadge({ role }: { role: string }) {
  const s = ROLE_STYLES[role] ?? ROLE_STYLES.viewer;
  const Icon = s.icon;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px',
        fontWeight: 500,
        padding: '4px 8px',
        borderRadius: '4px',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.02em',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <Icon size={10} />
      {s.label}
    </span>
  );
}
