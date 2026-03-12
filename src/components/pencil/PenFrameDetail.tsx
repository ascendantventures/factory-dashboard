'use client';

import { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PenFrame, PenVariable } from '@/lib/pen-types';
import PenFrameCanvas from './PenFrameCanvas';

interface Props {
  frames: PenFrame[];
  variables: PenVariable[];
  activeIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

function getDetailScale(frame: PenFrame): number {
  const maxW = typeof window !== 'undefined' ? window.innerWidth * 0.85 : 1200;
  const maxH = typeof window !== 'undefined' ? window.innerHeight * 0.75 : 800;
  const scaleW = frame.width > maxW ? maxW / frame.width : 1;
  const scaleH = frame.height > maxH ? maxH / frame.height : 1;
  return Math.min(scaleW, scaleH, 1);
}

export default function PenFrameDetail({ frames, variables, activeIndex, onClose, onNavigate }: Props) {
  const frame = frames[activeIndex];
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < frames.length - 1;

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(activeIndex - 1);
      if (e.key === 'ArrowRight' && hasNext) onNavigate(activeIndex + 1);
    },
    [onClose, onNavigate, activeIndex, hasPrev, hasNext]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  if (!frame) return null;

  const scale = getDetailScale(frame);

  return (
    <div
      data-testid="pen-frame-detail"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(31, 30, 28, 0.7)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'relative',
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 20px 25px rgba(31, 30, 28, 0.06), 0 8px 10px rgba(31, 30, 28, 0.04)',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ fontFamily: '"Instrument Sans", system-ui, sans-serif', fontSize: '18px', fontWeight: 600, color: '#1F1E1C' }}>
              {frame.name}
            </div>
            <div style={{ fontFamily: '"Instrument Sans", system-ui, sans-serif', fontSize: '12px', color: '#9C9792', marginTop: '2px' }}>
              {frame.width} × {frame.height}px
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              all: 'unset',
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              transition: 'background 150ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F9F8F6')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={20} color="#5C5955" />
          </button>
        </div>

        {/* Canvas */}
        <div style={{ overflow: 'auto', background: '#F9F8F6', borderRadius: '8px', padding: '16px' }}>
          <PenFrameCanvas
            frame={frame}
            variables={variables}
            scale={scale}
            data-testid="pen-frame-detail-canvas"
          />
        </div>

        {/* Navigation */}
        {frames.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <button
              onClick={() => hasPrev && onNavigate(activeIndex - 1)}
              disabled={!hasPrev}
              aria-label="Previous frame"
              style={{
                all: 'unset',
                cursor: hasPrev ? 'pointer' : 'not-allowed',
                opacity: hasPrev ? 1 : 0.3,
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                border: '1px solid #E8E5E1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#FFFFFF',
                transition: 'background 150ms',
              }}
              onMouseEnter={(e) => hasPrev && (e.currentTarget.style.background = '#F9F8F6')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
            >
              <ChevronLeft size={20} color="#5C5955" />
            </button>
            <span style={{ fontFamily: '"Instrument Sans", system-ui, sans-serif', fontSize: '14px', color: '#9C9792' }}>
              {activeIndex + 1} / {frames.length}
            </span>
            <button
              onClick={() => hasNext && onNavigate(activeIndex + 1)}
              disabled={!hasNext}
              aria-label="Next frame"
              style={{
                all: 'unset',
                cursor: hasNext ? 'pointer' : 'not-allowed',
                opacity: hasNext ? 1 : 0.3,
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                border: '1px solid #E8E5E1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#FFFFFF',
                transition: 'background 150ms',
              }}
              onMouseEnter={(e) => hasNext && (e.currentTarget.style.background = '#F9F8F6')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
            >
              <ChevronRight size={20} color="#5C5955" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
