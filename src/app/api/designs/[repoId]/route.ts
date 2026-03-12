import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import type { PencilDesignRow } from '@/lib/pen-types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ repoId: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { repoId } = await params;
  const admin = createSupabaseAdminClient();

  const { data: designs, error } = await admin
    .from('pencil_designs')
    .select('*')
    .eq('repo_id', repoId)
    .order('issue_number', { ascending: false })
    .order('version', { ascending: false });

  if (error) {
    console.error('Error fetching designs:', error);
    return NextResponse.json({ error: 'Failed to fetch designs' }, { status: 500 });
  }

  // For user-sourced designs, join attachment metadata
  const userDesigns = (designs ?? []).filter((d) => d.source === 'user');
  let attachmentMap: Record<string, PencilDesignRow['attachment']> = {};

  if (userDesigns.length > 0) {
    // Get attachment for each user design by repo_id + issue_number
    const issueNumbers = [...new Set(userDesigns.map((d) => d.issue_number))];
    const { data: attachments } = await admin
      .from('pencil_design_attachments')
      .select('id, repo_id, issue_number, file_name, file_size, storage_path')
      .eq('repo_id', repoId)
      .in('issue_number', issueNumbers);

    for (const att of attachments ?? []) {
      attachmentMap[`${att.repo_id}:${att.issue_number}`] = {
        id: att.id,
        file_name: att.file_name,
        file_size: att.file_size,
        storage_path: att.storage_path,
      };
    }
  }

  const result: PencilDesignRow[] = (designs ?? []).map((d) => ({
    ...d,
    attachment: d.source === 'user'
      ? attachmentMap[`${d.repo_id}:${d.issue_number}`]
      : undefined,
  }));

  return NextResponse.json({ designs: result });
}
