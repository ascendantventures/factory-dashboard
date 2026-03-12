import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { display_name?: string };
  const { display_name } = body;

  if (display_name !== undefined) {
    if (display_name.length < 2 || display_name.length > 50) {
      return NextResponse.json({ error: 'Display name must be 2–50 characters' }, { status: 400 });
    }
    const { error } = await supabase.auth.updateUser({
      data: { full_name: display_name },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ display_name: display_name ?? null });
}
