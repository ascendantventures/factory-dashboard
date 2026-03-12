import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { fetchIssueComments } from '@/lib/github';

const REPO_PATTERN = /Build repo:\s*https:\/\/github\.com\/([\w.-]+\/[\w.-]+)/i;
const LIVE_URL_PATTERN = /Live URL:\s*(https:\/\/[^\s]+)/i;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface BuildRepo {
  github_repo: string;
  display_name: string;
  live_url: string | null;
  issue_number: number;
}

async function refreshBuildRepos(): Promise<BuildRepo[]> {
  const admin = createSupabaseAdminClient();

  // Get all done issues
  const { data: doneIssues, error } = await admin
    .from('dash_issues')
    .select('issue_number, repo, title')
    .eq('station', 'done');

  if (error || !doneIssues) return [];

  const results: BuildRepo[] = [];

  for (const issue of doneIssues) {
    const [owner, repo] = (issue.repo as string).split('/');
    if (!owner || !repo) continue;

    try {
      const comments = await fetchIssueComments(owner, repo, issue.issue_number as number);

      for (const comment of comments) {
        const repoMatch = REPO_PATTERN.exec(comment.body);
        if (!repoMatch) continue;

        const githubRepo = repoMatch[1];
        const liveMatch = LIVE_URL_PATTERN.exec(comment.body);
        const liveUrl = liveMatch ? liveMatch[1] : null;

        // Parse display name: "repo-slug — Issue Title"
        const repoSlug = githubRepo.split('/')[1] ?? githubRepo;
        const truncatedTitle =
          (issue.title as string).length > 35
            ? (issue.title as string).slice(0, 35) + '…'
            : (issue.title as string);
        const displayName = `${repoSlug} — ${truncatedTitle}`;

        await admin.from('dash_build_repos').upsert(
          {
            issue_number: issue.issue_number,
            issue_title: issue.title,
            github_repo: githubRepo,
            live_url: liveUrl,
            display_name: displayName,
            refreshed_at: new Date().toISOString(),
          },
          { onConflict: 'github_repo' }
        );

        results.push({
          github_repo: githubRepo,
          display_name: displayName,
          live_url: liveUrl,
          issue_number: issue.issue_number as number,
        });
        break; // Only take first BUILD COMPLETE comment per issue
      }
    } catch {
      // Skip issues we can't fetch comments for
    }
  }

  return results;
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();

    // Check cache freshness (1-hour TTL)
    const oneHourAgo = new Date(Date.now() - CACHE_TTL_MS).toISOString();
    const { data: cached } = await admin
      .from('dash_build_repos')
      .select('github_repo, display_name, live_url, issue_number, refreshed_at')
      .gt('refreshed_at', oneHourAgo)
      .order('refreshed_at', { ascending: false });

    if (cached && cached.length > 0) {
      return NextResponse.json({ repos: cached });
    }

    // Stale or empty — refresh
    const repos = await refreshBuildRepos();
    return NextResponse.json({ repos });
  } catch (err) {
    console.error('build-repos GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch build repos' }, { status: 500 });
  }
}
