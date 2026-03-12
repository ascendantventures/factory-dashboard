import AppGrid from '@/components/apps/AppGrid';

function SkeletonCard() {
  return (
    <div
      data-testid="skeleton"
      className="animate-pulse rounded-xl border p-5"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="h-4 rounded" style={{ background: 'var(--surface-alt)', width: '55%' }} />
        <div className="h-5 w-14 rounded-full" style={{ background: 'var(--surface-alt)' }} />
      </div>
      <div className="h-3 rounded mb-4" style={{ background: 'var(--surface-alt)', width: '70%' }} />
      <div className="h-3 rounded mb-3" style={{ background: 'var(--surface-alt)', width: '40%' }} />
      <div className="h-3 rounded mb-3" style={{ background: 'var(--surface-alt)', width: '60%' }} />
      <div className="flex gap-2">
        <div className="h-5 w-16 rounded" style={{ background: 'var(--surface-alt)' }} />
        <div className="h-5 w-12 rounded" style={{ background: 'var(--surface-alt)' }} />
      </div>
    </div>
  );
}

export default function AppsLoading() {
  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <div className="h-8 rounded mb-2" style={{ background: 'var(--surface-alt)', width: '120px' }} />
        <div className="h-4 rounded" style={{ background: 'var(--surface-alt)', width: '240px' }} />
      </div>
      <AppGrid>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </AppGrid>
    </div>
  );
}
