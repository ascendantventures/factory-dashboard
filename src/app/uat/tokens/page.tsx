import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { TokenManagementPage } from '@/components/uat/TokenManagementPage';

export default async function TokensPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  return (
    <div style={{
      minHeight: '100vh',
      background: '#09090B',
      padding: '32px',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <TokenManagementPage />
      </div>
    </div>
  );
}
