'use client';

import { useState, useEffect } from 'react';

export interface TrendsData {
  series: { date: string; cost_usd: number; issue_count: number }[];
}

export type Granularity = 'day' | 'week' | 'month';

export function useAnalyticsTrends(from: string, to: string, repo: string, granularity: Granularity) {
  const [data, setData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ from, to, granularity });
    if (repo) params.set('repo', repo);
    fetch(`/api/analytics/trends?${params}`)
      .then(r => r.json())
      .then(d => { setData(d); setError(null); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [from, to, repo, granularity]);

  return { data, loading, error };
}
