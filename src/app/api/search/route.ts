import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

interface SearchResult {
  type: 'issue' | 'app';
  id: string;
  title: string;
  subtitle: string;
  href: string;
  rank: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '8', 10), 20);

  // Return empty for short queries
  if (q.length < 2) {
    return NextResponse.json({ results: [], query: q, total: 0 });
  }

  // Auth check
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use admin client for FTS queries (bypasses RLS for service queries;
  // user is already authenticated above)
  const admin = createSupabaseAdminClient();

  try {
    // Query dash_issues via FTS
    const { data: issues, error: issuesError } = await admin.rpc('search_issues', {
      query: q,
      max_results: limit,
    });

    // Fallback: use direct SQL if RPC not available
    let issueResults: SearchResult[] = [];
    if (issuesError || !issues) {
      const { data: rawIssues } = await admin
        .from('dash_issues')
        .select('id, title, station, repo, number')
        .textSearch('search_vector', q, { type: 'websearch', config: 'english' })
        .limit(limit);

      issueResults = (rawIssues ?? []).map((row: Record<string, unknown>) => ({
        type: 'issue' as const,
        id: String(row.id),
        title: String(row.title ?? ''),
        subtitle: [row.station ? `station:${row.station}` : null, row.repo].filter(Boolean).join(' · '),
        href: `/dashboard?issue=${row.number}`,
        rank: 0.5,
      }));
    } else {
      issueResults = (issues as Array<Record<string, unknown>>).map((row) => ({
        type: 'issue' as const,
        id: String(row.id),
        title: String(row.title ?? ''),
        subtitle: [row.station ? `station:${row.station}` : null, row.repo].filter(Boolean).join(' · '),
        href: `/dashboard?issue=${row.number}`,
        rank: Number(row.rank ?? 0.5),
      }));
    }

    // Query dash_build_repos via FTS
    const { data: rawApps } = await admin
      .from('dash_build_repos')
      .select('id, display_name, github_repo, live_url')
      .textSearch('search_vector', q, { type: 'websearch', config: 'english' })
      .limit(limit);

    const appResults: SearchResult[] = (rawApps ?? []).map((row: Record<string, unknown>) => ({
      type: 'app' as const,
      id: String(row.id),
      title: String(row.display_name ?? row.github_repo ?? ''),
      subtitle: String(row.github_repo ?? ''),
      href: '/dashboard/apps',
      rank: 0.4,
    }));

    // Merge and sort by rank descending
    const combined = [...issueResults, ...appResults]
      .sort((a, b) => b.rank - a.rank)
      .slice(0, limit);

    return NextResponse.json({
      results: combined,
      query: q,
      total: combined.length,
    });
  } catch (err) {
    console.error('Search error:', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
