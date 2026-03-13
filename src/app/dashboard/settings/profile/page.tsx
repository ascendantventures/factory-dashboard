import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getUserRole } from '@/lib/roles';
import { ProfileForm } from './_components/ProfileForm';
import { ChangePasswordForm } from './_components/ChangePasswordForm';

export const dynamic = 'force-dynamic';

export default async function ProfileSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const role = await getUserRole(user.id);
  const displayName = (user.user_metadata?.full_name as string | undefined) ?? user.email?.split('@')[0] ?? '';

  return (
    <div style={{ padding: '32px', maxWidth: '1280px', fontFamily: "'Outfit', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#FAFAFA', margin: 0, letterSpacing: '-0.02em' }}>Profile Settings</h1>
        <p style={{ fontSize: '14px', color: '#A1A1AA', marginTop: '4px', marginBottom: 0 }}>Manage your account</p>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <ProfileForm
          displayName={displayName}
          email={user.email ?? ''}
          role={role}
        />
        <ChangePasswordForm />
      </div>
    </div>
  );
}
