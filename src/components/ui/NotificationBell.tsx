'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { NotificationPanel } from './NotificationPanel';
import type { Notification } from './NotificationItem';

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [badgeBounce, setBadgeBounce] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    setError(false);
    try {
      const res = await fetch('/api/notifications');
      if (res.status === 401) return;
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unread_count ?? 0);
    } catch {
      setError(true);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    setLoading(true);
    fetchNotifications().finally(() => setLoading(false));
  }, [fetchNotifications]);

  // Supabase Realtime subscription with 30s polling fallback
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let realtimeWorking = false;

    const channel = supabase
      .channel('dash_notifications_bell')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dash_notifications' },
        () => {
          realtimeWorking = true;
          fetchNotifications();
          setBadgeBounce(true);
          setTimeout(() => setBadgeBounce(false), 500);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'dash_notifications' },
        () => {
          realtimeWorking = true;
          fetchNotifications();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          realtimeWorking = true;
        }
      });

    // Start polling as fallback; cancel if realtime kicks in
    pollingRef.current = setInterval(() => {
      if (!realtimeWorking) {
        fetchNotifications();
      }
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchNotifications]);

  // Outside click to close
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  function togglePanel() {
    setIsOpen(prev => !prev);
  }

  async function handleMarkRead(id: string) {
    // Optimistic UI
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    } catch {
      // Re-fetch to reconcile
      fetchNotifications();
    }
  }

  async function handleMarkAllRead() {
    // Optimistic UI
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
    } catch {
      fetchNotifications();
    }
  }

  function handleNavigate(link: string | null) {
    setIsOpen(false);
    if (link) router.push(link);
  }

  const displayCount = unreadCount > 99 ? '99+' : unreadCount;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        data-testid="notification-bell"
        data-open={isOpen}
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls="notification-panel"
        onClick={togglePanel}
        style={{
          position: 'relative',
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          background: isOpen ? 'var(--primary-muted)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 150ms ease',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'var(--surface-alt)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'transparent';
        }}
        onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.96)'; }}
        onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
      >
        <Bell
          style={{
            width: '20px',
            height: '20px',
            color: isOpen ? 'var(--text-primary)' : 'var(--text-muted)',
            transition: 'color 150ms ease',
          }}
        />
        {unreadCount > 0 && (
          <span
            data-testid="notification-badge"
            className={badgeBounce ? 'animate-badge-bounce' : ''}
            aria-label={`${unreadCount} unread notifications`}
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              minWidth: '18px',
              height: '18px',
              padding: '0 5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--error)',
              color: 'white',
              fontSize: '11px',
              fontWeight: 600,
              lineHeight: 1,
              borderRadius: '9px',
              border: '2px solid var(--background)',
              pointerEvents: 'none',
            }}
          >
            {displayCount}
          </span>
        )}
      </button>

      <NotificationPanel
        isOpen={isOpen}
        notifications={notifications}
        loading={loading}
        error={error}
        unreadCount={unreadCount}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        onNavigate={handleNavigate}
        onRetry={() => {
          setLoading(true);
          fetchNotifications().finally(() => setLoading(false));
        }}
      />
    </div>
  );
}
