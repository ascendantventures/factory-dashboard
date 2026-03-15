import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { hashToken } from '@/lib/api-token';
import archiver from 'archiver';
import { format } from 'date-fns';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function verifyApiToken(authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith('Bearer ')) return false;
  const raw = authHeader.slice(7);
  const tokenHash = hashToken(raw);
  const serviceClient = getServiceClient();
  const { data } = await serviceClient
    .from('uat_api_tokens')
    .select('id')
    .eq('token_hash', tokenHash)
    .eq('is_active', true)
    .single();
  if (!data) return false;
  await serviceClient
    .from('uat_api_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id);
  return true;
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  let authorized = false;

  if (authHeader?.startsWith('Bearer ')) {
    authorized = await verifyApiToken(authHeader);
  }

  if (!authorized) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) authorized = true;
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { attachment_ids } = body as { attachment_ids: string[] };

  if (!Array.isArray(attachment_ids) || attachment_ids.length === 0) {
    return NextResponse.json({ error: 'attachment_ids required' }, { status: 400 });
  }

  if (attachment_ids.length > 50) {
    return NextResponse.json({ error: 'Max 50 attachments per download' }, { status: 400 });
  }

  const serviceClient = getServiceClient();
  const { data: attachments, error } = await serviceClient
    .from('uat_attachments')
    .select('id, file_name, file_url')
    .in('id', attachment_ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!attachments?.length) return NextResponse.json({ error: 'No attachments found' }, { status: 404 });

  const timestamp = format(new Date(), 'yyyyMMdd-HHmm');
  const filename = `uat-attachments-${timestamp}.zip`;

  // Build ZIP using archiver and stream it
  const archive = archiver('zip', { zlib: { level: 6 } });

  // Collect file data
  for (const att of attachments) {
    // Extract bucket path from URL
    const urlParts = att.file_url.split('/uat-attachments/');
    if (urlParts.length < 2) continue;
    const bucketPath = urlParts[1].split('?')[0];

    const { data: fileData, error: downloadError } = await serviceClient.storage
      .from('uat-attachments')
      .download(bucketPath);

    if (downloadError || !fileData) continue;

    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    archive.append(buffer, { name: att.file_name });
  }

  // Convert archiver to web-compatible stream
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    archive.on('data', (chunk: Buffer) => chunks.push(chunk));
    archive.on('end', resolve);
    archive.on('error', reject);
    archive.finalize();
  });

  const zipBuffer = Buffer.concat(chunks);

  return new NextResponse(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': zipBuffer.length.toString(),
    },
  });
}
