interface EventStatusBadgeProps {
  status: 'received' | 'delivered' | 'failed';
}

export function EventStatusBadge({ status }: EventStatusBadgeProps) {
  const styles: Record<string, { background: string; color: string }> = {
    received: { background: '#F4F5F7', color: '#475569' },
    delivered: { background: '#D1FAE5', color: '#059669' },
    failed: { background: '#FEE2E2', color: '#DC2626' },
  };

  const style = styles[status] ?? styles.received;

  return (
    <span
      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium whitespace-nowrap"
      style={style}
    >
      {status}
    </span>
  );
}
