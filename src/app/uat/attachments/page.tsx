import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { IssueAttachmentsPanel } from '@/components/uat/IssueAttachmentsPanel';

interface SearchParams {
  issue?: string;
}

export default async function AttachmentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const params = await searchParams;
  const issueNumber = parseInt(params.issue ?? '49', 10);
  const resolvedIssue = isNaN(issueNumber) ? 49 : issueNumber;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#09090B',
      padding: '32px',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        height: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <IssueAttachmentsPanel issueNumber={resolvedIssue} />
      </div>
    </div>
  );
}
