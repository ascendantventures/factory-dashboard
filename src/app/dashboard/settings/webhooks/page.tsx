import Link from 'next/link';
import { Plus, Webhook } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import WebhookCard from '@/components/webhooks/WebhookCard';

export const dynamic = 'force-dynamic';

export default async function WebhooksSettingsPage() {
  let user = null;
  let webhooks: { id: string; url: string; events: string[]; enabled: boolean; created_at: string }[] | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    user = authUser;

    if (user) {
      const { data, error: webhooksError } = await supabase
        .from('fd_webhooks')
        .select('id, url, events, enabled, created_at')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (webhooksError) {
        console.error('[WebhooksPage] Failed to fetch webhooks:', webhooksError.message);
      } else {
        webhooks = data;
      }
    }
  } catch (err) {
    console.error('[WebhooksPage] Unexpected error during data fetch:', err);
    // webhooks remains null — page will render empty state
  }

  if (!user) {
    return (
      <div style={{ padding: '32px', fontFamily: 'DM Sans, sans-serif', color: '#6B7380' }}>
        Please log in to manage webhooks.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
      <style>{`
        .webhook-add-btn { background: #E85D04; transition: all 150ms cubic-bezier(0.25, 1, 0.5, 1); }
        .webhook-add-btn:hover { background: #C44D03; }
        .preset-card { transition: all 200ms ease; }
        .preset-card:hover { border-color: rgba(232, 93, 4, 0.4) !important; transform: translateY(-2px); }
      `}</style>
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap" style={{ marginBottom: '32px' }}>
        <div>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 mb-2">
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#6B7380' }}>Settings</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3l4 4-4 4" stroke="#6B7380" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 500, color: '#B8BFC7' }}>Webhooks</span>
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
            Webhooks
          </h1>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#B8BFC7', marginTop: '6px' }}>
            Send pipeline events to external services
          </p>
        </div>
        <Link
          href="/dashboard/settings/webhooks/new"
          className="webhook-add-btn flex items-center gap-2"
          style={{
            border: 'none',
            borderRadius: '8px',
            padding: '12px 20px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            fontWeight: 600,
            color: '#FFFFFF',
            textDecoration: 'none',
            minHeight: '44px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Plus size={16} />
          Add Webhook
        </Link>
      </div>

      {/* Integration Presets */}
      <div style={{ marginBottom: '32px' }}>
        <div
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: '#6B7380',
            marginBottom: '12px',
          }}
        >
          Quick Setup
        </div>
        <div className="flex gap-4 flex-wrap">
          {/* Presets with redirect to new page */}
          <Link
            href="/dashboard/settings/webhooks/new?preset=discord"
            data-testid="preset-discord-link"
            className="preset-card"
            style={{
              background: '#161A1F',
              border: '1px solid #2E353D',
              borderRadius: '12px',
              padding: '20px',
              textDecoration: 'none',
              flex: '1 1 200px',
              maxWidth: '280px',
              display: 'block',
            }}
          >
            <div className="flex items-center justify-center mb-3"
              style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#5865F2' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.045.036.059a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
            </div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '16px', fontWeight: 600, color: '#F0F2F4', marginBottom: '4px' }}>
              Discord
            </div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#6B7380' }}>
              Send events to a Discord channel
            </div>
          </Link>

          <Link
            href="/dashboard/settings/webhooks/new?preset=slack"
            data-testid="preset-slack-link"
            className="preset-card"
            style={{
              background: '#161A1F',
              border: '1px solid #2E353D',
              borderRadius: '12px',
              padding: '20px',
              textDecoration: 'none',
              flex: '1 1 200px',
              maxWidth: '280px',
              display: 'block',
            }}
          >
            <div className="flex items-center justify-center mb-3"
              style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#4A154B' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
              </svg>
            </div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '16px', fontWeight: 600, color: '#F0F2F4', marginBottom: '4px' }}>
              Slack
            </div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#6B7380' }}>
              Send events to a Slack channel
            </div>
          </Link>
        </div>
      </div>

      {/* Webhooks List */}
      <div>
        {(webhooks?.length ?? 0) > 0 && (
          <div
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#6B7380',
              marginBottom: '12px',
            }}
          >
            Your Webhooks
          </div>
        )}

        {(webhooks?.length ?? 0) === 0 ? (
          <div
            style={{
              padding: '48px 32px',
              textAlign: 'center',
              background: '#161A1F',
              border: '1px solid #2E353D',
              borderRadius: '12px',
            }}
          >
            <div className="flex justify-center mb-4">
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: '#1E2329',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Webhook size={28} color="#6B7380" />
              </div>
            </div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '16px', fontWeight: 600, color: '#F0F2F4', marginBottom: '8px' }}>
              No webhooks yet
            </div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#6B7380', marginBottom: '20px' }}>
              Add a webhook to receive pipeline events at an external endpoint.
            </div>
            <Link
              href="/dashboard/settings/webhooks/new"
              style={{
                background: '#E85D04',
                borderRadius: '8px',
                padding: '10px 16px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                color: '#FFFFFF',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Plus size={14} />
              Add your first webhook
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {webhooks!.map((webhook) => (
              <WebhookCard key={webhook.id} webhook={webhook} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
