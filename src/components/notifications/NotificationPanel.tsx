'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Inbox } from 'lucide-react';
import Link from 'next/link';
import { FdNotification } from '@/lib/notification-types';
import { NotificationItem } from './NotificationItem';
import {
  panelVariants, mobilePanelVariants, staggerContainer,
  notificationItemVariants, reducedMotionVariants,
} from '@/lib/motion';

interface NotificationPanelProps {
  isOpen: boolean;
  notifications: FdNotification[];
  loading: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
}

export function NotificationPanel({
  isOpen, notifications, loading, onClose, onMarkRead, onMarkAllRead,
}: NotificationPanelProps) {
  const shouldReduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  const activeVariants = shouldReduceMotion
    ? reducedMotionVariants
    : isMobile ? mobilePanelVariants : panelVariants;

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Use setTimeout to avoid closing immediately on the same click that opened
    const tid = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => {
      clearTimeout(tid);
      document.removeEventListener('mousedown', handler);
    };
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 sm:hidden"
            style={{ zIndex: 49 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.div
            ref={panelRef}
            data-testid="notification-panel"
            variants={activeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="
              fixed inset-0 sm:absolute sm:inset-auto sm:top-full sm:right-0
              flex flex-col
              sm:mt-2 sm:w-[380px]
            "
            style={{
              background: '#FFFFFF',
              border: '1px solid #E7E5E4',
              borderRadius: 'clamp(0px, calc((100vw - 639px) * 9999), 12px)',
              boxShadow: '0 10px 40px -8px rgba(28, 25, 23, 0.15), 0 4px 12px -2px rgba(28, 25, 23, 0.08)',
              maxHeight: 'min(100vh, 480px)',
              zIndex: 50,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between flex-shrink-0"
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #F0EFED',
                minHeight: '60px',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1C1917', fontFamily: 'var(--font-ui)' }}>
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    data-testid="mark-all-read-btn"
                    onClick={onMarkAllRead}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#0D9488',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      padding: '6px 8px',
                      borderRadius: '6px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(13, 148, 136, 0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    Mark all read
                  </button>
                )}
                {/* Mobile close button */}
                <button
                  onClick={onClose}
                  className="sm:hidden flex items-center justify-center rounded-lg transition-colors"
                  style={{
                    width: '36px', height: '36px',
                    background: 'transparent', border: 'none',
                    color: '#44403C', cursor: 'pointer',
                  }}
                  aria-label="Close notifications"
                >
                  <X style={{ width: '20px', height: '20px' }} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
              {loading ? (
                <SkeletonList />
              ) : notifications.length === 0 ? (
                <EmptyState />
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      variants={notificationItemVariants}
                    >
                      <NotificationItem
                        notification={notification}
                        onMarkRead={onMarkRead}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div
              className="flex-shrink-0 text-center"
              style={{ padding: '12px 20px', borderTop: '1px solid #F0EFED' }}
            >
              <Link
                href="/dashboard/settings/notifications"
                onClick={onClose}
                style={{
                  color: '#0D9488',
                  fontSize: '13px',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                Notification settings
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{ padding: '48px 24px' }}
    >
      <Inbox style={{ width: '48px', height: '48px', color: '#A8A29E', marginBottom: '16px' }} />
      <p style={{ fontSize: '16px', fontWeight: 600, color: '#1C1917', marginBottom: '4px' }}>
        All caught up
      </p>
      <p style={{ fontSize: '14px', color: '#A8A29E' }}>
        You&apos;ll see pipeline updates here as they happen.
      </p>
    </div>
  );
}

function SkeletonList() {
  return (
    <div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex gap-3"
          style={{ padding: '16px 20px', borderBottom: '1px solid #F0EFED' }}
        >
          <div
            style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: 'linear-gradient(90deg, #F5F5F4 0%, #FAFAF9 50%, #F5F5F4 100%)',
              backgroundSize: '200% 100%',
              animation: 'skeleton-pulse 1.5s ease-in-out infinite',
              flexShrink: 0,
            }}
          />
          <div className="flex-1 flex flex-col gap-2">
            <div
              style={{
                height: '14px', borderRadius: '4px', width: '70%',
                background: 'linear-gradient(90deg, #F5F5F4 0%, #FAFAF9 50%, #F5F5F4 100%)',
                backgroundSize: '200% 100%',
                animation: 'skeleton-pulse 1.5s ease-in-out infinite',
              }}
            />
            <div
              style={{
                height: '12px', borderRadius: '4px', width: '90%',
                background: 'linear-gradient(90deg, #F5F5F4 0%, #FAFAF9 50%, #F5F5F4 100%)',
                backgroundSize: '200% 100%',
                animation: 'skeleton-pulse 1.5s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
