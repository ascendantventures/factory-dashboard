'use client';

import { useState } from 'react';
import { DashIssue } from '@/types';
import { STATIONS, STATION_LABELS, Station } from '@/lib/constants';
import { Loader2, GitBranch } from 'lucide-react';

interface StageOverrideProps {
  issue: DashIssue;
}

export function StageOverride({ issue }: StageOverrideProps) {
  const [station, setStation] = useState<Station | ''>(issue.station ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleOverride() {
    if (!station || station === issue.station) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(
        `/api/issues/${issue.issue_number}/station?repo=${encodeURIComponent(issue.repo)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ station }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to update station');
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex-shrink-0 rounded-lg border p-4 space-y-3 w-52"
      style={{ background: 'var(--surface-alt)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          Stage Override
        </span>
      </div>
      <select
        value={station}
        onChange={(e) => setStation(e.target.value as Station)}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
        }}
      >
        <option value="">Select stage...</option>
        {STATIONS.map((s) => (
          <option key={s} value={s}>
            {STATION_LABELS[s]}
          </option>
        ))}
      </select>
      <button
        onClick={handleOverride}
        disabled={loading || !station || station === issue.station}
        className="w-full py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-opacity disabled:opacity-40"
        style={{ background: 'var(--primary)', color: '#fff' }}
      >
        {loading && <Loader2 className="w-3 h-3 animate-spin" />}
        {success ? 'Updated!' : 'Apply'}
      </button>
      {error && (
        <p className="text-xs" style={{ color: 'var(--error)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
