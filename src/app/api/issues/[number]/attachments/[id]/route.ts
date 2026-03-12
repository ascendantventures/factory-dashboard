import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { BUCKETS } from '@/lib/storage';

interface RouteParams {
  params: Promise<{ number: string; id: string }>;
}

// DELETE /api/issues/[number]/attachments/[id] — delete an attachment
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { number: issueNumberStr, id } = await params;
    const issueNumber = parseInt(issueNumberStr, 10);
    if (isNaN(issueNumber)) {
      return NextResponse.json({ error: 'Invalid issue number' }, { status: 400 });
    }

    // Fetch the attachment to verify ownership
    const { data: attachment, error: fetchError } = await supabase
      .from('fd_issue_attachments')
      .select('*')
      .eq('id', id)
      .eq('issue_number', issueNumber)
      .single();

    if (fetchError || !attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Check permission: uploader or admin
    const isOwner = attachment.uploaded_by === user.id;
    const isAdmin = (user.user_metadata as Record<string, unknown>)?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete from Supabase Storage
    const adminClient = createSupabaseAdminClient();
    const { error: storageError } = await adminClient.storage
      .from(BUCKETS.issueAttachments)
      .remove([attachment.storage_path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      // Continue to delete DB record even if storage delete fails
    }

    // Delete DB record
    const { error: dbError } = await supabase
      .from('fd_issue_attachments')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('DB delete error:', dbError);
      return NextResponse.json({ error: 'Failed to delete attachment record' }, { status: 500 });
    }

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error('Delete attachment error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
