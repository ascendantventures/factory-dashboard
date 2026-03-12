'use client';

import { useState, useCallback } from 'react';
import { Search, ArrowDown, Lock, Unlock, Copy, Check } from 'lucide-react';

interface LogViewerToolbarProps {
  runId: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  autoScroll: boolean;
  onAutoScrollToggle: () => void;
}

export function LogViewerToolbar({
  runId,
  searchQuery,
  onSearchChange,
  autoScroll,
  onAutoScrollToggle,
}: LogViewerToolbarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/logs/${runId}/raw`);
      if (!res.ok) throw new Error('Failed to fetch log');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: try to select all text in the log panel
      try {
        const logContent = document.querySelector('[data-testid="log-content"]') as HTMLElement;
        if (logContent) {
          const range = document.createRange();
          range.selectNodeContents(logContent);
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      } catch {
        // Ignore
      }
    }
  }, [runId]);

  const iconBtnBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '4px 8px',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: 'Outfit, system-ui, sans-serif',
    fontWeight: 500,
    transition: 'all 150ms ease',
    background: 'transparent',
    color: '#6B7280',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  };

  const activeStyle: React.CSSProperties = {
    background: '#3D3425',
    color: '#E5A830',
  };

  return (
    <div
      style={{
        background: '#1A1D25',
        borderTop: '1px solid #2A2F3A',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
      }}
    >
      {/* Search input */}
      <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
        <Search
          style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 14,
            height: 14,
            color: '#6B7280',
            pointerEvents: 'none',
          }}
        />
        <input
          data-testid="log-search-input"
          type="text"
          placeholder="Search logs..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            height: 34,
            background: '#12141A',
            border: '1px solid #2A2F3A',
            borderRadius: 6,
            paddingLeft: 32,
            paddingRight: 10,
            fontSize: 13,
            fontFamily: 'Outfit, system-ui, sans-serif',
            color: '#F0F2F5',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#E5A830';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(229, 168, 48, 0.15)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#2A2F3A';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Auto-scroll toggle */}
      <button
        data-testid="scroll-lock-toggle"
        onClick={onAutoScrollToggle}
        style={{
          ...iconBtnBase,
          ...(autoScroll ? activeStyle : {}),
        }}
        onMouseEnter={(e) => {
          if (!autoScroll) {
            (e.currentTarget as HTMLButtonElement).style.background = '#1A1D25';
            (e.currentTarget as HTMLButtonElement).style.color = '#A8B0BF';
          }
        }}
        onMouseLeave={(e) => {
          if (!autoScroll) {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = '#6B7280';
          }
        }}
        title={autoScroll ? 'Auto-scroll ON — click to lock' : 'Scroll locked — click to enable auto-scroll'}
      >
        {autoScroll ? (
          <>
            <ArrowDown style={{ width: 14, height: 14 }} />
            Auto-scroll
          </>
        ) : (
          <>
            <Lock style={{ width: 14, height: 14 }} />
            Locked
          </>
        )}
      </button>

      {/* Copy button */}
      <button
        data-testid="copy-log-btn"
        onClick={handleCopy}
        style={iconBtnBase}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#1E222B';
          (e.currentTarget as HTMLButtonElement).style.color = '#A8B0BF';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = '#6B7280';
        }}
        title="Copy full log"
      >
        {copied ? (
          <>
            <Check style={{ width: 14, height: 14, color: '#34D399' }} />
            <span style={{ color: '#34D399' }}>Copied!</span>
          </>
        ) : (
          <>
            <Copy style={{ width: 14, height: 14 }} />
            Copy
          </>
        )}
      </button>
    </div>
  );
}
