'use client';

import { Bot } from 'lucide-react';

export function BotBadge() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: '#DDD6FE',
        color: '#6D28D9',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        padding: '2px 6px',
        borderRadius: 4,
      }}
    >
      <Bot size={12} />
      AGENT
    </span>
  );
}
