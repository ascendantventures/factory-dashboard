import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { Octokit } from '@octokit/rest';
import type { SpecFeedbackRequest, SpecFeedbackResponse } from '@/types/spec-flow';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body: SpecFeedbackRequest = await req.json();
  const { issueId, issueNumber, repo, feedback } = body;

  if (!issueId || !issueNumber || !repo || !feedback?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!process.env.GITHUB_TOKEN) {
    return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 });
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const [owner, repoName] = repo.split('/');

  const commentBody = `## 📋 Spec Feedback\n\n${feedback}\n\n---\n*Feedback submitted via Factory Dashboard*`;

  const { data: comment } = await octokit.issues.createComment({
    owner,
    repo: repoName,
    issue_number: issueNumber,
    body: commentBody,
  });

  const { data: activity, error: actError } = await supabase
    .from('factory_spec_activities')
    .insert({
      issue_id: issueId,
      actor_id: user.id,
      activity_type: 'feedback_requested',
      payload: { feedback, commentUrl: comment.html_url, actor_email: user.email },
    })
    .select()
    .single();

  if (actError) {
    return NextResponse.json({ error: actError.message }, { status: 500 });
  }

  const response: SpecFeedbackResponse = {
    success: true,
    commentUrl: comment.html_url,
    activity: { ...activity, actor_email: user.email },
  };

  return NextResponse.json(response);
}
