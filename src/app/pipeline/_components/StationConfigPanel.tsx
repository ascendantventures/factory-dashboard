'use client';

import { useState } from 'react';
import { StationConfig } from './types';
import { toast } from 'sonner';

const CLAUDE_MODELS = [
  { value: 'claude-haiku-4-5', label: 'claude-haiku-4-5' },
  { value: 'claude-sonnet-4-6', label: 'claude-sonnet-4-6' },
  { value: 'claude-opus-4-6', label: 'claude-opus-4-6' },
];

interface Props {
  stations: StationConfig[];
  onSaved: () => void;
}

interface RowState {
  model_id: string;
  concurrency: number;
  timeout_seconds: number;
  is_enabled: boolean;
  saving: boolean;
  dirty: boolean;
}

export default function StationConfigPanel({ stations, onSaved }: Props) {
  const [rows, setRows] = useState<Record<string, RowState>>(() => {
    const init: Record<string, RowState> = {};
    for (const s of stations) {
      init[s.station_name] = {
        model_id: s.model_id,
        concurrency: s.concurrency,
        timeout_seconds: s.timeout_seconds,
        is_enabled: s.is_enabled,
        saving: false,
        dirty: false,
      };
    }
    return init;
  });

  function updateRow(stationName: string, updates: Partial<RowState>) {
    setRows((prev) => ({
      ...prev,
      [stationName]: { ...prev[stationName], ...updates, dirty: true },
    }));
  }

  async function saveRow(stationName: string) {
    const row = rows[stationName];
    if (!row) return;
    setRows((prev) => ({ ...prev, [stationName]: { ...prev[stationName], saving: true } }));
    try {
      const res = await fetch('/api/pipeline/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          station_name: stationName,
          model_id: row.model_id,
          concurrency: row.concurrency,
          timeout_seconds: row.timeout_seconds,
          is_enabled: row.is_enabled,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`${stationName} saved`);
        setRows((prev) => ({ ...prev, [stationName]: { ...prev[stationName], dirty: false } }));
        onSaved();
      } else {
        toast.error(data.error || 'Save failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setRows((prev) => ({ ...prev, [stationName]: { ...prev[stationName], saving: false } }));
    }
  }

  const inputStyle = {
    height: '36px',
    background: '#141721',
    border: '1px solid #2A2F42',
    borderRadius: '8px',
    padding: '0 12px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '14px',
    color: '#F1F3F9',
    outline: 'none',
    width: '100%',
  };

  const stationOrder = ['intake', 'spec', 'design', 'build', 'qa'];
  const orderedStations = stationOrder
    .filter((name) => rows[name])
    .concat(Object.keys(rows).filter((name) => !stationOrder.includes(name)));

  return (
    <div
      data-testid="station-config-panel"
      style={{
        background: '#141721',
        border: '1px solid #2A2F42',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #2A2F42',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <h3
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '18px',
            fontWeight: 600,
            color: '#F1F3F9',
          }}
        >
          Station Configuration
        </h3>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
          <thead>
            <tr style={{ background: '#1C1F2E', borderBottom: '1px solid #2A2F42' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7489', width: '100px' }}>Station</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7489' }}>Model</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7489', width: '120px' }}>Concurrency</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7489', width: '140px' }}>Timeout (s)</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7489', width: '80px' }}>Enabled</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7489', width: '80px' }}></th>
            </tr>
          </thead>
          <tbody>
            {orderedStations.map((stationName, i) => {
              const row = rows[stationName];
              if (!row) return null;
              return (
                <tr
                  key={stationName}
                  data-testid={`config-row-${stationName}`}
                  style={{
                    borderBottom: i < orderedStations.length - 1 ? '1px solid #2A2F42' : 'none',
                  }}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        background: 'rgba(59,130,246,0.15)',
                        color: '#3B82F6',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '12px',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    >
                      {stationName}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <select
                      value={row.model_id}
                      onChange={(e) => updateRow(stationName, { model_id: e.target.value })}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      {CLAUDE_MODELS.map((m) => (
                        <option key={m.value} value={m.value} style={{ background: '#1C1F2E' }}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={row.concurrency}
                      onChange={(e) => updateRow(stationName, { concurrency: parseInt(e.target.value, 10) || 1 })}
                      style={{ ...inputStyle, width: '80px' }}
                    />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <input
                      type="number"
                      min={60}
                      max={7200}
                      value={row.timeout_seconds}
                      onChange={(e) => updateRow(stationName, { timeout_seconds: parseInt(e.target.value, 10) || 1800 })}
                      style={{ ...inputStyle, width: '100px' }}
                    />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => updateRow(stationName, { is_enabled: !row.is_enabled })}
                      style={{
                        width: '44px',
                        height: '24px',
                        borderRadius: '9999px',
                        border: 'none',
                        cursor: 'pointer',
                        background: row.is_enabled ? '#3B82F6' : '#2A2F42',
                        position: 'relative',
                        transition: 'background 200ms ease',
                        flexShrink: 0,
                      }}
                      role="switch"
                      aria-checked={row.is_enabled}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: '3px',
                          left: row.is_enabled ? '23px' : '3px',
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: '#FFFFFF',
                          transition: 'left 200ms cubic-bezier(0.25,1,0.5,1)',
                        }}
                      />
                    </button>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => saveRow(stationName)}
                      disabled={row.saving || !row.dirty}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: row.dirty ? '#3B82F6' : '#2A2F42',
                        color: row.dirty ? '#FFFFFF' : '#6B7489',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: row.saving || !row.dirty ? 'not-allowed' : 'pointer',
                        opacity: row.saving ? 0.6 : 1,
                        transition: 'all 150ms ease',
                      }}
                    >
                      {row.saving ? 'Saving...' : 'Save'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
