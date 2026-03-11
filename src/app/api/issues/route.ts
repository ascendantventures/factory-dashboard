import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { Octokit } from '@octokit/rest';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, body: description, repo, complexityHint, issueType } = body;

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    if (!repo?.trim()) {
      return NextResponse.json({ error: 'Repository is required' }, { status: 400 });
    }

    // Validate repo is in tracked repos
    const { data: config } = await supabase
      .from('dash_dashboard_config')
      .select('tracked_repos')
      .eq('user_id', user.id)
      .single();

    const trackedRepos: string[] = config?.tracked_repos ?? [];
    if (!trackedRepos.includes(repo)) {
      return NextResponse.json({ error: 'Repository not in tracked repos' }, { status: 400 });
    }

    // Build labels
    const labels = ['station:intake'];
    if (complexityHint) labels.push(`complexity:${complexityHint}`);
    if (issueType) labels.push(`type:${issueType}`);

    // Create issue via GitHub API
    const [owner, repoName] = (repo as string).split('/');
    const kit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const { data: issue } = await kit.issues.create({
      owner,
      repo: repoName,
      title: title.trim(),
      body: description.trim(),
      labels,
    });

    // Fire-and-forget sync
    const origin = request.nextUrl.origin;
    fetch(`${origin}/api/sync`, { method: 'POST' }).catch(() => {});

    return NextResponse.json({ url: issue.html_url, number: issue.number });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `GitHub API error: ${message}` }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const repo = searchParams.get('repo');
    const station = searchParams.get('station');
    const complexity = searchParams.get('complexity');

    let query = supabase.from('dash_issues').select('*').order('updated_at', { ascending: false });

    if (repo) query = query.eq('repo', repo);
    if (station) query = query.eq('station', station);
    if (complexity) query = query.eq('complexity', complexity);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ issues: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 });
  }
}
