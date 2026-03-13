'use client';

import { useState, useEffect } from 'react';

export interface CostsData {
  totals: {
    all_time: number;
    this_month: number;
    this_week: number;
    today: number;
  };
  by_app: { repo: string; cost_usd: number; issue_count: number }[];
  by_station: { station: string; cost_usd: number; count: number }[];
  by_model: { model: string; cost_usd: number; count: number }[];
}

export function useAnalyticsCosts(from: string, to: string, repo: string) {
  const [data, setData] = useState<CostsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ from, to });
    if (repo) params.set('repo', repo);
    fetch(`/api/analytics/costs?${params}`)
      .then(r => r.json())
      .then(d => { setData(d); setError(null); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [from, to, repo]);

  return { data, loading, error };
}
