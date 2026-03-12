import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Auth check
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const to = searchParams.get('to') ?? new Date().toISOString();
  const repo = searchParams.get('repo') ?? null;

  const admin = createSupabaseAdminClient();

  // All-time totals
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  async function sumCost(startDate?: string, endDate?: string, repoFilter?: string | null) {
    let q = admin.from('dash_agent_runs').select('estimated_cost_usd');
    if (startDate) q = q.gte('started_at', startDate);
    if (endDate) q = q.lte('started_at', endDate);
    if (repoFilter) q = q.eq('repo', repoFilter);
    const { data } = await q;
    return (data ?? []).reduce((acc, r) => acc + (r.estimated_cost_usd ?? 0), 0);
  }

  const [allTime, thisMonth, thisWeek, today] = await Promise.all([
    sumCost(undefined, undefined, repo),
    sumCost(startOfMonth, undefined, repo),
    sumCost(startOfWeek, undefined, repo),
    sumCost(startOfToday, undefined, repo),
  ]);

  // Spend by app (repo)
  let byAppQ = admin
    .from('dash_agent_runs')
    .select('repo, estimated_cost_usd, issue_id')
    .gte('started_at', from)
    .lte('started_at', to);
  if (repo) byAppQ = byAppQ.eq('repo', repo);
  const { data: byAppRaw } = await byAppQ;

  const byAppMap = new Map<string, { cost_usd: number; issues: Set<number> }>();
  for (const r of byAppRaw ?? []) {
    const key = r.repo ?? 'unknown';
    if (!byAppMap.has(key)) byAppMap.set(key, { cost_usd: 0, issues: new Set() });
    const entry = byAppMap.get(key)!;
    entry.cost_usd += r.estimated_cost_usd ?? 0;
    if (r.issue_id) entry.issues.add(r.issue_id);
  }
  const by_app = Array.from(byAppMap.entries())
    .map(([repoName, v]) => ({ repo: repoName, cost_usd: v.cost_usd, issue_count: v.issues.size }))
    .sort((a, b) => b.cost_usd - a.cost_usd);

  // Spend by station
  let byStationQ = admin
    .from('dash_agent_runs')
    .select('station, estimated_cost_usd')
    .gte('started_at', from)
    .lte('started_at', to);
  if (repo) byStationQ = byStationQ.eq('repo', repo);
  const { data: byStationRaw } = await byStationQ;

  const byStationMap = new Map<string, { cost_usd: number; count: number }>();
  for (const r of byStationRaw ?? []) {
    const key = r.station ?? 'unknown';
    if (!byStationMap.has(key)) byStationMap.set(key, { cost_usd: 0, count: 0 });
    const entry = byStationMap.get(key)!;
    entry.cost_usd += r.estimated_cost_usd ?? 0;
    entry.count += 1;
  }
  const by_station = Array.from(byStationMap.entries())
    .map(([station, v]) => ({ station, cost_usd: v.cost_usd, count: v.count }))
    .sort((a, b) => b.cost_usd - a.cost_usd);

  // Spend by model
  let byModelQ = admin
    .from('dash_agent_runs')
    .select('model, estimated_cost_usd')
    .gte('started_at', from)
    .lte('started_at', to);
  if (repo) byModelQ = byModelQ.eq('repo', repo);
  const { data: byModelRaw } = await byModelQ;

  const byModelMap = new Map<string, { cost_usd: number; count: number }>();
  for (const r of byModelRaw ?? []) {
    const key = r.model ?? 'unknown';
    if (!byModelMap.has(key)) byModelMap.set(key, { cost_usd: 0, count: 0 });
    const entry = byModelMap.get(key)!;
    entry.cost_usd += r.estimated_cost_usd ?? 0;
    entry.count += 1;
  }
  const by_model = Array.from(byModelMap.entries())
    .map(([model, v]) => ({ model, cost_usd: v.cost_usd, count: v.count }))
    .sort((a, b) => b.cost_usd - a.cost_usd);

  return NextResponse.json({
    totals: {
      all_time: Number(allTime.toFixed(4)),
      this_month: Number(thisMonth.toFixed(4)),
      this_week: Number(thisWeek.toFixed(4)),
      today: Number(today.toFixed(4)),
    },
    by_app,
    by_station,
    by_model,
  });
}
