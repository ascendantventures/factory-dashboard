'use client';

export function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <span
        data-testid="status-badge"
        style={{
          background: '#D1FAE5',
          color: '#059669',
          fontSize: '12px',
          fontWeight: 600,
          padding: '4px 8px',
          borderRadius: '4px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', flexShrink: 0 }} />
        Active
      </span>
    );
  }
  return (
    <span
      data-testid="status-badge"
      style={{
        background: '#FEE2E2',
        color: '#DC2626',
        fontSize: '12px',
        fontWeight: 600,
        padding: '4px 8px',
        borderRadius: '4px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#DC2626', flexShrink: 0 }} />
      Deactivated
    </span>
  );
}
