import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function EmptyState({ icon: Icon, title, description, ctaLabel, ctaHref }: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center justify-center text-center px-6 py-16 mx-auto"
      style={{ maxWidth: '400px' }}
    >
      <div className="mb-4">
        <Icon
          style={{
            width: '48px',
            height: '48px',
            color: 'var(--border)',
          }}
          strokeWidth={1.5}
        />
      </div>
      <h2
        className="mb-2"
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}
      >
        {title}
      </h2>
      <p
        className="mb-6"
        style={{
          fontSize: '14px',
          fontWeight: 400,
          color: 'var(--text-muted)',
          lineHeight: '1.6',
        }}
      >
        {description}
      </p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-colors hover:opacity-90"
          style={{
            background: '#6366F1',
            color: '#fff',
          }}
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
