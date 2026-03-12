'use client';

export default function DesignReferenceTag() {
  return (
    <span
      data-testid="design-reference-tag"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        background: '#DCFCE7',
        color: '#16A34A',
        borderRadius: '6px',
        fontFamily: '"Instrument Sans", system-ui, sans-serif',
        fontSize: '12px',
        fontWeight: 500,
        letterSpacing: '0.01em',
      }}
    >
      has-design-reference
    </span>
  );
}
