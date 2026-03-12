import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { UAT_ATTACHMENTS_BUCKET } from '@/lib/storage';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch the record (RLS ensures authenticated access)
  const { data: attachment, error: fetchError } = await supabase
    .from('uat_attachments')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !attachment) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
  }

  // Check ownership
  if (attachment.uploaded_by !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Derive storage path from attachment_id and file_type
  const ext = attachment.file_type === 'pdf' ? 'pdf' : 'png';
  const storagePath = `issue-${attachment.github_issue_number}/${attachment.attachment_id}.${ext}`;

  const adminClient = createSupabaseAdminClient();

  // Delete from storage
  await adminClient.storage.from(UAT_ATTACHMENTS_BUCKET).remove([storagePath]);

  // Delete from DB
  const { error: deleteError } = await adminClient
    .from('uat_attachments')
    .delete()
    .eq('id', id);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: attachment, error } = await supabase
    .from('uat_attachments')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !attachment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(attachment);
}
