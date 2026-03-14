import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for large backfills

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  labels: Array<{ name: string }>;
  user: { login: string } | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

interface GitHubTimelineEvent {
  event: string;
  label?: { name: string };
  created_at?: string;
  actor?: { login: string };
}

export async function POST(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return NextResponse.json({ error: 'Admin secret not configured' }, { status: 503 });
  }

  const providedSecret = request.headers.get('x-admin-secret');
  if (!providedSecret || providedSecret !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { repo?: string; limit?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const repo = body.repo ?? process.env.GITHUB_REPO ?? 'ascendantventures/harness-beta-test';
  const limit = Math.min(body.limit ?? 100, 500);

  const githubToken = process.env.GITHUB_TOKEN ?? process.env.GITHUB_PAT;
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (githubToken) {
    headers['Authorization'] = `Bearer ${githubToken}`;
  }

  const admin = createSupabaseAdminClient();
  const errors: string[] = [];
  let issuesUpserted = 0;
  let transitionsInserted = 0;

  try {
    // Fetch issues from GitHub API (paginated)
    const [owner, repoName] = repo.split('/');
    const allIssues: GitHubIssue[] = [];
    let page = 1;

    while (allIssues.length < limit) {
      const perPage = Math.min(100, limit - allIssues.length);
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/issues?state=all&per_page=${perPage}&page=${page}&sort=created&direction=asc`,
        { headers }
      );

      if (!res.ok) {
        errors.push(`GitHub API error fetching issues page ${page}: ${res.status}`);
        break;
      }

      const pageIssues: GitHubIssue[] = await res.json();
      if (pageIssues.length === 0) break;

      // Filter out pull requests (GitHub API returns PRs in issues endpoint)
      const issuesOnly = pageIssues.filter((i) => !('pull_request' in i));
      allIssues.push(...issuesOnly);
      page++;

      if (pageIssues.length < perPage) break;
    }

    // Upsert all issues into dash_issues
    for (const issue of allIssues) {
      const currentLabels = issue.labels.map((l) => l.name);
      const stationLabel = currentLabels.find((l) => l.startsWith('station:'));
      const currentStation = stationLabel ? stationLabel.replace('station:', '') : null;

      const { error: upsertError } = await admin.from('dash_issues').upsert({
        id: issue.id,
        issue_number: issue.number,
        repo,
        title: issue.title ?? '',
        body: issue.body ?? null,
        state: issue.state ?? 'open',
        station: currentStation,
        labels: issue.labels,
        author: issue.user?.login ?? null,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        closed_at: issue.closed_at ?? null,
        synced_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (upsertError) {
        errors.push(`Failed to upsert issue #${issue.number}: ${upsertError.message}`);
      } else {
        issuesUpserted++;
      }
    }

    // Fetch timeline events for each issue to build stage transitions
    for (const issue of allIssues) {
      try {
        const timelineRes = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/issues/${issue.number}/timeline?per_page=100`,
          { headers: { ...headers, 'Accept': 'application/vnd.github.mockingbird-preview+json' } }
        );

        if (!timelineRes.ok) {
          errors.push(`Failed to fetch timeline for #${issue.number}: ${timelineRes.status}`);
          continue;
        }

        const timeline: GitHubTimelineEvent[] = await timelineRes.json();

        // Filter labeled events with station:* labels, ordered by created_at
        const stationEvents = timeline.filter(
          (e) => e.event === 'labeled' && e.label?.name?.startsWith('station:')
        );

        let prevStation: string | null = null;
        for (const e of stationEvents) {
          const toStation = e.label!.name.replace('station:', '');
          const transitionedAt = e.created_at ?? issue.created_at;

          const { error: transErr } = await admin.from('dash_stage_transitions').insert({
            issue_id: issue.id,
            repo,
            issue_number: issue.number,
            from_station: prevStation,
            to_station: toStation,
            transitioned_at: transitionedAt,
          });

          if (!transErr) {
            transitionsInserted++;
            prevStation = toStation;
          }
          // Silently skip duplicate transitions (unique constraint violations are expected on re-run)
        }
      } catch (err) {
        errors.push(`Timeline error for #${issue.number}: ${String(err)}`);
      }
    }
  } catch (err) {
    errors.push(`Fatal error: ${String(err)}`);
    return NextResponse.json(
      { issues_upserted: issuesUpserted, transitions_inserted: transitionsInserted, errors },
      { status: 500 }
    );
  }

  return NextResponse.json({
    issues_upserted: issuesUpserted,
    transitions_inserted: transitionsInserted,
    errors,
  });
}
