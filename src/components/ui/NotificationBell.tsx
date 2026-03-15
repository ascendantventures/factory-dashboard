'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Bell,
  BellOff,
  GitPullRequest,
  Tag,
  CheckCircle,
  GitCommit,
  Play,
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

interface WebhookEvent {
  id: string;
  event_type: string;
  repo: string;
  received_at: string;
}

type LucideIcon = React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string }>;

const eventConfig: Record<string, { icon: LucideIcon; color: string }> = {
  'issues.opened': { icon: GitPullRequest, color: '#3B82F6' },
  'issues.labeled': { icon: Tag, color: '#A855F7' },
  'issues.closed': { icon: CheckCircle, color: '#22C55E' },
  'push': { icon: GitCommit, color: '#F59E0B' },
  'pull_request': { icon: GitPullRequest, color: '#06B6D4' },
  'workflow_run': { icon: Play, color: '#6366F1' },
};

const defaultEventConfig = { icon: Bell, color: 'var(--text-muted)' };

function getLastRead(): string {
  if (typeof window === 'undefined') return '1970-01-01T00:00:00.000Z';
  return localStorage.getItem('notif_last_read') ?? '1970-01-01T00:00:00.000Z';
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  function computeUnread(evts: WebhookEvent[]) {
    const lastRead = getLastRead();
    return evts.filter((e) => new Date(e.received_at) > new Date(lastRead)).length;
  }

  // Initial load + realtime subscription
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase
      .from('dash_webhook_events')
      .select('id, event_type, repo, received_at')
      .order('received_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        const evts = (data ?? []) as WebhookEvent[];
        setEvents(evts);
        setUnreadCount(computeUnread(evts));
      });

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dash_webhook_events' },
        (payload) => {
          const newEvent = payload.new as WebhookEvent;
          setEvents((prev) => {
            const updated = [newEvent, ...prev].slice(0, 20);
            setUnreadCount(computeUnread(updated));
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleBellClick() {
    setOpen((prev) => !prev);
    if (!open) {
      // Mark all as read
      localStorage.setItem('notif_last_read', new Date().toISOString());
      setUnreadCount(0);
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleBellClick}
        className="flex items-center justify-center rounded-lg transition-colors"
        style={{
          width: '36px',
          height: '36px',
          color: open ? 'var(--primary)' : 'var(--text-muted)',
          background: open ? 'var(--primary-muted)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 150ms ease',
        }}
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
        onMouseEnter={(e) => {
          if (!open) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-alt)';
        }}
        onMouseLeave={(e) => {
          if (!open) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        }}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span
            className="absolute flex items-center justify-center"
            style={{
              top: '4px',
              right: '4px',
              minWidth: '16px',
              height: '16px',
              padding: '0 4px',
              background: 'var(--error)',
              border: '2px solid var(--background)',
              borderRadius: '9999px',
              fontSize: '10px',
              fontWeight: 600,
              color: 'white',
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          data-testid="notification-panel"
          role="menu"
          className="absolute"
          style={{
            top: 'calc(100% + 8px)',
            right: 0,
            width: '320px',
            maxHeight: '400px',
            overflowY: 'auto',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 50,
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between"
            style={{
              height: '44px',
              padding: '0 16px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <span
              style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}
            >
              Notifications
            </span>
          </div>

          {/* Events list */}
          {events.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center"
              style={{ padding: '48px 16px' }}
            >
              <BellOff className="w-8 h-8" style={{ color: 'var(--border)' }} />
              <p
                style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px' }}
              >
                No recent events
              </p>
            </div>
          ) : (
            events.map((event, i) => {
              const cfg = eventConfig[event.event_type] ?? defaultEventConfig;
              const IconComp = cfg.icon;
              return (
                <div
                  key={event.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: i < events.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'default',
                    transition: 'background 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-alt)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center rounded-lg flex-shrink-0"
                      style={{
                        width: '32px',
                        height: '32px',
                        background: `${cfg.color}26`,
                      }}
                    >
                      <IconComp
                        className="w-3.5 h-3.5"
                        style={{ color: cfg.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="truncate"
                        style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {event.event_type}
                      </p>
                      <p
                        className="truncate"
                        style={{ fontSize: '12px', color: 'var(--text-muted)' }}
                      >
                        {event.repo}
                      </p>
                    </div>
                    <span
                      className="flex-shrink-0"
                      style={{ fontSize: '12px', color: 'var(--text-muted)' }}
                    >
                      {formatDistanceToNow(new Date(event.received_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
