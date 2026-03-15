import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { hashToken } from '@/lib/api-token';

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
  // Update last_used_at
  await serviceClient
    .from('uat_api_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id);
  return true;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const serviceClient = getServiceClient();

  let authorized = false;

  // Try API token first
  if (authHeader?.startsWith('Bearer ')) {
    authorized = await verifyApiToken(authHeader);
  }

  // Fall back to session auth
  if (!authorized) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      authorized = true;
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const issueNumber = parseInt(searchParams.get('issue_number') ?? searchParams.get('issue') ?? '0', 10);

  let query = serviceClient
    .from('uat_attachments')
    .select('id, github_issue_number, file_url, file_name, file_type, file_size_bytes, created_at')
    .order('created_at', { ascending: false });

  if (issueNumber > 0) {
    query = query.eq('github_issue_number', issueNumber);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ attachments: data });
}
