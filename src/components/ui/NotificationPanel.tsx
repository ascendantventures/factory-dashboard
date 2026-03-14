'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BellOff, AlertCircle } from 'lucide-react';
import { notificationPanelVariants } from '@/lib/motion';
import { NotificationItem, type Notification } from './NotificationItem';

interface NotificationPanelProps {
  isOpen: boolean;
  notifications: Notification[];
  loading: boolean;
  error: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate: (link: string | null) => void;
  onRetry: () => void;
  unreadCount: number;
}

export function NotificationPanel({
  isOpen,
  notifications,
  loading,
  error,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
  onRetry,
  unreadCount,
}: NotificationPanelProps) {
  const shouldReduceMotion = useReducedMotion();

  const variants = shouldReduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } }
    : notificationPanelVariants;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="notification-panel"
          data-testid="notification-panel"
          role="region"
          aria-label="Notifications panel"
          aria-live="polite"
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 'min(360px, calc(100vw - 32px))',
            maxHeight: '480px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden',
            zIndex: 50,
          }}
        >
          {/* Header */}
          <div
            data-testid="notification-panel-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              height: '48px',
            }}
          >
            <span
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                data-testid="notification-mark-all"
                onClick={onMarkAllRead}
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--primary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--primary-muted)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div
            data-testid="notification-list"
            style={{
              maxHeight: '380px',
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--border) var(--surface)',
            }}
          >
            {loading && (
              <div data-testid="notification-loading">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div
                      className="animate-pulse"
                      style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--surface-alt)', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        className="animate-pulse"
                        style={{ height: '14px', width: '75%', borderRadius: '4px', background: 'var(--surface-alt)', marginBottom: '8px' }}
                      />
                      <div
                        className="animate-pulse"
                        style={{ height: '12px', width: '50%', borderRadius: '4px', background: 'var(--surface-alt)' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && error && (
              <div
                style={{ padding: '32px 24px', textAlign: 'center' }}
              >
                <AlertCircle style={{ width: '32px', height: '32px', color: 'var(--error)', margin: '0 auto 12px' }} />
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Couldn't load notifications
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Check your connection and try again.
                </div>
                <button
                  onClick={onRetry}
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--primary)',
                    background: 'none',
                    border: '1px solid var(--primary)',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <div
                data-testid="notification-empty"
                style={{ padding: '32px 24px', textAlign: 'center' }}
              >
                <BellOff style={{ width: '32px', height: '32px', color: 'var(--text-muted)', margin: '0 auto 12px' }} />
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  No notifications
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  You're all caught up. Notifications will appear here when there's pipeline activity.
                </div>
              </div>
            )}

            {!loading && !error && notifications.map((n, i) => (
              <NotificationItem
                key={n.id}
                notification={n}
                index={i}
                onMarkRead={onMarkRead}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
