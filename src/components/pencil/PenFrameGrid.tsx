'use client';

import type { PenFrame, PenVariable } from '@/lib/pen-types';
import PenFrameCanvas from './PenFrameCanvas';

interface Props {
  frames: PenFrame[];
  variables: PenVariable[];
  onFrameClick: (index: number) => void;
}

const THUMBNAIL_MAX_WIDTH = 240;

function getThumbnailScale(frame: PenFrame): number {
  if (frame.width <= THUMBNAIL_MAX_WIDTH) return 1;
  return THUMBNAIL_MAX_WIDTH / frame.width;
}

export default function PenFrameGrid({ frames, variables, onFrameClick }: Props) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '24px',
      }}
    >
      {frames.map((frame, i) => {
        const scale = getThumbnailScale(frame);
        const thumbW = Math.round(frame.width * scale);
        const thumbH = Math.round(frame.height * scale);

        return (
          <button
            key={frame.id}
            data-testid="pen-frame-thumbnail"
            onClick={() => onFrameClick(i)}
            style={{
              all: 'unset',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: `${thumbW}px`,
                height: `${thumbH}px`,
                background: '#F9F8F6',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #E8E5E1',
                transition: 'box-shadow 150ms ease, border-color 150ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 2px #E85D4C';
                (e.currentTarget as HTMLDivElement).style.borderColor = '#E85D4C';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                (e.currentTarget as HTMLDivElement).style.borderColor = '#E8E5E1';
              }}
            >
              <PenFrameCanvas
                frame={frame}
                variables={variables}
                scale={scale}
              />
            </div>
            <span
              style={{
                fontFamily: '"Instrument Sans", system-ui, sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                color: '#5C5955',
                textAlign: 'center',
                maxWidth: `${thumbW}px`,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {frame.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
