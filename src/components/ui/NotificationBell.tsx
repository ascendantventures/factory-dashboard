'use client';

import { Bell } from 'lucide-react';

export function NotificationBell() {
  return (
    <button
      className="flex items-center justify-center rounded-lg transition-colors hover:opacity-80"
      style={{
        width: '36px',
        height: '36px',
        color: 'var(--text-muted)',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
      }}
      aria-label="Notifications"
    >
      <Bell className="w-4 h-4" />
    </button>
  );
}
