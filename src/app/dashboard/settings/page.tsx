import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { SettingsClient } from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Get user's config
  const { data: config } = user
    ? await supabase.from('dash_dashboard_config').select('*').eq('user_id', user.id).single()
    : { data: null };

  // Get user role
  const { data: roleData } = user
    ? await supabase.from('dash_user_roles').select('*').eq('user_id', user.id).single()
    : { data: null };

  const isAdmin = roleData?.role === 'admin';

  // Admin: get all users with roles
  let allUsers: Array<{ id: string; email: string; role: string }> = [];
  if (isAdmin) {
    const { data: usersData } = await admin.auth.admin.listUsers();
    const { data: roles } = await admin.from('dash_user_roles').select('*');
    const rolesMap: Record<string, string> = {};
    for (const r of roles ?? []) {
      rolesMap[r.user_id] = r.role;
    }
    allUsers = (usersData?.users ?? []).map((u) => ({
      id: u.id,
      email: u.email ?? '',
      role: rolesMap[u.id] ?? 'operator',
    }));
  }

  return (
    <SettingsClient
      userId={user?.id ?? null}
      initialConfig={config ?? null}
      isAdmin={isAdmin}
      allUsers={allUsers}
    />
  );
}
