'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface PayloadViewerProps {
  payload: unknown;
}

// Simple JSON syntax highlighter
function highlightJson(json: string): React.ReactNode[] {
  const lines = json.split('\n');
  return lines.map((line, lineIndex) => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    // Process tokens in each line
    while (remaining.length > 0) {
      // String value (including keys)
      const strMatch = remaining.match(/^("(?:[^"\\]|\\.)*")/);
      if (strMatch) {
        const str = strMatch[1];
        const isKey = remaining.slice(str.length).trimStart().startsWith(':');
        parts.push(
          <span
            key={key++}
            style={{ color: isKey ? '#7EE787' : '#A5D6FF' }}
          >
            {str}
          </span>
        );
        remaining = remaining.slice(str.length);
        continue;
      }

      // Number
      const numMatch = remaining.match(/^(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/);
      if (numMatch) {
        parts.push(
          <span key={key++} style={{ color: '#79C0FF' }}>{numMatch[1]}</span>
        );
        remaining = remaining.slice(numMatch[1].length);
        continue;
      }

      // Boolean/null
      const boolMatch = remaining.match(/^(true|false|null)/);
      if (boolMatch) {
        parts.push(
          <span key={key++} style={{ color: '#FF7B72' }}>{boolMatch[1]}</span>
        );
        remaining = remaining.slice(boolMatch[1].length);
        continue;
      }

      // Punctuation
      const punctMatch = remaining.match(/^([{}[\]:,])/);
      if (punctMatch) {
        parts.push(
          <span key={key++} style={{ color: '#8B949E' }}>{punctMatch[1]}</span>
        );
        remaining = remaining.slice(punctMatch[1].length);
        continue;
      }

      // Whitespace/other
      parts.push(<span key={key++}>{remaining[0]}</span>);
      remaining = remaining.slice(1);
    }

    return (
      <div key={lineIndex} className="flex">
        <span
          className="select-none text-right pr-4 border-r mr-4 shrink-0"
          style={{
            color: '#475569',
            borderColor: '#334155',
            minWidth: '2.5rem',
            fontSize: '12px',
            lineHeight: '1.5',
          }}
        >
          {lineIndex + 1}
        </span>
        <span style={{ fontSize: '12px', lineHeight: '1.5' }}>{parts}</span>
      </div>
    );
  });
}

export function PayloadViewer({ payload }: PayloadViewerProps) {
  const [copied, setCopied] = useState(false);

  const json = JSON.stringify(payload, null, 2);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  return (
    <div
      data-testid="payload-viewer"
      className="rounded-lg overflow-hidden"
      style={{ background: '#0F172A', fontFamily: "'JetBrains Mono', monospace" }}
    >
      {/* Header */}
      <div
        className="flex justify-between items-center px-4 py-3 border-b"
        style={{ background: '#1E293B', borderColor: '#334155' }}
      >
        <span
          className="uppercase tracking-wider"
          style={{ color: '#94A3B8', fontSize: '11px', fontWeight: 500, letterSpacing: '0.04em' }}
        >
          Payload
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-colors"
          style={{
            background: copied ? '#059669' : 'transparent',
            border: `1px solid ${copied ? '#059669' : '#475569'}`,
            color: copied ? '#FFFFFF' : '#94A3B8',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Body */}
      <div
        className="overflow-auto"
        style={{ padding: '16px', maxHeight: '400px', color: '#E2E4E9' }}
      >
        {highlightJson(json)}
      </div>
    </div>
  );
}
