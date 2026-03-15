import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { generateToken, hashToken } from '@/lib/api-token';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/uat/tokens — list all tokens (auth required)
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('uat_api_tokens')
    .select('id, description, is_active, last_used_at, created_at, created_by')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/uat/tokens — create a new token (auth required)
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const description = (body.description ?? '').trim();
  if (!description) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 });
  }

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);

  const serviceClient = getServiceClient();
  const { data, error } = await serviceClient
    .from('uat_api_tokens')
    .insert({
      token_hash: tokenHash,
      description,
      created_by: user.id,
      is_active: true,
    })
    .select('id, description, is_active, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return the raw token ONCE — never stored
  return NextResponse.json({ ...data, raw_token: rawToken }, { status: 201 });
}
