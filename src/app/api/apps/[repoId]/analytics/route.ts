import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { fetchVercelAnalytics } from '@/lib/vercel-analytics';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ repoId: string }> }
) {
  const { repoId } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const periodParam = request.nextUrl.searchParams.get('period') ?? '7d';
  const period = (periodParam === '30d' ? '30d' : '7d') as '7d' | '30d';

  // Fetch build repo to get repo_full_name
  const { data: buildRepo, error: repoError } = await supabase
    .from('dash_build_repos')
    .select('id, repo_full_name, github_repo')
    .eq('id', repoId)
    .single();

  if (repoError || !buildRepo) {
    return NextResponse.json({ error: 'App not found' }, { status: 404 });
  }

  const repoFullName: string = buildRepo.repo_full_name ?? buildRepo.github_repo;

  // Check analytics token config
  const hasToken = !!process.env.VERCEL_ANALYTICS_TOKEN;
  if (!hasToken) {
    return NextResponse.json({
      repo_full_name: repoFullName,
      configured: false,
      cached: false,
      fetched_at: null,
      metrics: null,
    });
  }

  const adminClient = createSupabaseAdminClient();

  // Check cache
  const { data: cacheRow } = await adminClient
    .from('dash_analytics_cache')
    .select('metrics, fetched_at')
    .eq('repo_full_name', repoFullName)
    .single();

  const now = Date.now();
  const cacheAge = cacheRow?.fetched_at
    ? now - new Date(cacheRow.fetched_at).getTime()
    : Infinity;

  if (cacheRow && cacheAge < CACHE_TTL_MS) {
    return NextResponse.json({
      repo_full_name: repoFullName,
      configured: true,
      cached: true,
      fetched_at: cacheRow.fetched_at,
      metrics: cacheRow.metrics,
    });
  }

  // Cache miss — fetch from Vercel Analytics API
  try {
    // Derive Vercel project id from repo name (last part) as a fallback
    const projectId = repoFullName.split('/')[1] ?? repoFullName;
    const teamId = process.env.VERCEL_TEAM_ID;

    const metrics = await fetchVercelAnalytics(projectId, period, teamId);
    const fetchedAt = new Date().toISOString();

    // Upsert to cache
    await adminClient
      .from('dash_analytics_cache')
      .upsert(
        {
          repo_full_name: repoFullName,
          metrics,
          fetched_at: fetchedAt,
        },
        { onConflict: 'repo_full_name' }
      );

    return NextResponse.json({
      repo_full_name: repoFullName,
      configured: true,
      cached: false,
      fetched_at: fetchedAt,
      metrics,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[api/apps/analytics] Vercel Analytics fetch failed:', message);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', detail: message },
      { status: 502 }
    );
  }
}
