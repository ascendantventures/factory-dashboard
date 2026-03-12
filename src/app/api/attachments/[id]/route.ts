import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { BUCKETS } from '@/lib/storage';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/attachments/[id]/download — redirect to signed URL (60s expiry)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch attachment record
    const { data: attachment, error } = await supabase
      .from('fd_issue_attachments')
      .select('storage_path, filename, url')
      .eq('id', id)
      .single();

    if (error || !attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Since bucket is public, redirect to public URL with download disposition
    // For private buckets, use signed URL instead
    const adminClient = createSupabaseAdminClient();
    const { data: signedData, error: signedError } = await adminClient.storage
      .from(BUCKETS.issueAttachments)
      .createSignedUrl(attachment.storage_path, 60, {
        download: attachment.filename,
      });

    if (signedError || !signedData?.signedUrl) {
      // Fallback to public URL
      return NextResponse.redirect(attachment.url);
    }

    return NextResponse.redirect(signedData.signedUrl);
  } catch (err) {
    console.error('Download attachment error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
