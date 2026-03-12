import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { AttachmentPreview } from '@/components/uat/AttachmentPreview';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AttachmentDetailPage({ params }: Props) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { id } = await params;

  const { data: attachment, error } = await supabase
    .from('uat_attachments')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !attachment) notFound();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#09090B',
      padding: '32px',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        {/* Back nav */}
        <Link
          data-testid="back-btn"
          href={`/uat/attachments?issue=${attachment.github_issue_number}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#A1A1AA',
            textDecoration: 'none',
            fontSize: '14px',
            transition: 'color 150ms ease',
          }}
          onMouseEnter={undefined}
        >
          <ArrowLeft size={20} />
          Back to issue #{attachment.github_issue_number}
        </Link>

        {/* Preview */}
        <div style={{
          background: '#18181B',
          border: '1px solid #3F3F46',
          borderRadius: '8px',
          overflow: 'hidden',
          minHeight: '600px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <AttachmentPreview attachment={attachment} />
        </div>
      </div>
    </div>
  );
}
