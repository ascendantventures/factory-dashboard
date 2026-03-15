import { NotificationPreferencesForm } from '@/components/notifications/NotificationPreferencesForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Notification Preferences — Factory Dashboard',
};

export default function NotificationSettingsPage() {
  return <NotificationPreferencesForm />;
}
