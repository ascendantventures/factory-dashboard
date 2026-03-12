'use client';

import React from 'react';
import type { LogLine } from '@/hooks/useAgentLogStream';

interface LogViewerLineProps {
  line: LogLine;
  searchQuery: string;
}

function getLineColor(text: string): string {
  if (/^[>$]/.test(text.trimStart())) return '#60A5FA'; // Command blue
  if (/error|FAILED|failed|Error/i.test(text)) return '#F87171'; // Error red
  if (/[✓✔]|success|completed|done/i.test(text)) return '#34D399'; // Success green
  return '#E5E7EB'; // Output white
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let index = lowerText.indexOf(lowerQuery, lastIndex);

  while (index !== -1) {
    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index));
    }
    parts.push(
      <mark
        key={`${index}-${query}`}
        style={{
          background: 'rgba(229, 168, 48, 0.3)',
          borderRadius: 2,
          color: 'inherit',
          padding: 0,
        }}
      >
        {text.slice(index, index + query.length)}
      </mark>
    );
    lastIndex = index + query.length;
    index = lowerText.indexOf(lowerQuery, lastIndex);
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
}

export const LogViewerLine = React.memo(function LogViewerLine({
  line,
  searchQuery,
}: LogViewerLineProps) {
  const color = getLineColor(line.text);

  return (
    <div
      data-testid="log-line"
      style={{
        display: 'flex',
        padding: '1px 16px',
        minHeight: 22,
        animation: 'fade-in 150ms ease-out',
      }}
    >
      {/* Timestamp */}
      <span
        style={{
          width: 72,
          flexShrink: 0,
          marginRight: 12,
          color: '#6B7280',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 12,
          lineHeight: 1.6,
          userSelect: 'none',
        }}
      >
        {line.timestamp}
      </span>

      {/* Content */}
      <span
        style={{
          flex: 1,
          color,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 13,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {highlightText(line.text, searchQuery)}
      </span>
    </div>
  );
});
