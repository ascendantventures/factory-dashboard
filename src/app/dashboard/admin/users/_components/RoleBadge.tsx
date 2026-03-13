'use client';

const ROLE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  admin: { bg: '#EDE9FE', color: '#7C3AED', label: 'Admin' },
  operator: { bg: '#CFFAFE', color: '#0891B2', label: 'Operator' },
  viewer: { bg: '#F1F5F9', color: '#64748B', label: 'Viewer' },
};

export function RoleBadge({ role }: { role: string }) {
  const s = ROLE_STYLES[role] ?? ROLE_STYLES.viewer;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontSize: '12px',
        fontWeight: 600,
        padding: '4px 8px',
        borderRadius: '4px',
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      {s.label}
    </span>
  );
}
