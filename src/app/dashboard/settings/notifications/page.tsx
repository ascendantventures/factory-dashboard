/**
 * /dashboard/settings/notifications
 * Notification preferences page — Phase 2 (delivery channels + timezone)
 */
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { NotificationPreferencesForm } from '@/components/notifications/NotificationPreferencesForm';
import Link from 'next/link';
import { Bell, ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

const DEFAULT_PREFS = {
  spec_ready: true,
  build_complete: true,
  qa_passed: true,
  qa_failed: true,
  deploy_complete: true,
  agent_stalled: true,
  pipeline_error: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  email_enabled: false,
  discord_enabled: false,
  discord_webhook_url: null as string | null,
  user_timezone: 'UTC',
};

export default async function NotificationsSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Load current preferences
  const { data } = await supabase
    .from('fd_notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const initialPrefs = { ...DEFAULT_PREFS, ...(data ?? {}) };

  return (
    <section style={{ padding: '24px', maxWidth: '680px' }}>
      {/* Breadcrumb */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '24px',
          fontSize: '13px',
          color: '#71717A',
        }}
      >
        <Link
          href="/dashboard/settings"
          style={{ color: '#71717A', textDecoration: 'none' }}
          onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.color = '#FAFAFA'; }}
          onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.color = '#71717A'; }}
        >
          Settings
        </Link>
        <ChevronRight style={{ width: '14px', height: '14px' }} />
        <span style={{ color: '#A1A1AA' }}>Notifications</span>
      </nav>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            background: 'rgba(99,102,241,0.15)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Bell style={{ width: '16px', height: '16px', color: '#6366F1' }} />
        </div>
        <h1
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#FAFAFA',
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Notifications
        </h1>
      </div>
      <p style={{ fontSize: '14px', color: '#71717A', marginBottom: '28px', marginTop: 0 }}>
        Control which pipeline events notify you and how they&apos;re delivered.
      </p>

      <NotificationPreferencesForm initialPrefs={initialPrefs} />
    </section>
  );
}
