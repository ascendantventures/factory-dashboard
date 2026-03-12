'use client';

import { useEffect, useState } from 'react';

function formatRelative(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

interface ActivityTimestampProps {
  occurred_at: string;
}

export function ActivityTimestamp({ occurred_at }: ActivityTimestampProps) {
  const date = new Date(occurred_at);
  const [label, setLabel] = useState(() => formatRelative(date));

  useEffect(() => {
    const interval = setInterval(() => {
      setLabel(formatRelative(date));
    }, 30_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [occurred_at]);

  return (
    <time
      data-testid="activity-timestamp"
      title={occurred_at}
      dateTime={occurred_at}
      className="text-xs flex-shrink-0"
      style={{ color: '#71717A' }}
    >
      {label}
    </time>
  );
}
