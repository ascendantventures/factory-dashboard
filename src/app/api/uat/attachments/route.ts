import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const issueParam = req.nextUrl.searchParams.get('issue');
  const issueNumber = issueParam ? parseInt(issueParam, 10) : null;

  let query = supabase
    .from('uat_attachments')
    .select('*')
    .order('created_at', { ascending: false });

  if (issueNumber && !isNaN(issueNumber)) {
    query = query.eq('github_issue_number', issueNumber);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}
