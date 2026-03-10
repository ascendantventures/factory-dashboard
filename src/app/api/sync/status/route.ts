import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: config } = await supabase
      .from('dash_dashboard_config')
      .select('updated_at')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({ last_sync: config?.updated_at ?? null });
  } catch {
    return NextResponse.json({ last_sync: null });
  }
}
