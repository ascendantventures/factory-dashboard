'use client';

import { FolderOpen } from 'lucide-react';

interface Props {
  onUpload?: () => void;
}

export default function EmptyGallery({ onUpload }: Props) {
  return (
    <div
      data-testid="design-gallery-empty"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 32px',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: '#F9F8F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
        }}
      >
        <FolderOpen size={32} color="#9C9792" strokeWidth={1.5} />
      </div>
      <h3 style={{
        fontFamily: '"Instrument Sans", system-ui, sans-serif',
        fontSize: '18px',
        fontWeight: 600,
        color: '#1F1E1C',
        margin: '0 0 8px 0',
      }}>
        No designs yet
      </h3>
      <p style={{
        fontFamily: '"Instrument Sans", system-ui, sans-serif',
        fontSize: '16px',
        color: '#5C5955',
        textAlign: 'center',
        maxWidth: '300px',
        margin: '0 0 24px 0',
        lineHeight: 1.6,
      }}>
        Attach a .pen file to an issue to get started.
      </p>
      {onUpload && (
        <button
          onClick={onUpload}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: '#E85D4C',
            border: 'none',
            borderRadius: '8px',
            fontFamily: '"Instrument Sans", system-ui, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            color: '#FFFFFF',
            cursor: 'pointer',
            transition: 'background 150ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#C94A3B')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#E85D4C')}
        >
          Upload .pen file
        </button>
      )}
    </div>
  );
}
