import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { encryptSecret } from '@/lib/webhook-dispatcher';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('fd_webhooks')
    .select('id, url, events, enabled, format_type, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { url, secret, events, format_type } = body;

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  if (parsedUrl.protocol !== 'https:') {
    return NextResponse.json({ error: 'URL must use HTTPS' }, { status: 400 });
  }

  if (!Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ error: 'At least one event is required' }, { status: 400 });
  }

  let secret_hash: string | null = null;
  if (secret && typeof secret === 'string' && secret.trim()) {
    secret_hash = await encryptSecret(secret.trim());
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('fd_webhooks')
    .insert({
      url: url.trim(),
      secret_hash,
      events,
      enabled: true,
      created_by: user.id,
      format_type: ['standard', 'slack', 'discord'].includes(format_type) ? format_type : 'standard',
    })
    .select('id, url, events, enabled, format_type, created_at, updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
