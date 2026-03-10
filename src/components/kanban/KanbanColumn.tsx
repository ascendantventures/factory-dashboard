import { Station, STATION_COLORS, STATION_LABELS } from '@/lib/constants';
import { DashIssue } from '@/types';
import { IssueCard } from './IssueCard';

interface KanbanColumnProps {
  station: Station;
  issues: DashIssue[];
}

export function KanbanColumn({ station, issues }: KanbanColumnProps) {
  const color = STATION_COLORS[station];
  const label = STATION_LABELS[station];

  return (
    <div
      className="flex flex-col rounded-xl border overflow-hidden"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        minWidth: '280px',
        width: '280px',
      }}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: color }}
          />
          <span
            className="text-sm font-semibold"
            style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}
          >
            {label}
          </span>
        </div>
        <span
          className="text-xs font-mono px-2 py-0.5 rounded-full"
          style={{ background: `${color}20`, color: color }}
        >
          {issues.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 160px)' }}>
        {issues.length === 0 ? (
          <div
            className="flex items-center justify-center py-8 text-sm rounded-lg border border-dashed"
            style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}
          >
            No issues
          </div>
        ) : (
          issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))
        )}
      </div>
    </div>
  );
}
