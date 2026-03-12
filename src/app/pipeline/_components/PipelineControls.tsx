'use client';

import { useState } from 'react';
import { Play, Square, Zap, Unlock, TimerOff } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import { LoopStatus } from './types';
import { toast } from 'sonner';

type ControlAction = 'start_loop' | 'stop_loop' | 'force_tick' | 'clear_locks' | 'clear_backoff';

interface Props {
  loop: LoopStatus;
  onActionComplete: () => void;
}

export default function PipelineControls({ loop, onActionComplete }: Props) {
  const [pending, setPending] = useState<ControlAction | null>(null);
  const [confirm, setConfirm] = useState<ControlAction | null>(null);

  async function executeAction(action: ControlAction) {
    setPending(action);
    setConfirm(null);
    try {
      const res = await fetch('/api/pipeline/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(data.message || 'Action completed');
        onActionComplete();
      } else {
        toast.error(data.message || data.error || 'Action failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setPending(null);
    }
  }

  const isRunning = loop.running;
  const disabled = pending !== null;

  const btnStyle = (variant: 'primary' | 'danger' | 'secondary', action: ControlAction) => ({
    padding: '10px 20px',
    borderRadius: '8px',
    border: variant === 'secondary' ? '1px solid #2A2F42' : 'none',
    background:
      variant === 'primary' ? '#3B82F6' :
      variant === 'danger' ? '#EF4444' :
      'transparent',
    color: variant === 'secondary' ? '#F1F3F9' : '#FFFFFF',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '14px',
    fontWeight: variant === 'secondary' ? 500 : 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled && pending !== action ? 0.4 : 1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minHeight: '40px',
    transition: 'all 150ms ease',
  });

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
      {/* Start/Stop Loop */}
      {!isRunning ? (
        <button
          style={btnStyle('primary', 'start_loop')}
          disabled={disabled}
          onClick={() => executeAction('start_loop')}
        >
          <Play size={16} />
          {pending === 'start_loop' ? 'Starting...' : 'Start Loop'}
        </button>
      ) : (
        <button
          style={btnStyle('danger', 'stop_loop')}
          disabled={disabled}
          onClick={() => setConfirm('stop_loop')}
        >
          <Square size={16} />
          {pending === 'stop_loop' ? 'Stopping...' : 'Stop Loop'}
        </button>
      )}

      {/* Force Tick */}
      <button
        style={btnStyle('secondary', 'force_tick')}
        disabled={disabled}
        onClick={() => setConfirm('force_tick')}
      >
        <Zap size={16} />
        {pending === 'force_tick' ? 'Ticking...' : 'Force Tick'}
      </button>

      {/* Clear Locks */}
      <button
        style={btnStyle('secondary', 'clear_locks')}
        disabled={disabled}
        onClick={() => setConfirm('clear_locks')}
      >
        <Unlock size={16} />
        {pending === 'clear_locks' ? 'Clearing...' : 'Clear Locks'}
      </button>

      {/* Clear Backoff */}
      <button
        style={btnStyle('secondary', 'clear_backoff')}
        disabled={disabled}
        onClick={() => setConfirm('clear_backoff')}
      >
        <TimerOff size={16} />
        {pending === 'clear_backoff' ? 'Clearing...' : 'Clear Backoff'}
      </button>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={confirm === 'stop_loop'}
        onClose={() => setConfirm(null)}
        onConfirm={() => executeAction('stop_loop')}
        title="Stop the pipeline loop?"
        body="This will halt all active processing. Currently running agents will complete their current operation before stopping."
        icon={<Square size={40} color="#EF4444" />}
        confirmLabel="Stop Loop"
        confirmVariant="danger"
        loading={pending === 'stop_loop'}
      />

      <ConfirmDialog
        open={confirm === 'force_tick'}
        onClose={() => setConfirm(null)}
        onConfirm={() => executeAction('force_tick')}
        title="Force immediate tick?"
        body="This will trigger an immediate pipeline scan and begin processing the next eligible issue."
        icon={<Zap size={40} color="#F59E0B" />}
        confirmLabel="Force Tick"
        confirmVariant="primary"
        loading={pending === 'force_tick'}
      />

      <ConfirmDialog
        open={confirm === 'clear_locks'}
        onClose={() => setConfirm(null)}
        onConfirm={() => executeAction('clear_locks')}
        title="Clear all agent locks?"
        body="This will remove all active lock files. Use this only if agents have crashed and left stale locks."
        icon={<Unlock size={40} color="#F59E0B" />}
        confirmLabel="Clear Locks"
        confirmVariant="primary"
        loading={pending === 'clear_locks'}
      />

      <ConfirmDialog
        open={confirm === 'clear_backoff'}
        onClose={() => setConfirm(null)}
        onConfirm={() => executeAction('clear_backoff')}
        title="Clear all backoff timers?"
        body="This will reset crash backoff timers for all issues, allowing immediate retry of previously failing issues."
        icon={<TimerOff size={40} color="#F59E0B" />}
        confirmLabel="Clear Backoff"
        confirmVariant="primary"
        loading={pending === 'clear_backoff'}
      />
    </div>
  );
}
