'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle } from 'lucide-react';

export default function DeleteWebhookButton({ webhookId }: { webhookId: string }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/settings/webhooks/${webhookId}`, { method: 'DELETE' });
      router.push('/dashboard/settings/webhooks');
      router.refresh();
    } catch {
      setDeleting(false);
      setShowModal(false);
    }
  }

  return (
    <>
      <button
        data-testid="delete-webhook-btn"
        type="button"
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2"
        style={{
          background: '#EF4444',
          border: 'none',
          borderRadius: '8px',
          padding: '10px 16px',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          fontWeight: 600,
          color: '#FFFFFF',
          cursor: 'pointer',
          minHeight: '40px',
          flexShrink: 0,
          transition: 'background 150ms ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#DC2626'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#EF4444'; }}
      >
        <Trash2 size={14} />
        Delete Webhook
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: '#161A1F',
              border: '1px solid #2E353D',
              borderRadius: '16px',
              maxWidth: '420px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)' }}
              >
                <AlertTriangle size={20} color="#EF4444" />
              </div>
              <div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '18px', fontWeight: 600, color: '#F0F2F4', marginBottom: '4px' }}>
                  Delete Webhook
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#B8BFC7', lineHeight: 1.6 }}>
                  Permanently remove this webhook and all delivery history. This action cannot be undone.
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid #2E353D',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#F0F2F4',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                data-testid="confirm-delete-btn"
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  background: '#EF4444',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? 'Deleting…' : 'Delete Webhook'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
