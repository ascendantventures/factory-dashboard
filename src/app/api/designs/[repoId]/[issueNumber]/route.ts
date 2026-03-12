import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import type { PencilDesignRow } from '@/lib/pen-types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ repoId: string; issueNumber: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { repoId, issueNumber } = await params;
  const issueNum = parseInt(issueNumber, 10);
  if (isNaN(issueNum)) {
    return NextResponse.json({ error: 'Invalid issue number' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  const { data: designs, error } = await admin
    .from('pencil_designs')
    .select('*')
    .eq('repo_id', repoId)
    .eq('issue_number', issueNum)
    .order('version', { ascending: false });

  if (error) {
    console.error('Error fetching design:', error);
    return NextResponse.json({ error: 'Failed to fetch design' }, { status: 500 });
  }

  if (!designs || designs.length === 0) {
    return NextResponse.json({ design: null });
  }

  // Prioritize user-sourced over pipeline
  const userDesign = designs.find((d) => d.source === 'user');
  const design = userDesign ?? designs[0];

  let attachment: PencilDesignRow['attachment'] = undefined;
  if (design.source === 'user') {
    const { data: att } = await admin
      .from('pencil_design_attachments')
      .select('id, file_name, file_size, storage_path')
      .eq('repo_id', repoId)
      .eq('issue_number', issueNum)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (att) {
      attachment = {
        id: att.id,
        file_name: att.file_name,
        file_size: att.file_size,
        storage_path: att.storage_path,
      };
    }
  }

  const result: PencilDesignRow = { ...design, attachment };
  return NextResponse.json({ design: result });
}
