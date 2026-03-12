import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { Octokit } from '@octokit/rest';
import type { SpecApproveRequest, SpecApproveResponse } from '@/types/spec-flow';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body: SpecApproveRequest = await req.json();
  const { issueId, issueNumber, repo, notes, skipDesign } = body;

  if (!issueId || !issueNumber || !repo) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const newStation = skipDesign ? 'design' : 'spec';

  // Update dash_issues with approval data
  const updatePayload: Record<string, unknown> = {
    spec_approved: true,
    spec_approved_by: user.id,
    spec_approved_at: new Date().toISOString(),
    spec_approval_notes: notes ?? null,
  };
  if (skipDesign) {
    updatePayload.station = 'design';
  }

  const { error: updateError } = await supabase
    .from('dash_issues')
    .update(updatePayload)
    .eq('id', issueId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Upsert activity record
  const { data: activity, error: actError } = await supabase
    .from('factory_spec_activities')
    .insert({
      issue_id: issueId,
      actor_id: user.id,
      activity_type: skipDesign ? 'skip_design' : 'approved',
      payload: { notes: notes ?? null, skipDesign: !!skipDesign, actor_email: user.email },
    })
    .select()
    .single();

  if (actError) {
    return NextResponse.json({ error: actError.message }, { status: 500 });
  }

  // If skipDesign, swap GitHub labels: station:spec → station:design
  if (skipDesign && process.env.GITHUB_TOKEN) {
    try {
      const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
      const [owner, repoName] = repo.split('/');
      await octokit.issues.removeLabel({
        owner, repo: repoName, issue_number: issueNumber, name: 'station:spec',
      }).catch(() => {});
      await octokit.issues.addLabels({
        owner, repo: repoName, issue_number: issueNumber, labels: ['station:design'],
      });
    } catch {
      // Label swap is best-effort; don't fail the request
    }
  }

  const response: SpecApproveResponse = {
    success: true,
    issueId,
    activity: { ...activity, actor_email: user.email },
    newStation,
  };

  return NextResponse.json(response);
}
