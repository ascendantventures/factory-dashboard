'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreVertical, SkipForward, Ban, RotateCcw, ArrowRight, ArrowLeft } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import { toast } from 'sonner';

type IssueAction = 'skip' | 'block' | 'retry' | 'advance' | 'revert';

interface Props {
  issueNumber: number;
  currentStation?: string;
  onActionComplete?: () => void;
}

export default function IssueActionMenu({ issueNumber, currentStation, onActionComplete }: Props) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<IssueAction | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [pending, setPending] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  async function executeAction(action: IssueAction, reason?: string) {
    setPending(true);
    setConfirm(null);
    setOpen(false);
    try {
      const res = await fetch(`/api/issues/${issueNumber}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Issue #${issueNumber}: ${action} applied (${data.label_applied})`);
        onActionComplete?.();
      } else {
        toast.error(data.error || 'Action failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setPending(false);
      setBlockReason('');
    }
  }

  const menuItemStyle = (destructive = false) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '6px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '14px',
    color: destructive ? '#EF4444' : '#B4BCCE',
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    width: '100%',
    textAlign: 'left' as const,
    transition: 'all 100ms ease',
  });

  return (
    <>
      <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
        <button
          data-testid="issue-action-menu-trigger"
          onClick={() => setOpen(!open)}
          disabled={pending}
          style={{
            width: '36px',
            height: '36px',
            border: '1px solid #2A2F42',
            borderRadius: '8px',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#B4BCCE',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#1E2235';
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#3D4560';
            (e.currentTarget as HTMLButtonElement).style.color = '#F1F3F9';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#2A2F42';
            (e.currentTarget as HTMLButtonElement).style.color = '#B4BCCE';
          }}
        >
          <MoreVertical size={18} />
        </button>

        {open && (
          <div
            data-testid="issue-action-menu"
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              background: '#1C1F2E',
              border: '1px solid #2A2F42',
              borderRadius: '8px',
              padding: '4px',
              minWidth: '180px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              zIndex: 100,
              animation: 'scaleIn 150ms cubic-bezier(0.25,1,0.5,1)',
            }}
          >
            <button
              role="menuitem"
              style={menuItemStyle()}
              onClick={() => { setOpen(false); executeAction('skip'); }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#2A2F42', e.currentTarget.style.color = '#F1F3F9')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = '#B4BCCE')}
            >
              <SkipForward size={16} />
              Skip Issue
            </button>

            <button
              role="menuitem"
              style={menuItemStyle()}
              onClick={() => { setOpen(false); setConfirm('block'); }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#2A2F42', e.currentTarget.style.color = '#F1F3F9')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = '#B4BCCE')}
            >
              <Ban size={16} />
              Block Issue
            </button>

            <div style={{ height: '1px', background: '#2A2F42', margin: '4px 0' }} />

            <button
              role="menuitem"
              style={menuItemStyle()}
              onClick={() => { setOpen(false); executeAction('retry'); }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#2A2F42', e.currentTarget.style.color = '#F1F3F9')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = '#B4BCCE')}
            >
              <RotateCcw size={16} />
              Retry Stage
            </button>

            <button
              role="menuitem"
              style={menuItemStyle()}
              onClick={() => { setOpen(false); setConfirm('advance'); }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#2A2F42', e.currentTarget.style.color = '#F1F3F9')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = '#B4BCCE')}
            >
              <ArrowRight size={16} />
              Advance Stage
            </button>

            <button
              role="menuitem"
              style={menuItemStyle()}
              onClick={() => { setOpen(false); executeAction('revert'); }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#2A2F42', e.currentTarget.style.color = '#F1F3F9')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = '#B4BCCE')}
            >
              <ArrowLeft size={16} />
              Revert Stage
            </button>
          </div>
        )}
      </div>

      {/* Block dialog */}
      <ConfirmDialog
        open={confirm === 'block'}
        onClose={() => { setConfirm(null); setBlockReason(''); }}
        onConfirm={() => executeAction('block', blockReason)}
        title={`Block issue #${issueNumber}?`}
        body="This will prevent the pipeline from processing this issue until manually unblocked."
        icon={<Ban size={40} color="#F59E0B" />}
        confirmLabel="Block Issue"
        confirmVariant="primary"
        loading={pending}
      >
        <div>
          <label
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              fontWeight: 500,
              color: '#B4BCCE',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            Reason (required)
          </label>
          <input
            aria-label="reason"
            placeholder="Why is this issue being blocked?"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            style={{
              width: '100%',
              height: '40px',
              background: '#141721',
              border: '1px solid #2A2F42',
              borderRadius: '8px',
              padding: '0 12px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              color: '#F1F3F9',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </ConfirmDialog>

      {/* Advance dialog */}
      <ConfirmDialog
        open={confirm === 'advance'}
        onClose={() => setConfirm(null)}
        onConfirm={() => executeAction('advance')}
        title="Advance to next station?"
        body={`This will manually move issue #${issueNumber}${currentStation ? ` from '${currentStation}'` : ''} to the next station without agent processing.`}
        icon={<ArrowRight size={40} color="#3B82F6" />}
        confirmLabel="Advance"
        confirmVariant="primary"
        loading={pending}
      />

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(-4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
}
