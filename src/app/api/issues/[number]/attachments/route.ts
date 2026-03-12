import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { BUCKETS } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
  'application/x-pencil',
  'application/octet-stream',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_ISSUE = 10;

interface RouteParams {
  params: Promise<{ number: string }>;
}

// POST /api/issues/[number]/attachments — upload a file
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { number: issueNumberStr } = await params;
    const issueNumber = parseInt(issueNumberStr, 10);
    if (isNaN(issueNumber)) {
      return NextResponse.json({ error: 'Invalid issue number' }, { status: 400 });
    }

    // Check current attachment count
    const { count } = await supabase
      .from('fd_issue_attachments')
      .select('id', { count: 'exact', head: true })
      .eq('issue_number', issueNumber);

    if ((count ?? 0) >= MAX_FILES_PER_ISSUE) {
      return NextResponse.json(
        { error: `Issue already has ${MAX_FILES_PER_ISSUE} attachments (maximum reached)` },
        { status: 400 }
      );
    }

    // Parse multipart form
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isPen = ext === 'pen';
    const mimeType = isPen ? 'application/x-pencil' : file.type;

    if (!isPen && !ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `File type "${file.type}" is not supported. Allowed: PNG, JPG, GIF, SVG, PDF, .pen` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB)` },
        { status: 400 }
      );
    }

    // Build storage path: issues/{issue_number}/{uuid}.{ext}
    const fileExt = file.name.split('.').pop() ?? 'bin';
    const fileUuid = uuidv4();
    const storagePath = `issues/${issueNumber}/${fileUuid}.${fileExt}`;

    // Upload to Supabase Storage (use admin client to bypass RLS on storage)
    const adminClient = createSupabaseAdminClient();
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await adminClient.storage
      .from(BUCKETS.issueAttachments)
      .upload(storagePath, arrayBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Storage upload failed' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = adminClient.storage
      .from(BUCKETS.issueAttachments)
      .getPublicUrl(storagePath);

    // Insert DB record
    const { data: attachment, error: dbError } = await supabase
      .from('fd_issue_attachments')
      .insert({
        issue_number: issueNumber,
        filename: file.name,
        file_type: mimeType,
        storage_path: storagePath,
        url: publicUrl,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (dbError) {
      // Cleanup storage on DB failure
      await adminClient.storage.from(BUCKETS.issueAttachments).remove([storagePath]);
      console.error('DB insert error:', dbError);
      return NextResponse.json({ error: 'Failed to save attachment record' }, { status: 500 });
    }

    return NextResponse.json(attachment);
  } catch (err) {
    console.error('Attachment upload error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/issues/[number]/attachments — list attachments for an issue
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { number: issueNumberStr } = await params;
    const issueNumber = parseInt(issueNumberStr, 10);
    if (isNaN(issueNumber)) {
      return NextResponse.json({ error: 'Invalid issue number' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('fd_issue_attachments')
      .select('id, issue_number, filename, file_type, storage_path, url, uploaded_by, created_at')
      .eq('issue_number', issueNumber)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error('List attachments error:', err);
    return NextResponse.json({ error: 'Failed to fetch attachments' }, { status: 500 });
  }
}
