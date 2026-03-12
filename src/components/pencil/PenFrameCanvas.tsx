'use client';

import { useEffect, useRef } from 'react';
import type { PenFrame, PenVariable, PenElement } from '@/lib/pen-types';

interface Props {
  frame: PenFrame;
  variables: PenVariable[];
  scale?: number;
  className?: string;
  'data-testid'?: string;
}

function resolveColor(value: string | undefined, variables: PenVariable[]): string {
  if (!value) return 'transparent';
  if (value.startsWith('{') && value.endsWith('}')) {
    const varName = value.slice(1, -1);
    const v = variables.find((v) => v.name === varName);
    if (v && v.type === 'color') return String(v.value);
    return '#cccccc'; // fallback for missing variables
  }
  return value;
}

function drawElement(
  ctx: CanvasRenderingContext2D,
  el: PenElement,
  variables: PenVariable[],
  offsetX = 0,
  offsetY = 0
) {
  const x = el.x - offsetX;
  const y = el.y - offsetY;
  const { width, height } = el;

  ctx.globalAlpha = el.opacity ?? 1;

  switch (el.type) {
    case 'rectangle': {
      const fill = resolveColor(el.fill, variables);
      const r = el.cornerRadius ?? 0;
      ctx.beginPath();
      if (r > 0) {
        ctx.roundRect(x, y, width, height, r);
      } else {
        ctx.rect(x, y, width, height);
      }
      ctx.fillStyle = fill;
      ctx.fill();
      if (el.stroke && el.strokeWidth) {
        ctx.strokeStyle = resolveColor(el.stroke, variables);
        ctx.lineWidth = el.strokeWidth;
        ctx.stroke();
      }
      break;
    }
    case 'ellipse': {
      const fill = resolveColor(el.fill, variables);
      ctx.beginPath();
      ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      if (el.stroke && el.strokeWidth) {
        ctx.strokeStyle = resolveColor(el.stroke, variables);
        ctx.lineWidth = el.strokeWidth;
        ctx.stroke();
      }
      break;
    }
    case 'text': {
      const color = resolveColor(el.color ?? el.fill, variables);
      const fontSize = el.fontSize ?? 14;
      const fontWeight = el.fontWeight ?? 400;
      const fontFamily = el.fontFamily ?? 'sans-serif';
      ctx.fillStyle = color;
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.textBaseline = 'top';
      ctx.fillText(el.content ?? '', x, y, width);
      break;
    }
    case 'line': {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + width, y + height);
      ctx.strokeStyle = resolveColor(el.stroke ?? el.fill, variables);
      ctx.lineWidth = el.strokeWidth ?? 1;
      ctx.stroke();
      break;
    }
    case 'group': {
      if (Array.isArray(el.children)) {
        for (const child of el.children) {
          drawElement(ctx, child, variables, offsetX, offsetY);
        }
      }
      break;
    }
    // image and unknown types: skip gracefully
    default:
      break;
  }

  ctx.globalAlpha = 1;
}

export default function PenFrameCanvas({ frame, variables, scale = 1, className, 'data-testid': testId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = Math.round(frame.width * scale);
    const h = Math.round(frame.height * scale);
    canvas.width = w;
    canvas.height = h;

    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.scale(scale, scale);

    for (const el of frame.elements) {
      drawElement(ctx, el, variables, frame.x, frame.y);
    }

    ctx.restore();
  }, [frame, variables, scale]);

  return (
    <canvas
      ref={canvasRef}
      data-testid={testId}
      className={className}
      style={{ display: 'block', maxWidth: '100%' }}
    />
  );
}
