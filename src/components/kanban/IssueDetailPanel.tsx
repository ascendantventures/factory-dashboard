'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, ExternalLink, GitCommit, Activity, Play, CheckCircle, XCircle, Loader2, Eye } from 'lucide-react';
import { DashIssue, DashStageTransition, DashAgentRun } from '@/types';
import { formatCost } from '@/lib/enrichment';
import { motion, AnimatePresence } from 'framer-motion';
import { LogViewer } from '@/components/agents/LogViewer';

interface IssueDetail {
  issue: DashIssue;
  transitions: DashStageTransition[];
  runs: DashAgentRun[];
}

interface IssueDetailPanelProps {
  issue: DashIssue | null;
  onClose: () => void;
}

function formatTimestamp(ts: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(ts));
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function RunStatusBadge({ status }: { status: string | null }) {
  const s = status ?? 'unknown';
  let bg = '#27272A', color = '#A1A1AA', border = '#3F3F46';
  let Icon = Play;
  if (s === 'running') { bg = 'rgba(59,130,246,0.2)'; color = '#60A5FA'; border = 'rgba(59,130,246,0.4)'; Icon = Play; }
  else if (s === 'completed') { bg = 'rgba(22,101,52,0.8)'; color = '#22C55E'; border = 'rgba(34,197,94,0.3)'; Icon = CheckCircle; }
  else if (s === 'failed' || s === 'timeout') { bg = 'rgba(153,27,27,0.8)'; color = '#EF4444'; border = 'rgba(239,68,68,0.3)'; Icon = XCircle; }
  return (
    <span style={{ background: bg, color, border: `1px solid ${border}`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600, fontFamily: 'Inter, sans-serif', textTransform: 'capitalize', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <Icon style={{ width: 10, height: 10 }} />
      {s}
    </span>
  );
}

export function IssueDetailPanel({ issue, onClose }: IssueDetailPanelProps) {
  const [detail, setDetail] = useState<IssueDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeLogRun, setActiveLogRun] = useState<DashAgentRun | null>(null);

  const fetchDetail = useCallback(async (iss: DashIssue) => {
    setLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/issues/${iss.issue_number}?repo=${encodeURIComponent(iss.repo)}`);
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (issue) fetchDetail(issue);
    else setDetail(null);
  }, [issue, fetchDetail]);

  // ESC key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (issue) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [issue, onClose]);

  // Compute cost breakdown by station
  const costByStation = detail?.runs.reduce<Record<string, number>>((acc, run) => {
    const station = run.station ?? 'unknown';
    acc[station] = (acc[station] ?? 0) + (run.estimated_cost_usd ?? 0);
    return acc;
  }, {}) ?? {};
  const totalCost = Object.values(costByStation).reduce((a, b) => a + b, 0);

  return (
    <AnimatePresence>
      {issue && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            data-testid="panel-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 49,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            data-testid="issue-detail-panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              position: 'fixed', right: 0, top: 0, height: '100vh',
              width: '100%', maxWidth: 560,
              background: '#18181B',
              borderLeft: '1px solid #3F3F46',
              boxShadow: '-10px 0 40px rgba(0,0,0,0.5)',
              padding: 24, overflowY: 'auto', zIndex: 50,
              fontFamily: 'Inter, sans-serif',
            }}
            className="custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <h2
                data-testid="detail-title"
                style={{ fontSize: 20, fontWeight: 600, color: '#FAFAFA', lineHeight: 1.4, maxWidth: 'calc(100% - 48px)' }}
              >
                {issue.title}
              </h2>
              <button
                data-testid="close-panel"
                onClick={onClose}
                style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: 6, color: '#71717A', cursor: 'pointer', flexShrink: 0, marginLeft: 8 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#27272A'; (e.currentTarget as HTMLButtonElement).style.color = '#FAFAFA'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#71717A'; }}
                aria-label="Close panel"
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#6366F1', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                #{issue.issue_number}
              </span>
              {issue.complexity && (
                <ComplexityChip complexity={issue.complexity} />
              )}
              {issue.github_issue_url && (
                <a
                  href={issue.github_issue_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#3B82F6', textDecoration: 'none' }}
                >
                  <ExternalLink style={{ width: 12, height: 12 }} />
                  GitHub
                </a>
              )}
            </div>

            {/* Description */}
            {issue.body && (
              <div style={{ marginBottom: 24 }}>
                <SectionTitle>Description</SectionTitle>
                <p style={{ fontSize: 14, color: '#A1A1AA', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {issue.body.slice(0, 500)}{issue.body.length > 500 ? '…' : ''}
                </p>
              </div>
            )}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, color: '#71717A' }}>
                <Loader2 style={{ width: 24, height: 24, animation: 'spin 1s linear infinite' }} />
              </div>
            )}

            {detail && !loading && (
              <>
                {/* Stage Transitions */}
                <div style={{ marginBottom: 24 }}>
                  <SectionTitle>Stage Timeline</SectionTitle>
                  <div data-testid="stage-timeline">
                    {detail.transitions.length === 0 ? (
                      <EmptyState icon={<GitCommit style={{ width: 24, height: 24 }} />} text="No stage transitions yet" />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {detail.transitions.map((t, i) => (
                          <div key={t.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <div style={{
                              width: 10, height: 10, borderRadius: '50%',
                              background: i === detail.transitions.length - 1 ? '#22C55E' : '#3F3F46',
                              border: '2px solid #27272A', flexShrink: 0, marginTop: 2,
                            }} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500, color: '#FAFAFA' }}>
                                {t.from_station ? `${t.from_station} → ${t.to_station}` : t.to_station}
                              </div>
                              <div style={{ fontSize: 12, color: '#71717A', marginTop: 2 }}>
                                {formatTimestamp(t.transitioned_at)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Agent Runs */}
                <div style={{ marginBottom: 24 }}>
                  <SectionTitle>Agent Runs</SectionTitle>
                  <div data-testid="agent-run-list">
                    {detail.runs.length === 0 ? (
                      <EmptyState icon={<Activity style={{ width: 24, height: 24 }} />} text="No agent runs recorded" />
                    ) : (
                      <div style={{ borderRadius: 6, overflow: 'hidden', border: '1px solid #27272A' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 70px 70px 48px', padding: '10px 12px', background: '#27272A', fontSize: 11, fontWeight: 600, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif' }}>
                          <div>Station</div>
                          <div>Status</div>
                          <div>Cost</div>
                          <div>Duration</div>
                          <div>Logs</div>
                        </div>
                        {detail.runs.map((run, i) => (
                          <div key={run.id} style={{
                            display: 'grid', gridTemplateColumns: '1fr 80px 70px 70px 48px',
                            padding: '12px', fontSize: 13,
                            background: run.run_status === 'running' ? 'rgba(26,29,37,1)' : (i % 2 === 1 ? 'rgba(39,39,42,0.5)' : '#18181B'),
                            borderBottom: i < detail.runs.length - 1 ? '1px solid #27272A' : 'none',
                          }}>
                            <div style={{ color: '#FAFAFA', textTransform: 'capitalize' }}>{run.station ?? '—'}</div>
                            <div><RunStatusBadge status={run.run_status} /></div>
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', color: '#A1A1AA' }}>
                              {formatCost(run.estimated_cost_usd ?? 0)}
                            </div>
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', color: '#71717A' }}>
                              {formatDuration(run.duration_seconds)}
                            </div>
                            <div>
                              <button
                                data-testid="view-logs-btn"
                                onClick={() => setActiveLogRun(activeLogRun?.id === run.id ? null : run)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: activeLogRun?.id === run.id ? '#E5A830' : '#6B7280',
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '2px 4px',
                                  borderRadius: 4,
                                }}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.color = '#E5A830';
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.color = activeLogRun?.id === run.id ? '#E5A830' : '#6B7280';
                                }}
                                title="View logs"
                                aria-label="View logs for this run"
                              >
                                <Eye style={{ width: 14, height: 14 }} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Inline LogViewer */}
                  {activeLogRun && (
                    <div style={{ marginTop: 12 }}>
                      <LogViewer
                        run={{
                          id: activeLogRun.id,
                          station: activeLogRun.station,
                          model: activeLogRun.model,
                          pid: null,
                          started_at: activeLogRun.started_at,
                          estimated_cost_usd: activeLogRun.estimated_cost_usd,
                          run_status: activeLogRun.run_status ?? 'completed',
                          exit_code: activeLogRun.exit_code,
                        }}
                        onClose={() => setActiveLogRun(null)}
                        mode="embedded"
                      />
                    </div>
                  )}
                </div>

                {/* Cost Breakdown */}
                <div style={{ marginBottom: 24 }}>
                  <SectionTitle>Cost Breakdown</SectionTitle>
                  <div data-testid="cost-breakdown">
                    {Object.keys(costByStation).length === 0 ? (
                      <p style={{ fontSize: 13, color: '#71717A', textAlign: 'center', padding: '16px 0' }}>No cost data</p>
                    ) : (
                      <>
                        {Object.entries(costByStation).map(([station, cost]) => {
                          const pct = totalCost > 0 ? (cost / totalCost) * 100 : 0;
                          return (
                            <div key={station} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                              <span style={{ width: 80, fontSize: 13, fontWeight: 500, color: '#A1A1AA', textAlign: 'right', textTransform: 'capitalize', flexShrink: 0 }}>
                                {station}
                              </span>
                              <div style={{ flex: 1, height: 24, background: '#27272A', borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: '#3B82F6', borderRadius: 4 }} />
                              </div>
                              <span style={{ width: 60, fontSize: 13, fontWeight: 600, color: '#FAFAFA', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
                                {formatCost(cost)}
                              </span>
                            </div>
                          );
                        })}
                        <div style={{ borderTop: '1px solid #3F3F46', paddingTop: 12, marginTop: 12, textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#FAFAFA' }}>
                          Total: {formatCost(totalCost)}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
      {children}
    </div>
  );
}

function ComplexityChip({ complexity }: { complexity: string }) {
  const c = complexity.toLowerCase();
  let bg = '#27272A', color = '#A1A1AA', border = '#3F3F46';
  if (c === 'simple') { bg = 'rgba(22,101,52,0.8)'; color = '#22C55E'; border = 'rgba(34,197,94,0.3)'; }
  else if (c === 'medium') { bg = 'rgba(133,77,14,0.8)'; color = '#EAB308'; border = 'rgba(234,179,8,0.3)'; }
  else if (c === 'complex') { bg = 'rgba(153,27,27,0.8)'; color = '#EF4444'; border = 'rgba(239,68,68,0.3)'; }
  return (
    <span style={{ background: bg, color, border: `1px solid ${border}`, borderRadius: 4, padding: '3px 8px', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
      {complexity}
    </span>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, color: '#52525B', textAlign: 'center' }}>
      {icon}
      <span style={{ fontSize: 13, marginTop: 8, fontFamily: 'Inter, sans-serif' }}>{text}</span>
    </div>
  );
}
