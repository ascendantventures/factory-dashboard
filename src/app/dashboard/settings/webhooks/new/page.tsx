import Link from 'next/link';
import WebhookForm from '@/components/webhooks/WebhookForm';

export const dynamic = 'force-dynamic';

export default function NewWebhookPage() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-2">
          <Link href="/dashboard/settings" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#6B7380', textDecoration: 'none' }}>Settings</Link>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3l4 4-4 4" stroke="#6B7380" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <Link href="/dashboard/settings/webhooks" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#6B7380', textDecoration: 'none' }}>Webhooks</Link>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3l4 4-4 4" stroke="#6B7380" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 500, color: '#B8BFC7' }}>New</span>
        </div>
        <h1 style={{
          fontFamily: 'Space Grotesk, system-ui, sans-serif',
          fontSize: '32px',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: '#F0F2F4',
          margin: 0,
          lineHeight: 1.2,
        }}>
          Add Webhook
        </h1>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#B8BFC7', marginTop: '6px' }}>
          Configure where to send pipeline events
        </p>
      </div>

      {/* Form Card */}
      <div
        style={{
          background: '#161A1F',
          border: '1px solid #2E353D',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <WebhookForm mode="create" />
      </div>
    </div>
  );
}
