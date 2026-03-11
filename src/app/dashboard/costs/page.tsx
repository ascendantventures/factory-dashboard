import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import CostsDashboard from './CostsDashboard';

export const dynamic = 'force-dynamic';

export default async function CostsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: roleData } = await supabase
    .from('dash_user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (roleData?.role !== 'admin') {
    redirect('/dashboard');
  }

  return <CostsDashboard />;
}
