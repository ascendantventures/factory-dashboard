import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { encryptSecret } from '@/lib/webhook-dispatcher';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify ownership
  const { data: existing } = await supabase
    .from('fd_webhooks')
    .select('id')
    .eq('id', id)
    .single();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.url !== undefined) {
    if (typeof body.url !== 'string') {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(body.url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
    if (parsedUrl.protocol !== 'https:') {
      return NextResponse.json({ error: 'URL must use HTTPS' }, { status: 400 });
    }
    updates.url = body.url.trim();
  }

  if (body.events !== undefined) {
    if (!Array.isArray(body.events) || body.events.length === 0) {
      return NextResponse.json({ error: 'At least one event is required' }, { status: 400 });
    }
    updates.events = body.events;
  }

  if (body.enabled !== undefined) {
    updates.enabled = Boolean(body.enabled);
  }

  if (body.secret !== undefined && typeof body.secret === 'string' && body.secret.trim()) {
    updates.secret_hash = await encryptSecret(body.secret.trim());
  }

  if (body.format_type !== undefined && ['standard', 'slack', 'discord'].includes(body.format_type)) {
    updates.format_type = body.format_type;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('fd_webhooks')
    .update(updates)
    .eq('id', id)
    .select('id, url, events, enabled, format_type, created_at, updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify ownership via RLS
  const { data: existing } = await supabase
    .from('fd_webhooks')
    .select('id')
    .eq('id', id)
    .single();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await supabase.from('fd_webhooks').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
