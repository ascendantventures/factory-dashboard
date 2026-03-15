import { redirect } from 'next/navigation';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { getUserRole } from '@/lib/roles';
import { ProfileForm } from './_components/ProfileForm';
import { ChangePasswordForm } from './_components/ChangePasswordForm';
import { AvatarUpload } from './_components/AvatarUpload';
import { SessionList } from './_components/SessionList';

export const dynamic = 'force-dynamic';

export default async function ProfileSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const role = await getUserRole(user.id);
  const displayName = (user.user_metadata?.full_name as string | undefined) ?? user.email?.split('@')[0] ?? '';

  // Fetch avatar_url from fd_user_profiles (graceful fallback if table not yet migrated)
  let avatarUrl: string | null = null;
  try {
    const admin = createSupabaseAdminClient();
    const { data: profile } = await admin
      .from('fd_user_profiles')
      .select('avatar_url')
      .eq('user_id', user.id)
      .single();
    avatarUrl = profile?.avatar_url ?? null;
  } catch {
    // Table may not exist yet — migration pending
  }

  const cardStyle: React.CSSProperties = {
    background: '#18181B',
    border: '1px solid #3F3F46',
    borderRadius: '12px',
    padding: '24px',
  };

  return (
    <div style={{
      maxWidth: '720px',
      margin: '0 auto',
      padding: '32px 24px',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '28px', fontWeight: 700, color: '#FAFAFA',
          margin: 0, letterSpacing: '-0.02em',
        }}>
          Profile Settings
        </h1>
        <p style={{ fontSize: '14px', color: '#71717A', marginTop: '4px', marginBottom: 0 }}>
          Manage your account
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Section 1: Profile Information (existing) */}
        <ProfileForm displayName={displayName} email={user.email ?? ''} role={role} />

        {/* Section 2: Profile Photo (NEW — Issue #45) */}
        <div style={cardStyle}>
          <h3 style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', fontWeight: 600, color: '#FAFAFA',
            margin: '0 0 16px 0',
          }}>
            Profile Photo
          </h3>
          <AvatarUpload
            initialAvatarUrl={avatarUrl}
            displayName={displayName}
            email={user.email ?? ''}
          />
        </div>

        {/* Section 3: Active Sessions (NEW — Issue #45) */}
        <SessionList />

        {/* Section 4: Change Password (existing) */}
        <ChangePasswordForm />
      </div>
    </div>
  );
}
