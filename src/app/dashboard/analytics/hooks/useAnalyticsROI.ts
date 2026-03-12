'use client';

import { useState, useEffect } from 'react';

export interface ROIData {
  cost_per_issue: number;
  avg_time_to_deploy_hours: number;
  qa_first_try_rate: number;
  issues_completed: number;
  issues_failed_qa: number;
  estimated_manual_hours: number;
  pipeline_hours: number;
}

export function useAnalyticsROI(from: string, to: string, repo: string) {
  const [data, setData] = useState<ROIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ from, to });
    if (repo) params.set('repo', repo);
    fetch(`/api/analytics/roi?${params}`)
      .then(r => r.json())
      .then(d => { setData(d); setError(null); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [from, to, repo]);

  return { data, loading, error };
}
