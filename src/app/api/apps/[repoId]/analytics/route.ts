import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { fetchVercelAnalytics } from '@/lib/vercel-analytics';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ repoId: string }> },
): Promise<NextResponse> {
  const { repoId } = await params;

  // Auth check
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Look up the build repo
  const { data: buildRepo, error: repoError } = await supabase
    .from('dash_build_repos')
    .select('id, repo_full_name, vercel_project_id')
    .eq('id', repoId)
    .single();

  if (repoError || !buildRepo) {
    return NextResponse.json({ error: 'App not found' }, { status: 404 });
  }

  const repoFullName: string = buildRepo.repo_full_name ?? buildRepo.id;
  const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';

  const adminSupabase = createSupabaseAdminClient();

  // Check cache
  if (!forceRefresh) {
    const { data: cached } = await adminSupabase
      .from('dash_analytics_cache')
      .select('metrics, fetched_at')
      .eq('repo_full_name', repoFullName)
      .single();

    if (cached?.fetched_at) {
      const age = Date.now() - new Date(cached.fetched_at).getTime();
      if (age < CACHE_TTL_MS) {
        return NextResponse.json({
          repo_full_name: repoFullName,
          cached: true,
          fetched_at: cached.fetched_at,
          metrics: cached.metrics,
        });
      }
    }
  }

  // Fetch fresh from Vercel Analytics API
  const analyticsToken = process.env.VERCEL_ANALYTICS_TOKEN;
  if (!analyticsToken) {
    return NextResponse.json({
      repo_full_name: repoFullName,
      cached: false,
      fetched_at: null,
      metrics: null,
      unconfigured: true,
    });
  }

  const projectId = buildRepo.vercel_project_id ?? repoFullName;
  const period = (request.nextUrl.searchParams.get('period') as '7d' | '30d') ?? '7d';
  const validPeriod: '7d' | '30d' = period === '30d' ? '30d' : '7d';

  const metrics = await fetchVercelAnalytics(projectId, analyticsToken, validPeriod);
  const fetchedAt = new Date().toISOString();

  if (metrics) {
    // Upsert cache
    await adminSupabase
      .from('dash_analytics_cache')
      .upsert(
        {
          repo_full_name: repoFullName,
          metrics,
          fetched_at: fetchedAt,
          updated_at: fetchedAt,
        },
        { onConflict: 'repo_full_name' },
      );
  }

  return NextResponse.json({
    repo_full_name: repoFullName,
    cached: false,
    fetched_at: fetchedAt,
    metrics,
  });
}
