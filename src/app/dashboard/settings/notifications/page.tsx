import { NotificationPreferencesForm } from '@/components/notifications/NotificationPreferencesForm';
import { Bell } from 'lucide-react';

export const metadata = {
  title: 'Notification Preferences — Factory Dashboard',
};

export default function NotificationSettingsPage() {
  return (
    <div
      className="min-h-full"
      style={{ background: '#FAFAF9', padding: '32px' }}
    >
      {/* Page header */}
      <div className="flex items-center gap-3" style={{ marginBottom: '32px' }}>
        <div
          className="flex items-center justify-center rounded-lg"
          style={{ width: '40px', height: '40px', background: '#CCFBF1' }}
        >
          <Bell style={{ width: '20px', height: '20px', color: '#0D9488' }} />
        </div>
        <div>
          <h1 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: '40px',
            lineHeight: 1.2,
            fontWeight: 400,
            color: '#1C1917',
            margin: 0,
          }}>
            Notification Preferences
          </h1>
          <p style={{ fontSize: '15px', color: '#44403C', marginTop: '4px' }}>
            Control which pipeline events notify you and when.
          </p>
        </div>
      </div>

      {/* Max content width */}
      <div style={{ maxWidth: '640px' }}>
        <NotificationPreferencesForm />
      </div>
    </div>
  );
}
