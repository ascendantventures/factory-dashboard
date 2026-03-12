'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { FdNotification } from '@/lib/notification-types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface UseNotificationsReturn {
  notifications: FdNotification[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<FdNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const wsFailedRef = useRef(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=20');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unread_count ?? 0);
    } catch {
      // silently fail on poll
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await fetchNotifications();
      if (mounted) setLoading(false);
    };
    init();

    // Supabase Realtime subscription
    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      const channel = supabase
        .channel(`fd_notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'fd_notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (!mounted) return;
            const newNotif = payload.new as FdNotification;
            setNotifications((prev) => [newNotif, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'fd_notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (!mounted) return;
            const updated = payload.new as FdNotification;
            setNotifications((prev) =>
              prev.map((n) => (n.id === updated.id ? updated : n))
            );
            // Recount unread from state
            setNotifications((prev) => {
              const unread = prev.filter((n) => !n.read).length;
              setUnreadCount(unread);
              return prev;
            });
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            wsFailedRef.current = true;
            // Fallback: poll every 30s
            if (!pollingRef.current) {
              pollingRef.current = setInterval(fetchNotifications, 30_000);
            }
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    };

    let cleanup: (() => void) | undefined;
    setupRealtime().then((fn) => { cleanup = fn; });

    return () => {
      mounted = false;
      cleanup?.();
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [fetchNotifications]);

  const markRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
  }, []);

  const markAllRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    await fetch('/api/notifications/read-all', { method: 'POST' });
  }, []);

  return { notifications, unreadCount, loading, markRead, markAllRead };
}
