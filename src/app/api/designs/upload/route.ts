import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { BUCKETS } from '@/lib/storage';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? process.env.GITHUB_APP_TOKEN ?? process.env.GITHUB_PAT;

async function ensureLabel(repoId: string, label: string, color: string) {
  if (!GITHUB_TOKEN) return;
  const [owner, repo] = repoId.split('/');
  const headers = {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };
  // Try to create the label (idempotent)
  await fetch(`https://api.github.com/repos/${owner}/${repo}/labels`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: label, color: color.replace('#', '') }),
  });
}

async function addLabelToIssue(repoId: string, issueNumber: number, label: string) {
  if (!GITHUB_TOKEN) return;
  const [owner, repo] = repoId.split('/');
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/labels`,
    {
      method: 'POST',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ labels: [label] }),
    }
  );
  if (!res.ok) {
    console.error(`Failed to add label: ${res.status}`, await res.text());
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const repoId = formData.get('repoId') as string | null;
  const issueNumberStr = formData.get('issueNumber') as string | null;

  if (!file || !repoId || !issueNumberStr) {
    return NextResponse.json({ error: 'file, repoId, and issueNumber are required' }, { status: 400 });
  }

  if (!file.name.endsWith('.pen')) {
    return NextResponse.json({ error: 'Only .pen files are accepted' }, { status: 400 });
  }

  const issueNumber = parseInt(issueNumberStr, 10);
  if (isNaN(issueNumber)) {
    return NextResponse.json({ error: 'Invalid issueNumber' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Upload to Supabase Storage
  const storagePath = `${repoId}/${issueNumber}/${file.name}`;
  const fileBuffer = await file.arrayBuffer();

  const { error: uploadError } = await admin.storage
    .from(BUCKETS.pencilDesigns)
    .upload(storagePath, fileBuffer, {
      contentType: 'application/json',
      upsert: true,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }

  // Generate a proper signed URL (10-year expiry)
  const { data: signedData, error: signedError } = await admin.storage
    .from(BUCKETS.pencilDesigns)
    .createSignedUrl(storagePath, 315360000);

  if (signedError || !signedData?.signedUrl) {
    console.error('Signed URL error:', signedError);
    return NextResponse.json({ error: 'Failed to generate file URL' }, { status: 500 });
  }

  const file_url = signedData.signedUrl;

  // Create attachment row
  const { data: attachment, error: attError } = await supabase
    .from('pencil_design_attachments')
    .insert({
      repo_id: repoId,
      issue_number: issueNumber,
      storage_path: storagePath,
      file_name: file.name,
      file_size: file.size,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (attError) {
    console.error('Attachment insert error:', attError);
    return NextResponse.json({ error: 'Failed to save attachment metadata' }, { status: 500 });
  }

  // Get current max version for user designs on this issue
  const { data: existing } = await admin
    .from('pencil_designs')
    .select('version')
    .eq('repo_id', repoId)
    .eq('issue_number', issueNumber)
    .eq('source', 'user')
    .order('version', { ascending: false })
    .limit(1);

  const nextVersion = existing && existing.length > 0 ? existing[0].version + 1 : 1;

  // Upsert pencil_designs row
  const { data: design, error: designError } = await admin
    .from('pencil_designs')
    .insert({
      repo_id: repoId,
      issue_number: issueNumber,
      file_url,
      source: 'user',
      version: nextVersion,
    })
    .select()
    .single();

  if (designError) {
    console.error('Design insert error:', designError);
    return NextResponse.json({ error: 'Failed to save design record' }, { status: 500 });
  }

  // Add label to GitHub issue (best-effort)
  try {
    await ensureLabel(repoId, 'has-design-reference', '#0075ca');
    await addLabelToIssue(repoId, issueNumber, 'has-design-reference');
  } catch (err) {
    console.error('Failed to add GitHub label (best-effort, continuing):', err);
  }

  return NextResponse.json({ attachment, design });
}
