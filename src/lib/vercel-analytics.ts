export interface AnalyticsMetrics {
  pageviews: number;
  unique_visitors: number;
  p75_latency_ms: number;
  error_rate_pct: number;
}

export interface AnalyticsCacheEntry {
  repo_full_name: string;
  cached: boolean;
  fetched_at: string;
  metrics: AnalyticsMetrics | null;
}

/**
 * Fetch analytics metrics from Vercel Analytics Query API.
 * Returns null if the token is missing or the request fails.
 */
export async function fetchVercelAnalytics(
  projectId: string,
  token: string,
  period: '7d' | '30d' = '7d',
): Promise<AnalyticsMetrics | null> {
  try {
    const now = Date.now();
    const days = period === '30d' ? 30 : 7;
    const from = new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
    const to = new Date(now).toISOString();

    // Fetch page views
    const pvRes = await fetch(
      `https://vercel.com/api/web/insights/stats/pageviews?projectId=${encodeURIComponent(projectId)}&from=${from}&to=${to}&granularity=total`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!pvRes.ok) {
      return null;
    }

    const pvData = await pvRes.json() as {
      data?: Array<{ total?: number; unique?: number }>;
    };

    const pvEntry = pvData.data?.[0];
    const pageviews = pvEntry?.total ?? 0;
    const unique_visitors = pvEntry?.unique ?? 0;

    // Fetch web vitals (latency)
    const vitalsRes = await fetch(
      `https://vercel.com/api/web/insights/stats/web-vitals?projectId=${encodeURIComponent(projectId)}&from=${from}&to=${to}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    let p75_latency_ms = 0;
    if (vitalsRes.ok) {
      const vitalsData = await vitalsRes.json() as {
        data?: Array<{ name?: string; p75?: number }>;
      };
      const ttfb = vitalsData.data?.find((v) => v.name === 'TTFB');
      p75_latency_ms = Math.round(ttfb?.p75 ?? 0);
    }

    // Fetch error rate via status codes
    const errorRes = await fetch(
      `https://vercel.com/api/web/insights/stats/error-rate?projectId=${encodeURIComponent(projectId)}&from=${from}&to=${to}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    let error_rate_pct = 0;
    if (errorRes.ok) {
      const errorData = await errorRes.json() as {
        data?: Array<{ errorRate?: number }>;
      };
      error_rate_pct = parseFloat(((errorData.data?.[0]?.errorRate ?? 0) * 100).toFixed(2));
    }

    return { pageviews, unique_visitors, p75_latency_ms, error_rate_pct };
  } catch {
    return null;
  }
}
