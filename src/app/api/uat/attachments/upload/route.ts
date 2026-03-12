import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { UAT_ATTACHMENTS_BUCKET } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_TYPES = ['image/png', 'application/pdf'];
const FILE_TYPE_MAP: Record<string, 'png' | 'pdf'> = {
  'image/png': 'png',
  'application/pdf': 'pdf',
};
const MAX_SIZE_PNG = 10 * 1024 * 1024;  // 10MB
const MAX_SIZE_PDF = 25 * 1024 * 1024;  // 25MB

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const issueNumberRaw = formData.get('github_issue_number');

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const githubIssueNumber = parseInt(String(issueNumberRaw), 10);
  if (!issueNumberRaw || isNaN(githubIssueNumber)) {
    return NextResponse.json({ error: 'Invalid github_issue_number' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  }

  const maxSize = file.type === 'image/png' ? MAX_SIZE_PNG : MAX_SIZE_PDF;
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 });
  }

  const fileType = FILE_TYPE_MAP[file.type];
  const attachmentId = uuidv4();
  const ext = fileType === 'png' ? 'png' : 'pdf';
  const storagePath = `issue-${githubIssueNumber}/${attachmentId}.${ext}`;

  const adminClient = createSupabaseAdminClient();
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await adminClient.storage
    .from(UAT_ATTACHMENTS_BUCKET)
    .upload(storagePath, Buffer.from(arrayBuffer), {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = adminClient.storage
    .from(UAT_ATTACHMENTS_BUCKET)
    .getPublicUrl(storagePath);

  // Use signed URL for private bucket
  const { data: signedData } = await adminClient.storage
    .from(UAT_ATTACHMENTS_BUCKET)
    .createSignedUrl(storagePath, 60 * 60 * 24 * 365); // 1 year

  const fileUrl = signedData?.signedUrl ?? publicUrl;

  const { data: record, error: dbError } = await adminClient
    .from('uat_attachments')
    .upsert({
      github_issue_number: githubIssueNumber,
      attachment_id: attachmentId,
      file_url: fileUrl,
      file_name: file.name,
      file_type: fileType,
      file_size_bytes: file.size,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (dbError) {
    // Clean up storage on DB failure
    await adminClient.storage.from(UAT_ATTACHMENTS_BUCKET).remove([storagePath]);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({
    id: record.id,
    file_url: fileUrl,
    file_name: record.file_name,
    file_type: record.file_type,
  });
}
