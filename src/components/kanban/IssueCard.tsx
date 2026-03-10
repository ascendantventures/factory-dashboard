import Link from 'next/link';
import { Clock, User } from 'lucide-react';
import { DashIssue } from '@/types';
import { COMPLEXITY_COLORS, COMPLEXITY_LABELS } from '@/lib/constants';
import { Badge } from '@/components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';

interface IssueCardProps {
  issue: DashIssue;
}

export function IssueCard({ issue }: IssueCardProps) {
  const timeInStage = issue.updated_at
    ? formatDistanceToNow(new Date(issue.updated_at), { addSuffix: false })
    : null;

  const complexityColor = issue.complexity
    ? COMPLEXITY_COLORS[issue.complexity] ?? '#A1A1AA'
    : null;
  const complexityLabel = issue.complexity
    ? COMPLEXITY_LABELS[issue.complexity] ?? issue.complexity.toUpperCase()
    : null;

  const repoShort = issue.repo.split('/')[1] ?? issue.repo;

  return (
    <Link href={`/dashboard/issues/${issue.issue_number}?repo=${encodeURIComponent(issue.repo)}`}>
      <div
        className="rounded-lg p-3 border cursor-pointer transition-colors hover:border-opacity-80 space-y-2"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <span
            className="text-xs font-mono"
            style={{ color: 'var(--text-muted)' }}
          >
            #{issue.issue_number}
          </span>
          {complexityLabel && complexityColor && (
            <Badge label={complexityLabel} color={complexityColor} />
          )}
        </div>

        {/* Title */}
        <p
          className="text-sm font-medium leading-snug line-clamp-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {issue.title}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            {repoShort}
          </span>
          <div className="flex items-center gap-3">
            {issue.author && (
              <div className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <User className="w-3 h-3" />
                <span className="text-xs">{issue.author}</span>
              </div>
            )}
            {timeInStage && (
              <div className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <Clock className="w-3 h-3" />
                <span className="text-xs">{timeInStage}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
