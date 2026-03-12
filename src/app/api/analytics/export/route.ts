import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const to = searchParams.get('to') ?? new Date().toISOString();
  const repo = searchParams.get('repo') ?? null;

  const admin = createSupabaseAdminClient();

  let q = admin
    .from('dash_agent_runs')
    .select('id, issue_id, station, model, repo, estimated_cost_usd, duration_seconds, run_status, started_at')
    .gte('started_at', from)
    .lte('started_at', to)
    .order('started_at', { ascending: false });
  if (repo) q = q.eq('repo', repo);
  const { data: rows } = await q;

  const headers = ['id', 'submission_id', 'station', 'model', 'build_repo', 'cost_usd', 'duration_seconds', 'status', 'created_at'];
  const csvRows = [headers.join(',')];

  for (const r of rows ?? []) {
    const row = [
      r.id ?? '',
      r.issue_id ?? '',
      r.station ?? '',
      r.model ?? '',
      r.repo ?? '',
      r.estimated_cost_usd ?? 0,
      r.duration_seconds ?? '',
      r.run_status ?? '',
      r.started_at ?? '',
    ].map(val => `"${String(val).replace(/"/g, '""')}"`);
    csvRows.push(row.join(','));
  }

  const csv = csvRows.join('\n');
  const dateStr = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="analytics-export-${dateStr}.csv"`,
    },
  });
}
