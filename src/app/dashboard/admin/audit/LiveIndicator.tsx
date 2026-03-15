'use client';

export type LiveStatus = 'SUBSCRIBED' | 'CONNECTING' | 'CLOSED' | 'CHANNEL_ERROR';

interface LiveIndicatorProps {
  status: LiveStatus;
}

const statusConfig: Record<LiveStatus, { label: string; dotClass: string; dataStatus: string }> = {
  SUBSCRIBED: { label: 'Live', dotClass: 'live-dot--connected', dataStatus: 'connected' },
  CONNECTING: { label: 'Connecting\u2026', dotClass: 'live-dot--connecting', dataStatus: 'connecting' },
  CLOSED: { label: 'Paused', dotClass: 'live-dot--paused', dataStatus: 'paused' },
  CHANNEL_ERROR: { label: 'Paused', dotClass: 'live-dot--paused', dataStatus: 'paused' },
};

export function LiveIndicator({ status }: LiveIndicatorProps) {
  const cfg = statusConfig[status] ?? statusConfig.CLOSED;

  return (
    <>
      <style>{`
        .live-indicator {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 9999px;
          background: var(--surface, #18181B);
          border: 1px solid var(--border, #3F3F46);
        }
        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .live-dot--connected {
          background: #22C55E;
          animation: live-pulse 2s ease-in-out infinite;
        }
        .live-dot--connecting {
          background: #F59E0B;
        }
        .live-dot--paused {
          background: #71717A;
        }
        .live-label {
          font-family: Inter, system-ui, sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary, #A1A1AA);
        }
        @keyframes live-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.15); }
        }
        @media (prefers-reduced-motion: reduce) {
          .live-dot--connected { animation: none; }
        }
      `}</style>
      <div
        className="live-indicator"
        data-testid="live-indicator"
        data-status={cfg.dataStatus}
        role="status"
        aria-live="polite"
        aria-label={`Audit log live connection status: ${cfg.dataStatus}`}
      >
        <span className={`live-dot ${cfg.dotClass}`} />
        <span className="live-label">{cfg.label}</span>
      </div>
    </>
  );
}
