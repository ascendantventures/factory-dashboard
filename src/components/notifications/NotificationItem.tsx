'use client';

import { useRouter } from 'next/navigation';
import {
  FileText, Hammer, CheckCircle, XCircle, Rocket, Clock, AlertTriangle,
} from 'lucide-react';
import { FdNotification, NotificationType, NOTIFICATION_TYPE_COLORS } from '@/lib/notification-types';
import { formatDistanceToNow } from 'date-fns';

const TYPE_ICONS: Record<NotificationType, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  spec_ready: FileText,
  build_complete: Hammer,
  qa_passed: CheckCircle,
  qa_failed: XCircle,
  deploy_complete: Rocket,
  agent_stalled: Clock,
  pipeline_error: AlertTriangle,
};

interface NotificationItemProps {
  notification: FdNotification;
  onMarkRead: (id: string) => Promise<void>;
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const router = useRouter();
  const colors = NOTIFICATION_TYPE_COLORS[notification.type];
  const Icon = TYPE_ICONS[notification.type];

  const handleClick = async () => {
    if (!notification.read) {
      await onMarkRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  return (
    <div
      data-testid="notification-item"
      onClick={handleClick}
      className="relative flex gap-3 cursor-pointer transition-colors"
      style={{
        padding: notification.read ? '16px 20px' : '16px 20px 16px 17px',
        borderLeft: notification.read ? '3px solid transparent' : '3px solid #0D9488',
        background: notification.read ? '#FFFFFF' : '#FAFAF9',
        borderBottom: '1px solid #F0EFED',
      }}
    >
      {/* Type icon */}
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-lg"
        style={{
          width: '36px',
          height: '36px',
          background: colors.bg,
        }}
      >
        <Icon
          style={{ color: colors.icon, width: '18px', height: '18px' }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col" style={{ gap: '2px' }}>
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: '#1C1917', fontSize: '14px', lineHeight: '1.4', fontWeight: 600 }}
          >
            {notification.title}
          </p>
          <span
            className="flex-shrink-0"
            style={{ color: '#A8A29E', fontSize: '12px', lineHeight: '1.4', whiteSpace: 'nowrap', marginTop: '2px' }}
          >
            {timeAgo.replace('about ', '').replace(' ago', '')}
          </span>
        </div>
        {notification.body && (
          <p
            className="line-clamp-2"
            style={{ color: '#44403C', fontSize: '13px', lineHeight: '1.5' }}
          >
            {notification.body}
          </p>
        )}
      </div>

      {/* Unread dot */}
      {!notification.read && (
        <span
          data-testid="unread-dot"
          className="absolute top-4 right-3 w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: '#0D9488' }}
        />
      )}
    </div>
  );
}
