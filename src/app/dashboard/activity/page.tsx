import { ActivityFeed } from '@/components/activity/ActivityFeed';

export const dynamic = 'force-dynamic';

export default function ActivityPage() {
  return (
    <div className="px-6 py-6 max-w-3xl">
      <div className="mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          Activity
        </h1>
      </div>
      <ActivityFeed />
    </div>
  );
}
