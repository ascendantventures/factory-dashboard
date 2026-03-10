import { createSupabaseServerClient } from '@/lib/supabase-server';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { DashIssue } from '@/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const { data: issues } = await supabase
    .from('dash_issues')
    .select('*')
    .order('updated_at', { ascending: false });

  return <KanbanBoard initialIssues={(issues as DashIssue[]) ?? []} />;
}
