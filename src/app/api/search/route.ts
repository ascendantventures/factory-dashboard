import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export type SearchResult = {
  type: 'issue' | 'page';
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  badge?: string;
};

export type SearchResponse = {
  results: SearchResult[];
  query: string;
};

const PAGES = [
  { title: 'Board', href: '/dashboard', keywords: ['board', 'kanban', 'issues'] },
  { title: 'Metrics', href: '/dashboard/metrics', keywords: ['metrics', 'stats'] },
  { title: 'Costs', href: '/dashboard/costs', keywords: ['costs', 'spend', 'billing'] },
  { title: 'Analytics', href: '/dashboard/analytics', keywords: ['analytics', 'roi'] },
  { title: 'Activity', href: '/dashboard/activity', keywords: ['activity', 'log'] },
  { title: 'Apps', href: '/dashboard/apps', keywords: ['apps', 'repositories', 'projects'] },
  { title: 'Templates', href: '/dashboard/templates', keywords: ['templates'] },
  { title: 'Settings', href: '/dashboard/settings', keywords: ['settings', 'profile', 'config'] },
  { title: 'Webhooks', href: '/dashboard/settings/webhooks', keywords: ['webhooks'] },
  { title: 'Admin — Users', href: '/dashboard/admin/users', keywords: ['admin', 'users', 'invite'] },
  { title: 'Admin — Audit Log', href: '/dashboard/admin/audit', keywords: ['admin', 'audit', 'log'] },
  { title: 'Admin — Events', href: '/dashboard/admin/events', keywords: ['admin', 'events', 'queue'] },
  { title: 'Docs', href: '/dashboard/docs', keywords: ['docs', 'documentation', 'help'] },
];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') ?? '';

    if (q.length < 2) {
      return NextResponse.json({ results: [], query: q } satisfies SearchResponse);
    }

    // Query dash_issues with ILIKE on title
    const { data: issues } = await supabase
      .from('dash_issues')
      .select('issue_number, title, repo, station, status')
      .ilike('title', `%${q}%`)
      .order('updated_at', { ascending: false })
      .limit(8);

    const issueResults: SearchResult[] = (issues ?? []).map((issue) => ({
      type: 'issue',
      id: String(issue.issue_number),
      title: issue.title,
      subtitle: issue.repo,
      href: `/dashboard/issues/${issue.issue_number}`,
      badge: issue.station ?? issue.status ?? undefined,
    }));

    // Filter static pages by title or keyword match
    const qLower = q.toLowerCase();
    const pageResults: SearchResult[] = PAGES
      .filter((p) =>
        p.title.toLowerCase().includes(qLower) ||
        p.keywords.some((k) => k.includes(qLower) || qLower.includes(k))
      )
      .slice(0, 4)
      .map((p) => ({
        type: 'page',
        id: p.href,
        title: p.title,
        subtitle: p.href,
        href: p.href,
        badge: p.href.includes('/admin/') ? 'admin' : undefined,
      }));

    // Cap at 12 total
    const results = [...issueResults, ...pageResults].slice(0, 12);

    return NextResponse.json({ results, query: q } satisfies SearchResponse);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
