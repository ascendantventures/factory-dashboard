import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { Octokit } from '@octokit/rest';
import type { SpecContentResponse } from '@/types/spec-flow';

interface RouteParams {
  params: Promise<{ issueNumber: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { issueNumber: issueNumberStr } = await params;
  const issueNumber = parseInt(issueNumberStr, 10);
  const repo = req.nextUrl.searchParams.get('repo');

  if (!repo || isNaN(issueNumber)) {
    return NextResponse.json({ error: 'Missing repo or invalid issueNumber' }, { status: 400 });
  }

  if (!process.env.GITHUB_TOKEN) {
    return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 });
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const [owner, repoName] = repo.split('/');

  const { data: comments } = await octokit.issues.listComments({
    owner,
    repo: repoName,
    issue_number: issueNumber,
    per_page: 100,
  });

  // Find the spec comment: looks for <!-- SPEC --> marker or heading-heavy comment
  const specComment = [...comments].reverse().find(c =>
    c.body?.includes('<!-- SPEC -->') ||
    c.body?.includes('## Requirements') ||
    c.body?.includes('## Architecture') ||
    c.body?.includes('## Acceptance Criteria') ||
    (c.body?.startsWith('# ') && (c.body?.length ?? 0) > 500)
  );

  const response: SpecContentResponse = {
    issueNumber,
    specMarkdown: specComment?.body ?? null,
    commentId: specComment?.id ?? null,
    commentUrl: specComment?.html_url ?? null,
  };

  return NextResponse.json(response);
}
