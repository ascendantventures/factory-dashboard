'use client';

import { motion } from 'framer-motion';
import {
  FileText,
  Hammer,
  CheckCircle,
  XCircle,
  Rocket,
  AlertTriangle,
  AlertOctagon,
} from 'lucide-react';
import { notificationItemVariants } from '@/lib/motion';
import { useReducedMotion } from 'framer-motion';

export interface Notification {
  id: string;
  type: 'spec_ready' | 'build_complete' | 'qa_passed' | 'qa_failed' | 'deploy_complete' | 'agent_stalled' | 'pipeline_error';
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

const TYPE_CONFIG: Record<Notification['type'], { icon: React.ElementType; color: string }> = {
  spec_ready:       { icon: FileText,      color: 'var(--notif-spec-ready)' },
  build_complete:   { icon: Hammer,        color: 'var(--notif-build-complete)' },
  qa_passed:        { icon: CheckCircle,   color: 'var(--notif-qa-passed)' },
  qa_failed:        { icon: XCircle,       color: 'var(--notif-qa-failed)' },
  deploy_complete:  { icon: Rocket,        color: 'var(--notif-deploy-complete)' },
  agent_stalled:    { icon: AlertTriangle, color: 'var(--notif-agent-stalled)' },
  pipeline_error:   { icon: AlertOctagon,  color: 'var(--notif-pipeline-error)' },
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface NotificationItemProps {
  notification: Notification;
  index: number;
  onMarkRead: (id: string) => void;
  onNavigate: (link: string | null) => void;
}

export function NotificationItem({ notification, index, onMarkRead, onNavigate }: NotificationItemProps) {
  const shouldReduceMotion = useReducedMotion();
  const config = TYPE_CONFIG[notification.type];
  const Icon = config.icon;

  const variants = shouldReduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : notificationItemVariants;

  function handleClick() {
    if (!notification.read) {
      onMarkRead(notification.id);
    }
    onNavigate(notification.link);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }

  return (
    <motion.div
      data-testid="notification-item"
      data-unread={!notification.read}
      className="notification-item"
      variants={variants}
      initial="hidden"
      animate="visible"
      custom={index}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={{
        display: 'flex',
        gap: '12px',
        padding: '12px 16px',
        paddingLeft: !notification.read ? '13px' : '16px',
        borderBottom: '1px solid var(--border-subtle)',
        cursor: 'pointer',
        transition: 'background 150ms ease',
        position: 'relative',
        borderLeft: !notification.read ? `3px solid ${config.color}` : '3px solid transparent',
        outline: 'none',
      }}
      whileHover={{ backgroundColor: 'var(--surface-alt)' }}
      onFocus={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'inset 0 0 0 2px var(--primary)'; }}
      onBlur={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      {/* Icon */}
      <div
        style={{
          flexShrink: 0,
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          background: 'var(--surface-alt)',
        }}
      >
        <Icon style={{ width: '16px', height: '16px', color: config.color }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: notification.read ? 400 : 600,
            color: 'var(--text-primary)',
            lineHeight: '1.4',
            marginBottom: '2px',
          }}
        >
          {notification.title}
        </div>
        {notification.body && (
          <div
            style={{
              fontSize: '13px',
              fontWeight: 400,
              color: 'var(--text-secondary)',
              lineHeight: '1.5',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {notification.body}
          </div>
        )}
        <div
          style={{
            fontSize: '12px',
            fontWeight: 400,
            color: 'var(--text-muted)',
            marginTop: '4px',
          }}
        >
          {formatRelativeTime(notification.created_at)}
        </div>
      </div>
    </motion.div>
  );
}
