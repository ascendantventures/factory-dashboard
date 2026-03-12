'use client';

import { useState } from 'react';

interface FeedbackDialogProps {
  onConfirm: (feedback: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function FeedbackDialog({ onConfirm, onCancel, loading }: FeedbackDialogProps) {
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!feedback.trim()) {
      setError('Feedback is required');
      return;
    }
    setError('');
    onConfirm(feedback.trim());
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        data-testid="feedback-dialog"
        style={{
          background: '#FFFFFF',
          borderRadius: 12,
          boxShadow: '0 20px 25px rgba(15, 23, 42, 0.08), 0 8px 10px rgba(15, 23, 42, 0.04)',
          width: 440,
          maxWidth: 'calc(100vw - 32px)',
          overflow: 'hidden',
          animation: 'dialogEnter 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 600, color: '#0F172A' }}>
            Request changes
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#475569', marginTop: 4 }}>
            Describe what needs to be revised in this spec.
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>
            Feedback
          </label>
          <textarea
            data-testid="feedback-textarea"
            value={feedback}
            onChange={(e) => { setFeedback(e.target.value); if (error) setError(''); }}
            placeholder="Describe what needs to be changed..."
            style={{
              width: '100%', minHeight: 160,
              fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#0F172A',
              background: '#FFFFFF',
              border: `1px solid ${error ? '#DC2626' : '#E2E8F0'}`,
              borderRadius: 8, padding: 12,
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: error ? '0 0 0 3px rgba(220, 38, 38, 0.12)' : 'none',
            }}
            onFocus={(e) => {
              if (!error) {
                e.currentTarget.style.borderColor = '#2563EB';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)';
              }
            }}
            onBlur={(e) => {
              if (!error) {
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          />
          {error ? (
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#DC2626', marginTop: 6 }}>
              {error}
            </div>
          ) : (
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#94A3B8', marginTop: 6 }}>
              This will be posted as a comment on the GitHub issue
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          background: '#FAFBFC',
          borderTop: '1px solid #E2E8F0',
          display: 'flex', gap: 12, justifyContent: 'flex-end',
        }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
              padding: '10px 16px', borderRadius: 8,
              background: 'transparent', border: 'none',
              color: '#475569', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            data-testid="feedback-submit-btn"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
              padding: '10px 20px', borderRadius: 8,
              background: loading ? '#94A3B8' : '#2563EB',
              border: 'none', color: '#FFFFFF',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 150ms ease-out',
            }}
          >
            {loading ? 'Posting…' : 'Post feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}
