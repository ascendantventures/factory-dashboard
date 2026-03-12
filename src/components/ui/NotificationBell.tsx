'use client';

import { useState, useRef } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import { badgeVariants } from '@/lib/motion';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();
  const prevCountRef = useRef(unreadCount);
  const [badgeKey, setBadgeKey] = useState(0);

  // Trigger badge pop animation when count increases
  if (unreadCount > prevCountRef.current) {
    prevCountRef.current = unreadCount;
    setBadgeKey((k) => k + 1);
  } else {
    prevCountRef.current = unreadCount;
  }

  return (
    <div className="relative" style={{ position: 'relative' }}>
      <button
        data-testid="notification-bell"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-center rounded-lg transition-colors"
        style={{
          width: '40px',
          height: '40px',
          color: '#44403C',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#F5F5F4')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        onMouseDown={(e) => (e.currentTarget.style.background = '#E7E5E4')}
        onMouseUp={(e) => (e.currentTarget.style.background = '#F5F5F4')}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
      >
        <Bell style={{ width: '20px', height: '20px' }} />

        {/* Unread badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key={badgeKey}
              data-testid="notification-badge"
              variants={badgeVariants}
              initial="initial"
              animate="pop"
              className="absolute flex items-center justify-center"
              style={{
                top: '-2px',
                right: '-2px',
                minWidth: '18px',
                height: '18px',
                padding: '0 5px',
                background: '#DC2626',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '9999px',
                border: '2px solid #FFFFFF',
                lineHeight: 1,
                fontFamily: 'var(--font-ui, system-ui)',
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <NotificationPanel
        isOpen={isOpen}
        notifications={notifications}
        loading={loading}
        onClose={() => setIsOpen(false)}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
      />
    </div>
  );
}
