import { Grid3X3 } from 'lucide-react';
import { EmptyState } from '@/components/feedback/EmptyState';

export default function AppsPage() {
  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          Apps
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Connected applications and integrations
        </p>
      </div>

      <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
        <EmptyState
          icon={Grid3X3}
          title="No apps connected"
          description="Connect your first application to start tracking activity and managing issues across your tools."
          ctaLabel="Connect App"
          ctaHref="/dashboard/settings"
        />
      </div>
    </div>
  );
}
