'use client';

import { useState } from 'react';
import { Zap, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface TestResult {
  status_code: number | null;
  response_body: string;
  sent_at: string;
}

interface TestWebhookButtonProps {
  webhookId: string;
}

export default function TestWebhookButton({ webhookId }: TestWebhookButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  async function handleTest() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/settings/webhooks/${webhookId}/test`, { method: 'POST' });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ status_code: null, response_body: 'Network error', sent_at: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  }

  const isSuccess = result && result.status_code !== null && result.status_code >= 200 && result.status_code < 300;
  const isError = result && (result.status_code === null || result.status_code >= 400);

  return (
    <div>
      <button
        data-testid="test-webhook-btn"
        type="button"
        onClick={handleTest}
        disabled={loading}
        className="flex items-center gap-2"
        style={{
          background: 'transparent',
          border: '1px solid #2E353D',
          borderRadius: '8px',
          padding: '10px 16px',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          fontWeight: 500,
          color: loading ? '#6B7380' : '#F0F2F4',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          minHeight: '44px',
          transition: 'all 150ms ease',
        }}
        onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#1E2329'; }}
        onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = 'transparent'; }}
      >
        {loading
          ? <Loader2 size={16} className="animate-spin" />
          : <Zap size={16} />
        }
        {loading ? 'Sending…' : 'Send Test'}
      </button>

      {result && (
        <div
          data-testid="test-result"
          className="flex items-start gap-3 mt-3"
          style={{
            padding: '12px 16px',
            background: '#1E2329',
            border: `1px solid #2E353D`,
            borderLeft: `3px solid ${isSuccess ? '#10B981' : '#EF4444'}`,
            borderRadius: '8px',
          }}
        >
          {isSuccess
            ? <CheckCircle2 size={18} color="#10B981" className="flex-shrink-0 mt-0.5" />
            : <XCircle size={18} color="#EF4444" className="flex-shrink-0 mt-0.5" />
          }
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: isSuccess ? '#0D2E24' : '#2E1515',
                  color: isSuccess ? '#10B981' : '#EF4444',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {result.status_code ?? 'timeout'}
              </span>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#6B7380' }}>
                {isSuccess ? 'Delivered successfully' : isError ? 'Delivery failed' : 'No response'}
              </span>
            </div>
            {result.response_body && (
              <div
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '12px',
                  color: '#6B7380',
                  maxHeight: '60px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {result.response_body.slice(0, 120)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
