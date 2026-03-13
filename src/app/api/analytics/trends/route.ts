import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

type Granularity = 'day' | 'week' | 'month';

function truncateDate(date: Date, granularity: Granularity): string {
  if (granularity === 'month') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
  }
  if (granularity === 'week') {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    d.setDate(diff);
    return d.toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const to = searchParams.get('to') ?? new Date().toISOString();
  const repo = searchParams.get('repo') ?? null;
  const granularity = (searchParams.get('granularity') as Granularity) ?? 'day';

  const admin = createSupabaseAdminClient();

  let q = admin
    .from('dash_agent_runs')
    .select('started_at, estimated_cost_usd, issue_id')
    .gte('started_at', from)
    .lte('started_at', to)
    .order('started_at', { ascending: true });
  if (repo) q = q.eq('repo', repo);
  const { data: runs } = await q;

  // Aggregate into buckets
  const bucketMap = new Map<string, { cost_usd: number; issues: Set<number> }>();
  for (const r of runs ?? []) {
    const bucket = truncateDate(new Date(r.started_at), granularity);
    if (!bucketMap.has(bucket)) bucketMap.set(bucket, { cost_usd: 0, issues: new Set() });
    const entry = bucketMap.get(bucket)!;
    entry.cost_usd += r.estimated_cost_usd ?? 0;
    if (r.issue_id) entry.issues.add(r.issue_id);
  }

  const series = Array.from(bucketMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      cost_usd: Number(v.cost_usd.toFixed(4)),
      issue_count: v.issues.size,
    }));

  return NextResponse.json({ series });
}
