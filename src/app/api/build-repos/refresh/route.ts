import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { fetchIssueComments } from '@/lib/github';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

const REPO_PATTERN = /Build repo:\s*https:\/\/github\.com\/([\w.-]+\/[\w.-]+)/i;
const LIVE_URL_PATTERN = /Live URL:\s*(https:\/\/[^\s]+)/i;

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();

    // Get all done issues
    const { data: doneIssues, error } = await admin
      .from('dash_issues')
      .select('issue_number, repo, title')
      .eq('station', 'done');

    if (error || !doneIssues) {
      return NextResponse.json({ repos: [] });
    }

    const results: Array<{
      github_repo: string;
      display_name: string;
      live_url: string | null;
      issue_number: number;
    }> = [];

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
          break;
        }
      } catch {
        // Skip
      }
    }

    return NextResponse.json({ repos: results });
  } catch (err) {
    console.error('build-repos refresh error:', err);
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}
