import { Activity } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { EmptyState } from '@/components/feedback/EmptyState';

export const dynamic = 'force-dynamic';

interface StageTransition {
  id: string;
  issue_id: string;
  from_station: string | null;
  to_station: string;
  created_at: string;
}

export default async function ActivityPage() {
  const supabase = await createSupabaseServerClient();

  const { data: transitions } = await supabase
    .from('dash_stage_transitions')
    .select('id, issue_id, from_station, to_station, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  const events = (transitions as StageTransition[] | null) ?? [];

  if (events.length === 0) {
    return (
      <div className="px-6 py-6">
        <div className="mb-6">
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Activity
          </h1>
        </div>
        <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
          <EmptyState
            icon={Activity}
            title="No activity yet"
            description="Activity will appear here as events occur across your connected apps."
          />
        </div>
      </div>
    );
  }

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

      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-center gap-4 px-4 py-3 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--surface-alt)' }}
            >
              <Activity className="w-4 h-4" style={{ color: '#6366F1' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                Issue moved{' '}
                {event.from_station && (
                  <>
                    from{' '}
                    <span className="font-medium">{event.from_station}</span>{' '}
                  </>
                )}
                to <span className="font-medium">{event.to_station}</span>
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Issue #{event.issue_id}
              </p>
            </div>
            <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
              {new Date(event.created_at).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
