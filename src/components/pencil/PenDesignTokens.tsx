'use client';

import type { PenVariable } from '@/lib/pen-types';

interface Props {
  variables: PenVariable[];
}

export default function PenDesignTokens({ variables }: Props) {
  const colors = variables.filter((v) => v.type === 'color');
  const typography = variables.filter((v) => v.type === 'typography');
  const spacing = variables.filter((v) => v.type === 'spacing' || v.type === 'number');

  if (variables.length === 0) {
    return (
      <div
        data-testid="pen-tokens-panel"
        style={{
          fontFamily: '"Instrument Sans", system-ui, sans-serif',
          color: '#9C9792',
          fontSize: '14px',
          padding: '24px 0',
          textAlign: 'center',
        }}
      >
        No design tokens defined in this file.
      </div>
    );
  }

  return (
    <div data-testid="pen-tokens-panel" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {colors.length > 0 && (
        <section>
          <h4 style={{
            fontFamily: '"Instrument Sans", system-ui, sans-serif',
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#9C9792',
            marginBottom: '16px',
          }}>
            Colors
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {colors.map((v) => (
              <div key={v.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: String(v.value),
                    border: '1px solid #E8E5E1',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontFamily: '"Instrument Sans", system-ui, sans-serif', fontSize: '13px', fontWeight: 500, color: '#1F1E1C' }}>
                    {v.name}
                  </div>
                  <div style={{ fontFamily: '"SF Mono", "Fira Code", monospace', fontSize: '12px', color: '#9C9792' }}>
                    {String(v.value)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {typography.length > 0 && (
        <section>
          <h4 style={{
            fontFamily: '"Instrument Sans", system-ui, sans-serif',
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#9C9792',
            marginBottom: '16px',
          }}>
            Typography
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {typography.map((v) => (
              <div
                key={v.name}
                style={{
                  padding: '12px 16px',
                  background: '#F9F8F6',
                  borderRadius: '8px',
                  border: '1px solid #E8E5E1',
                }}
              >
                <div style={{ fontFamily: '"Instrument Sans", system-ui, sans-serif', fontSize: '13px', fontWeight: 500, color: '#1F1E1C', marginBottom: '4px' }}>
                  {v.name}
                </div>
                <div style={{ fontFamily: '"SF Mono", "Fira Code", monospace', fontSize: '12px', color: '#9C9792' }}>
                  {v.fontFamily ?? String(v.value)} · {v.fontSize ?? '—'}px · {v.fontWeight ?? 400}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {spacing.length > 0 && (
        <section>
          <h4 style={{
            fontFamily: '"Instrument Sans", system-ui, sans-serif',
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#9C9792',
            marginBottom: '16px',
          }}>
            Spacing
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {spacing.map((v) => (
              <div
                key={v.name}
                style={{
                  padding: '8px 12px',
                  background: '#F9F8F6',
                  borderRadius: '6px',
                  border: '1px solid #E8E5E1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                <div style={{ fontFamily: '"Instrument Sans", system-ui, sans-serif', fontSize: '13px', fontWeight: 500, color: '#1F1E1C' }}>
                  {v.name}
                </div>
                <div style={{ fontFamily: '"SF Mono", "Fira Code", monospace', fontSize: '12px', color: '#9C9792' }}>
                  {Number(v.value)}px
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
