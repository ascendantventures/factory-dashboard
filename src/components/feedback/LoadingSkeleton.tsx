type SkeletonVariant = 'card' | 'row' | 'stat' | 'kanban-column';

interface LoadingSkeletonProps {
  variant?: SkeletonVariant;
  count?: number;
}

function SkeletonCard() {
  return (
    <div
      className="rounded-xl border p-5 animate-pulse"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="h-4 rounded mb-3" style={{ background: 'var(--surface-alt)', width: '60%' }} />
      <div className="h-8 rounded mb-2" style={{ background: 'var(--surface-alt)', width: '40%' }} />
      <div className="h-3 rounded" style={{ background: 'var(--surface-alt)', width: '80%' }} />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 border-b animate-pulse"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: 'var(--surface-alt)' }} />
      <div className="flex-1 space-y-2">
        <div className="h-3 rounded" style={{ background: 'var(--surface-alt)', width: '50%' }} />
        <div className="h-2.5 rounded" style={{ background: 'var(--surface-alt)', width: '70%' }} />
      </div>
      <div className="h-3 rounded w-16" style={{ background: 'var(--surface-alt)' }} />
    </div>
  );
}

function SkeletonStat() {
  return (
    <div
      className="rounded-xl border p-5 animate-pulse"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="h-3 rounded mb-3" style={{ background: 'var(--surface-alt)', width: '50%' }} />
      <div className="h-9 rounded" style={{ background: 'var(--surface-alt)', width: '35%' }} />
    </div>
  );
}

function SkeletonKanbanColumn() {
  return (
    <div
      className="rounded-xl border p-4 animate-pulse min-w-[280px]"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="h-4 rounded mb-4" style={{ background: 'var(--surface-alt)', width: '55%' }} />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg p-3"
            style={{ background: 'var(--surface-alt)' }}
          >
            <div className="h-3 rounded mb-2" style={{ background: 'var(--border)', width: '80%' }} />
            <div className="h-2.5 rounded" style={{ background: 'var(--border)', width: '60%' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LoadingSkeleton({ variant = 'card', count = 1 }: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <div data-testid="skeleton">
      {variant === 'card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((i) => <SkeletonCard key={i} />)}
        </div>
      )}
      {variant === 'row' && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {items.map((i) => <SkeletonRow key={i} />)}
        </div>
      )}
      {variant === 'stat' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((i) => <SkeletonStat key={i} />)}
        </div>
      )}
      {variant === 'kanban-column' && (
        <div className="flex gap-4 overflow-x-auto">
          {items.map((i) => <SkeletonKanbanColumn key={i} />)}
        </div>
      )}
    </div>
  );
}
