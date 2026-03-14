'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, RefreshCw } from 'lucide-react';
import { CommentItem } from './CommentItem';
import { ReplyEditor } from './ReplyEditor';
import type { GithubComment } from './CommentItem';

interface Props {
  issueNumber: number;
}

type LoadState = 'idle' | 'loading' | 'error' | 'success';

const POLL_INTERVAL_MS = 30_000;

function SkeletonComment() {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E7E5E4',
        borderRadius: 10,
        padding: '16px 20px',
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: '#E7E5E4',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        <div
          style={{
            width: 120,
            height: 14,
            borderRadius: 4,
            background: '#E7E5E4',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        <div
          style={{
            marginLeft: 'auto',
            width: 80,
            height: 12,
            borderRadius: 4,
            background: '#E7E5E4',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div
          style={{
            width: '100%',
            height: 12,
            borderRadius: 4,
            background: '#E7E5E4',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        <div
          style={{
            width: '85%',
            height: 12,
            borderRadius: 4,
            background: '#E7E5E4',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        <div
          style={{
            width: '70%',
            height: 12,
            borderRadius: 4,
            background: '#E7E5E4',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
}

export function CommentThread({ issueNumber }: Props) {
  const [comments, setComments] = useState<GithubComment[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [newCommentIds, setNewCommentIds] = useState<Set<number>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchComments = useCallback(
    async (isInitial = false) => {
      if (isInitial) {
        setLoadState('loading');
      }
      try {
        const res = await fetch(`/api/issues/${issueNumber}/comments`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as { comments: GithubComment[] };
        setComments(data.comments);
        setLoadState('success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load comments';
        setErrorMessage(msg);
        if (isInitial) {
          setLoadState('error');
        }
      }
    },
    [issueNumber]
  );

  // Initial fetch
  useEffect(() => {
    fetchComments(true);
  }, [fetchComments]);

  // Polling
  useEffect(() => {
    const startPolling = () => {
      intervalRef.current = setInterval(() => {
        if (!document.hidden) {
          fetchComments(false);
        }
      }, POLL_INTERVAL_MS);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Resume polling
        fetchComments(false);
        startPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchComments]);

  const handleOptimisticInsert = useCallback((comment: GithubComment) => {
    setComments((prev) => [...prev, comment]);
    // Flash the optimistic comment immediately so user sees confirmation on submit
    setNewCommentIds((prev) => new Set(prev).add(comment.id));
  }, []);

  const handleRollback = useCallback((tempId: number) => {
    setComments((prev) => prev.filter((c) => c.id !== tempId));
    setNewCommentIds((prev) => {
      const next = new Set(prev);
      next.delete(tempId);
      return next;
    });
  }, []);

  const handleNewComment = useCallback((comment: GithubComment) => {
    setComments((prev) => {
      // Avoid duplicates
      if (prev.find((c) => c.id === comment.id)) return prev;
      return [...prev, comment];
    });
    // Mark as new for amber flash animation, clear after animation completes
    setNewCommentIds((prev) => new Set(prev).add(comment.id));
    setTimeout(() => {
      setNewCommentIds((prev) => {
        const next = new Set(prev);
        next.delete(comment.id);
        return next;
      });
    }, 2500);
  }, []);

  return (
    <div
      data-testid="comment-thread"
      style={{
        background: '#FAFAF9',
        borderRadius: 12,
        border: '1px solid #E7E5E4',
        padding: '24px',
      }}
    >
      {/* Pulse keyframes for skeleton loading */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Heading */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 20,
        }}
      >
        <MessageSquare size={18} style={{ color: '#D97706' }} />
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#1C1917',
            fontFamily: 'DM Sans, sans-serif',
            margin: 0,
          }}
        >
          GitHub Comments
        </h2>
        {loadState === 'success' && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 12,
              color: '#78716C',
              background: '#F5F5F4',
              border: '1px solid #E7E5E4',
              borderRadius: 10,
              padding: '2px 8px',
              fontWeight: 500,
            }}
          >
            {comments.length}
          </span>
        )}
      </div>

      {/* Content */}
      {loadState === 'loading' && (
        <div>
          <SkeletonComment />
          <SkeletonComment />
          <SkeletonComment />
        </div>
      )}

      {loadState === 'error' && (
        <div
          style={{
            textAlign: 'center',
            padding: '32px 16px',
          }}
        >
          <p style={{ color: '#DC2626', fontSize: 14, marginBottom: 12 }}>
            {errorMessage || 'Failed to load comments'}
          </p>
          <button
            onClick={() => fetchComments(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 16px',
              borderRadius: 6,
              border: '1px solid #D97706',
              background: '#FFFFFF',
              color: '#D97706',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} />
            Retry
          </button>
        </div>
      )}

      {(loadState === 'success' || (loadState !== 'loading' && comments.length > 0)) && (
        <>
          {comments.length === 0 ? (
            <p
              style={{
                color: '#78716C',
                fontSize: 14,
                textAlign: 'center',
                padding: '24px 0',
              }}
            >
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div style={{ marginBottom: 20 }}>
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} isNew={newCommentIds.has(comment.id)} />
              ))}
            </div>
          )}

          <ReplyEditor
            issueNumber={issueNumber}
            onSuccess={handleNewComment}
            onOptimisticInsert={handleOptimisticInsert}
            onRollback={handleRollback}
          />
        </>
      )}
    </div>
  );
}
