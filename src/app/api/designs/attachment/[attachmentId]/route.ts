import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { BUCKETS } from '@/lib/storage';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { attachmentId } = await params;
  const admin = createSupabaseAdminClient();

  // Look up the attachment to get storage_path
  const { data: attachment, error: attError } = await admin
    .from('pencil_design_attachments')
    .select('storage_path')
    .eq('id', attachmentId)
    .single();

  if (attError || !attachment) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
  }

  const { data: signedData, error: signError } = await admin.storage
    .from(BUCKETS.pencilDesigns)
    .createSignedUrl(attachment.storage_path, 60);

  if (signError || !signedData) {
    return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 });
  }

  const expiresAt = new Date(Date.now() + 60 * 1000).toISOString();
  return NextResponse.json({ signedUrl: signedData.signedUrl, expiresAt });
}
