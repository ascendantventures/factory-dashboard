'use client';

import { useState, useCallback } from 'react';
import { Check, Copy } from 'lucide-react';
import { TableOfContents } from './TableOfContents';
import { CommentBody } from './CommentBody';

interface Props {
  body: string;
  isAgent: boolean;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      title="Copy section"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: 4,
        border: '1px solid #E7E5E4',
        background: '#FAFAF9',
        cursor: 'pointer',
        color: copied ? '#059669' : '#78716C',
        transition: 'color 0.15s',
      }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

export function DocumentViewer({ body }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 32,
        alignItems: 'flex-start',
      }}
    >
      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <CommentBody body={body} />
      </div>

      {/* TOC sidebar — hidden on small screens via inline style trick */}
      <div
        style={{
          width: 240,
          flexShrink: 0,
        }}
        className="hidden md:block"
      >
        <TableOfContents markdown={body} />
      </div>
    </div>
  );
}
