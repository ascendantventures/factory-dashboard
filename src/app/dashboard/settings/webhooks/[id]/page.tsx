import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import WebhookForm from '@/components/webhooks/WebhookForm';
import TestWebhookButton from '@/components/webhooks/TestWebhookButton';
import DeliveryLog from '@/components/webhooks/DeliveryLog';
import DeleteWebhookButton from './DeleteWebhookButton';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function WebhookDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: webhook } = await supabase
    .from('fd_webhooks')
    .select('id, url, events, enabled, created_at')
    .eq('id', id)
    .single();

  if (!webhook) notFound();

  const { data: deliveries } = await supabase
    .from('fd_webhook_deliveries')
    .select('id, event, payload, status_code, response_body, sent_at')
    .eq('webhook_id', id)
    .order('sent_at', { ascending: false })
    .limit(50);

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
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 500, color: '#B8BFC7' }}>Edit</span>
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
          Edit Webhook
        </h1>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '13px',
            color: '#B8BFC7',
            marginTop: '8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {webhook.url}
        </div>
      </div>

      {/* Edit Form */}
      <div
        style={{
          background: '#161A1F',
          border: '1px solid #2E353D',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <WebhookForm
          mode="edit"
          webhookId={webhook.id}
          initialUrl={webhook.url}
          initialEvents={Array.isArray(webhook.events) ? webhook.events : []}
          initialEnabled={webhook.enabled}
        />
      </div>

      {/* Test Webhook */}
      <div
        style={{
          background: '#161A1F',
          border: '1px solid #2E353D',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '18px', fontWeight: 600, color: '#F0F2F4', margin: 0 }}>
            Test Webhook
          </h3>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#6B7380', marginTop: '4px' }}>
            Send a test payload to verify your endpoint is receiving events correctly.
          </p>
        </div>
        <TestWebhookButton webhookId={webhook.id} />
      </div>

      {/* Delivery Log */}
      <div
        style={{
          background: '#161A1F',
          border: '1px solid #2E353D',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '18px', fontWeight: 600, color: '#F0F2F4', margin: 0 }}>
            Delivery Log
          </h3>
          <span
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#6B7380',
            }}
          >
            Last 50 deliveries
          </span>
        </div>
        <DeliveryLog deliveries={deliveries ?? []} />
      </div>

      {/* Danger Zone */}
      <div
        style={{
          background: '#161A1F',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '18px', fontWeight: 600, color: '#F0F2F4', margin: 0 }}>
              Delete Webhook
            </h3>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#B8BFC7', marginTop: '4px' }}>
              Permanently remove this webhook and all delivery history.
            </p>
          </div>
          <DeleteWebhookButton webhookId={webhook.id} />
        </div>
      </div>
    </div>
  );
}
