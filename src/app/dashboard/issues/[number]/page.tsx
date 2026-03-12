import { createSupabaseServerClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import { DashIssue, DashStageTransition, DashAgentRun } from '@/types';
import { STATION_COLORS, STATION_LABELS, Station } from '@/lib/constants';
import { ArrowLeft, Clock, User, GitBranch, Bot } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { IssueBody } from './IssueBody';
import { StageOverride } from './StageOverride';
import { AttachmentGallery } from '@/components/attachments/AttachmentGallery';
import { CommentThread } from './components/CommentThread';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ repo?: string }>;
}

export default async function IssueDetailPage({ params, searchParams }: PageProps) {
  const { number: issueNumberStr } = await params;
  const { repo } = await searchParams;
  const issueNumber = parseInt(issueNumberStr, 10);

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from('dash_issues')
    .select('*')
    .eq('issue_number', issueNumber);

  if (repo) {
    query = query.eq('repo', repo);
  }

  const { data: issueData } = await query.single();
  if (!issueData) notFound();

  const issue = issueData as DashIssue;

  const { data: transitions } = await supabase
    .from('dash_stage_transitions')
    .select('*')
    .eq('issue_id', issue.id)
    .order('transitioned_at', { ascending: true });

  const { data: runs } = await supabase
    .from('dash_agent_runs')
    .select('*')
    .eq('issue_id', issue.id)
    .order('started_at', { ascending: false });

  const stationColor = issue.station ? STATION_COLORS[issue.station as Station] : '#A1A1AA';
  const stationLabel = issue.station ? STATION_LABELS[issue.station as Station] : 'Unknown';

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm mb-6 transition-opacity hover:opacity-80"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Board
      </Link>

      {/* Issue header */}
      <div
        className="rounded-xl border p-6 mb-6"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <span
                className="text-sm font-mono"
                style={{ color: 'var(--text-muted)' }}
              >
                #{issue.issue_number}
              </span>
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{ background: `${stationColor}20`, color: stationColor, border: `1px solid ${stationColor}40` }}
              >
                {stationLabel}
              </span>
              {issue.issue_type && (
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: 'var(--surface-alt)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                >
                  {issue.issue_type}
                </span>
              )}
            </div>
            <h1
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}
            >
              {issue.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {issue.author && (
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span>{issue.author}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <GitBranch className="w-4 h-4" />
                <span>{issue.repo}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>Opened {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
          <StageOverride issue={issue} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main content */}
        <div className="col-span-2 space-y-6">
          {/* Issue body */}
          <div
            className="rounded-xl border p-6"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <h2
              className="text-base font-semibold mb-4"
              style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}
            >
              Description
            </h2>
            <IssueBody body={issue.body} />

            {/* Attachment gallery — below description */}
            <AttachmentGallery
              issueNumber={issueNumber}
              currentUserId={user?.id}
              isAdmin={user?.user_metadata?.role === 'admin'}
            />
          </div>

          {/* Agent runs */}
          <div
            className="rounded-xl border overflow-hidden"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div
              className="flex items-center gap-2 px-6 py-4 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <Bot className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <h2
                className="text-base font-semibold"
                style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}
              >
                Agent Runs
              </h2>
              <span
                className="ml-auto text-xs font-mono px-2 py-0.5 rounded-full"
                style={{ background: '#3B82F620', color: 'var(--primary)' }}
              >
                {runs?.length ?? 0}
              </span>
            </div>
            {(!runs || runs.length === 0) ? (
              <div className="px-6 py-8 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                No agent runs yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Station', 'Model', 'Status', 'Duration', 'Cost', 'Started'].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-medium"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(runs as DashAgentRun[]).map((run) => {
                      const statusColor =
                        run.run_status === 'success' ? 'var(--success)' :
                        run.run_status === 'error' ? 'var(--error)' :
                        run.run_status === 'running' ? 'var(--primary)' : 'var(--text-muted)';
                      return (
                        <tr
                          key={run.id}
                          style={{ borderBottom: '1px solid var(--border)' }}
                        >
                          <td className="px-4 py-3">
                            {run.station && (
                              <span style={{ color: STATION_COLORS[run.station as Station] ?? 'var(--text-secondary)' }}>
                                {STATION_LABELS[run.station as Station] ?? run.station}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {run.model ?? '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium" style={{ color: statusColor }}>
                              {run.run_status ?? '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {run.duration_seconds != null ? `${run.duration_seconds}s` : '—'}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {run.estimated_cost_usd != null ? `$${run.estimated_cost_usd.toFixed(4)}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                            {format(new Date(run.started_at), 'MMM d, HH:mm')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Stage timeline */}
        <div className="space-y-6">
          <div
            className="rounded-xl border p-5"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <h2
              className="text-base font-semibold mb-4"
              style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}
            >
              Stage Timeline
            </h2>
            {(!transitions || transitions.length === 0) ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No transitions recorded</p>
            ) : (
              <div className="space-y-3">
                {(transitions as DashStageTransition[]).map((t, idx) => {
                  const toColor = t.to_station ? STATION_COLORS[t.to_station as Station] : '#A1A1AA';
                  const toLabel = t.to_station ? STATION_LABELS[t.to_station as Station] : '?';
                  return (
                    <div key={t.id} className="relative pl-5">
                      {idx < transitions.length - 1 && (
                        <div
                          className="absolute left-[7px] top-4 bottom-0 w-px"
                          style={{ background: 'var(--border)' }}
                        />
                      )}
                      <div
                        className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2"
                        style={{ background: 'var(--surface)', borderColor: toColor }}
                      />
                      <div>
                        <p className="text-sm font-medium" style={{ color: toColor }}>
                          → {toLabel}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {format(new Date(t.transitioned_at), 'MMM d, HH:mm')}
                        </p>
                        {t.duration_seconds != null && (
                          <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                            {t.duration_seconds >= 3600
                              ? `${(t.duration_seconds / 3600).toFixed(1)}h`
                              : `${Math.round(t.duration_seconds / 60)}m`}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Labels */}
          {issue.labels && issue.labels.length > 0 && (
            <div
              className="rounded-xl border p-5"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <h2
                className="text-sm font-semibold mb-3"
                style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}
              >
                Labels
              </h2>
              <div className="flex flex-wrap gap-2">
                {issue.labels.map((label) => (
                  <span
                    key={label}
                    className="px-2 py-1 rounded text-xs"
                    style={{ background: 'var(--surface-alt)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* GitHub comment thread */}
      <div className="mt-6">
        <CommentThread issueNumber={issueNumber} />
      </div>
    </div>
  );
}
