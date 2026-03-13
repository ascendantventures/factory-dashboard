'use client';

import { useState, useRef, useCallback } from 'react';
import { Bold, Italic, Code, List, ListOrdered } from 'lucide-react';
import { toast } from 'sonner';
import { CommentBody } from './CommentBody';
import type { GithubComment } from './CommentItem';

interface Props {
  issueNumber: number;
  onSuccess: (comment: GithubComment) => void;
  onRollback?: (tempId: string) => void;
}

type Tab = 'write' | 'preview';

function insertMarkdown(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string,
  placeholder: string,
  getValue: () => string,
  setValue: (v: string) => void
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = getValue();
  const selected = value.slice(start, end) || placeholder;
  const newValue = value.slice(0, start) + before + selected + after + value.slice(end);
  setValue(newValue);
  // Restore cursor after state update
  setTimeout(() => {
    textarea.focus();
    const newCursorStart = start + before.length;
    const newCursorEnd = newCursorStart + selected.length;
    textarea.setSelectionRange(newCursorStart, newCursorEnd);
  }, 0);
}

export function ReplyEditor({ issueNumber, onSuccess, onRollback }: Props) {
  const [value, setValue] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('write');
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleToolbarAction = useCallback(
    (before: string, after: string, placeholder: string) => {
      if (!textareaRef.current) return;
      insertMarkdown(textareaRef.current, before, after, placeholder, () => value, setValue);
    },
    [value]
  );

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setIsPosting(true);
    setError(null);

    // Optimistic insert: immediately show the comment before API responds
    const tempId = `temp_${Date.now()}`;
    const tempComment: GithubComment = {
      id: -1,
      tempId,
      author: 'You',
      authorType: 'User',
      avatarUrl: '',
      body: trimmed,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      htmlUrl: '#',
    };
    onSuccess(tempComment);
    setValue('');
    setActiveTab('write');

    try {
      const res = await fetch(`/api/issues/${issueNumber}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: trimmed }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = (await res.json()) as { comment: GithubComment };
      // Replace optimistic comment with real one from API
      onSuccess({ ...data.comment, tempId });
    } catch {
      // Rollback: remove the optimistic comment
      onRollback?.(tempId);
      toast.error("Couldn't post comment. Please try again.");
      setError("Couldn't post comment. Please try again.");
      // Restore editor content so user can retry
      setValue(trimmed);
    } finally {
      setIsPosting(false);
    }
  };

  const toolbarBtnStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 5,
    border: '1px solid #E7E5E4',
    background: '#FAFAF9',
    cursor: 'pointer',
    color: '#44403C',
  };

  const tabStyle = (active: boolean) => ({
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    color: active ? '#D97706' : '#78716C',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid #D97706' : '2px solid transparent',
    cursor: 'pointer',
    transition: 'color 0.15s',
  });

  return (
    <div
      data-testid="reply-editor"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E7E5E4',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: '1px solid #E7E5E4',
          padding: '0 16px',
        }}
      >
        <button style={tabStyle(activeTab === 'write')} onClick={() => setActiveTab('write')}>
          Write
        </button>
        <button
          data-testid="preview-tab"
          style={tabStyle(activeTab === 'preview')}
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </button>
      </div>

      {activeTab === 'write' ? (
        <>
          {/* Toolbar */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              padding: '8px 12px',
              borderBottom: '1px solid #E7E5E4',
              background: '#FAFAF9',
            }}
          >
            <button
              style={toolbarBtnStyle}
              title="Bold"
              onClick={() => handleToolbarAction('**', '**', 'bold text')}
            >
              <Bold size={14} />
            </button>
            <button
              style={toolbarBtnStyle}
              title="Italic"
              onClick={() => handleToolbarAction('*', '*', 'italic text')}
            >
              <Italic size={14} />
            </button>
            <button
              style={toolbarBtnStyle}
              title="Inline code"
              onClick={() => handleToolbarAction('`', '`', 'code')}
            >
              <Code size={14} />
            </button>
            <button
              style={toolbarBtnStyle}
              title="Bullet list"
              onClick={() => handleToolbarAction('\n- ', '', 'item')}
            >
              <List size={14} />
            </button>
            <button
              style={toolbarBtnStyle}
              title="Numbered list"
              onClick={() => handleToolbarAction('\n1. ', '', 'item')}
            >
              <ListOrdered size={14} />
            </button>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Leave a comment…"
            rows={6}
            style={{
              display: 'block',
              width: '100%',
              resize: 'vertical',
              border: 'none',
              outline: 'none',
              padding: '12px 16px',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontSize: 13,
              lineHeight: 1.6,
              color: '#1C1917',
              background: '#FFFFFF',
              boxSizing: 'border-box',
            }}
          />
        </>
      ) : (
        <div
          data-testid="reply-preview"
          style={{ padding: '12px 16px', minHeight: 120, background: '#FAFAF9' }}
        >
          {value.trim() ? (
            <CommentBody body={value} />
          ) : (
            <p style={{ color: '#78716C', fontSize: 13, fontStyle: 'italic' }}>Nothing to preview</p>
          )}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 12,
          padding: '10px 16px',
          borderTop: '1px solid #E7E5E4',
          background: '#FAFAF9',
        }}
      >
        {error && (
          <span style={{ fontSize: 12, color: '#DC2626', flex: 1 }}>{error}</span>
        )}
        <button
          data-testid="submit-reply-btn"
          onClick={handleSubmit}
          disabled={isPosting || !value.trim()}
          style={{
            padding: '7px 18px',
            borderRadius: 6,
            border: 'none',
            background: isPosting || !value.trim() ? '#FDE68A' : '#D97706',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 600,
            cursor: isPosting || !value.trim() ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {isPosting ? 'Posting…' : 'Post Comment'}
        </button>
      </div>
    </div>
  );
}
