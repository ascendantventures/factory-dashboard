/**
 * Vercel Analytics Query API client — server-only.
 * VERCEL_ANALYTICS_TOKEN is never exposed to the client.
 */

export interface AnalyticsMetrics {
  pageviews: number;
  unique_visitors: number;
  p75_latency_ms: number;
  error_rate_pct: number;
}

const ANALYTICS_API_BASE = 'https://vercel.com/api/web/insights';

/**
 * Fetch analytics metrics from Vercel Analytics API for a given project.
 * period: '7d' | '30d'
 */
export async function fetchVercelAnalytics(
  projectId: string,
  period: '7d' | '30d' = '7d',
  teamId?: string
): Promise<AnalyticsMetrics> {
  const token = process.env.VERCEL_ANALYTICS_TOKEN;
  if (!token) {
    throw new Error('VERCEL_ANALYTICS_TOKEN is not configured');
  }

  const params = new URLSearchParams({
    projectId,
    period,
    ...(teamId ? { teamId } : {}),
  });

  // Fetch page views
  const [pageviewsRes, webVitalsRes] = await Promise.allSettled([
    fetch(`${ANALYTICS_API_BASE}/pageviews?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch(`${ANALYTICS_API_BASE}/stats?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ]);

  let pageviews = 0;
  let unique_visitors = 0;
  let p75_latency_ms = 0;
  let error_rate_pct = 0;

  if (pageviewsRes.status === 'fulfilled' && pageviewsRes.value.ok) {
    const data = await pageviewsRes.value.json();
    pageviews = data?.total ?? data?.data?.total ?? 0;
    unique_visitors = data?.uniques ?? data?.data?.uniques ?? 0;
  }

  if (webVitalsRes.status === 'fulfilled' && webVitalsRes.value.ok) {
    const data = await webVitalsRes.value.json();
    // Vercel Analytics returns FCP/LCP/TTFB in the stats endpoint
    p75_latency_ms = data?.lcp?.p75 ?? data?.ttfb?.p75 ?? 0;
    // Error rate from 4xx/5xx counts if available
    const errors = data?.errors ?? 0;
    const total = pageviews || 1;
    error_rate_pct = Math.round((errors / total) * 1000) / 10;
  }

  return { pageviews, unique_visitors, p75_latency_ms, error_rate_pct };
}
