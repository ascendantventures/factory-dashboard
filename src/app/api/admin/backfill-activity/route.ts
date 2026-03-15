import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { STATIONS, type Station } from '@/lib/constants';

export const dynamic = 'force-dynamic';

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

async function fetchGitHubIssues(repo: string, limit: number, token: string): Promise<GitHubIssue[]> {
  const [owner, repoName] = repo.split('/');
  const perPage = Math.min(limit, 100);
  const pages = Math.ceil(limit / 100);
  const issues: GitHubIssue[] = [];

  for (let page = 1; page <= pages && issues.length < limit; page++) {
    const url = `https://api.github.com/repos/${owner}/${repoName}/issues?state=all&per_page=${perPage}&page=${page}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!res.ok) break;
    const data = await res.json() as GitHubIssue[];
    if (data.length === 0) break;
    issues.push(...data);
  }

  return issues.slice(0, limit);
}

async function fetchIssueTimeline(repo: string, issueNumber: number, token: string): Promise<GitHubTimelineEvent[]> {
  const [owner, repoName] = repo.split('/');
  const url = `https://api.github.com/repos/${owner}/${repoName}/issues/${issueNumber}/timeline?per_page=100`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.mockingbird-preview+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!res.ok) return [];
  return res.json() as Promise<GitHubTimelineEvent[]>;
}

export async function POST(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  const providedSecret = request.headers.get('x-admin-secret');

  if (!adminSecret || providedSecret !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return NextResponse.json({ error: 'GITHUB_TOKEN not configured' }, { status: 503 });
  }

  let body: { repo?: string; limit?: number };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const repo = body.repo ?? 'ascendantventures/harness-beta-test';
  const limit = Math.min(body.limit ?? 100, 500);

  const admin = createSupabaseAdminClient();
  const errors: string[] = [];
  let issuesUpserted = 0;
  let transitionsInserted = 0;

  // Fetch all issues from GitHub
  const issues = await fetchGitHubIssues(repo, limit, githubToken);

  for (const issue of issues) {
    try {
      // Determine current station from labels
      const stationLabel = issue.labels
        .map((l) => l.name)
        .find((n) => n.startsWith('station:'));
      const currentStation = stationLabel
        ? (stationLabel.replace('station:', '') as Station)
        : null;

      // Upsert the issue
      const { error: upsertError } = await admin
        .from('dash_issues')
        .upsert({
          id: issue.id,
          issue_number: issue.number,
          repo,
          title: issue.title,
          body: issue.body ?? null,
          state: issue.state,
          station: currentStation && STATIONS.includes(currentStation) ? currentStation : null,
          labels: issue.labels,
          author: issue.user?.login ?? null,
          created_at: issue.created_at,
          updated_at: issue.updated_at,
          closed_at: issue.closed_at ?? null,
          synced_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (upsertError) {
        errors.push(`Issue #${issue.number} upsert: ${upsertError.message}`);
        continue;
      }
      issuesUpserted++;

      // Fetch timeline to build transition history
      const timeline = await fetchIssueTimeline(repo, issue.number, githubToken);
      const labeledEvents = timeline.filter(
        (e) => e.event === 'labeled' && e.label?.name.startsWith('station:')
      );

      let prevStation: string | null = null;
      for (const ev of labeledEvents) {
        const toStation = ev.label!.name.replace('station:', '') as Station;
        if (!STATIONS.includes(toStation)) continue;

        const occurredAt = ev.created_at ?? new Date().toISOString();

        // Check if this transition already exists to avoid duplication
        const { data: existing } = await admin
          .from('dash_stage_transitions')
          .select('id')
          .eq('issue_id', issue.id)
          .eq('to_station', toStation)
          .eq('transitioned_at', occurredAt)
          .maybeSingle();

        if (!existing) {
          const { error: transErr } = await admin.from('dash_stage_transitions').insert({
            issue_id: issue.id,
            repo,
            issue_number: issue.number,
            from_station: prevStation,
            to_station: toStation,
            transitioned_at: occurredAt,
          });

          if (transErr) {
            errors.push(`Transition #${issue.number} → ${toStation}: ${transErr.message}`);
          } else {
            transitionsInserted++;
          }
        }

        prevStation = toStation;
      }
    } catch (err) {
      errors.push(`Issue #${issue.number}: ${String(err)}`);
    }
  }

  return NextResponse.json({
    issues_upserted: issuesUpserted,
    transitions_inserted: transitionsInserted,
    errors,
  });
}
