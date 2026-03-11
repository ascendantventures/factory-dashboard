import { createSupabaseServerClient } from '@/lib/supabase-server';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { DashIssue } from '@/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [issuesResult, configResult] = await Promise.all([
    supabase.from('dash_issues').select('*').order('updated_at', { ascending: false }),
    user
      ? supabase.from('dash_dashboard_config').select('tracked_repos').eq('user_id', user.id).single()
      : Promise.resolve({ data: null }),
  ]);

  const trackedRepos: string[] = (configResult.data as { tracked_repos?: string[] } | null)?.tracked_repos ?? [];

  return (
    <KanbanBoard
      initialIssues={(issuesResult.data as DashIssue[]) ?? []}
      trackedRepos={trackedRepos}
    />
  );
}
