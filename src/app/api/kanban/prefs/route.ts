import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('kanban_user_prefs')
    .select('column_order, hidden_columns')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: 'Failed to load preferences' }, { status: 500 });
  }

  // No prefs yet — return empty arrays so client falls back to defaults
  return NextResponse.json({
    column_order: data?.column_order ?? [],
    hidden_columns: data?.hidden_columns ?? [],
  });
}

export async function PUT(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { column_order, hidden_columns } = body as { column_order?: unknown; hidden_columns?: unknown };

  // Validate column_order
  if (!Array.isArray(column_order)) {
    return NextResponse.json({ error: 'column_order must be an array' }, { status: 400 });
  }
  if (column_order.length > 20) {
    return NextResponse.json({ error: 'column_order exceeds max 20 elements' }, { status: 400 });
  }
  for (const item of column_order) {
    if (typeof item !== 'string' || item.length > 50) {
      return NextResponse.json({ error: 'column_order elements must be strings (max 50 chars)' }, { status: 400 });
    }
  }

  // Validate hidden_columns
  if (!Array.isArray(hidden_columns)) {
    return NextResponse.json({ error: 'hidden_columns must be an array' }, { status: 400 });
  }
  for (const item of hidden_columns) {
    if (typeof item !== 'string' || item.length > 50) {
      return NextResponse.json({ error: 'hidden_columns elements must be strings (max 50 chars)' }, { status: 400 });
    }
  }

  // Enforce: at least one column must remain visible
  // If column_order is empty (using defaults), check against default station count
  if (column_order.length > 0 && hidden_columns.length >= column_order.length) {
    return NextResponse.json(
      { error: 'At least one column must remain visible' },
      { status: 400 }
    );
  }

  // Upsert — table has updated_at trigger, always use upsert not insert
  const { data, error } = await supabase
    .from('kanban_user_prefs')
    .upsert(
      { user_id: user.id, column_order, hidden_columns },
      { onConflict: 'user_id' }
    )
    .select('column_order, hidden_columns')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
  }

  return NextResponse.json(data);
}
