'use client';

import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { BotBadge } from './BotBadge';
import { CommentBody } from './CommentBody';
import { CollapsibleComment } from './CollapsibleComment';
import { DocumentViewer } from './DocumentViewer';

export interface GithubComment {
  id: number;
  author: string;
  authorType: 'Bot' | 'User';
  avatarUrl: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
}

interface Props {
  comment: GithubComment;
  isNew?: boolean;
  isPending?: boolean;
}

function isDocumentComment(body: string): boolean {
  return body.startsWith('# Spec:') || body.startsWith('# Design:');
}

export function CommentItem({ comment, isNew = false, isPending = false }: Props) {
  const isAgent = comment.authorType === 'Bot';
  const isDocument = isDocumentComment(comment.body);

  const cardBg = isPending
    ? 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, #18181B 100%)'
    : isAgent ? '#F5F3FF' : '#FFFFFF';
  const cardBorder = isPending ? 'rgba(99,102,241,0.3)' : isAgent ? '#DDD6FE' : '#E7E5E4';

  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });

  return (
    <div
      data-testid={`comment-${comment.id}`}
      aria-live={isPending ? 'polite' : undefined}
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 10,
        padding: '16px 20px',
        marginBottom: 12,
        ['--comment-bg' as string]: isPending ? '#18181B' : isAgent ? '#F5F3FF' : '#FFFFFF',
        ...(isPending ? { animation: 'comment-enter 200ms ease-out' } : {}),
        ...(isNew && !isPending ? { animation: 'amberFlash 2s ease-out forwards' } : {}),
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        {/* Avatar */}
        {comment.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={comment.avatarUrl}
            alt={comment.author}
            width={28}
            height={28}
            style={{ borderRadius: '50%', flexShrink: 0 }}
          />
        ) : (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: '#E7E5E4',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 600,
              color: '#78716C',
            }}
          >
            {comment.author[0]?.toUpperCase() ?? '?'}
          </div>
        )}

        {/* Author name */}
        <span
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: '#1C1917',
          }}
        >
          {comment.author}
        </span>

        {/* Bot badge */}
        {isAgent && <BotBadge />}

        {/* Timestamp / pending indicator */}
        <span
          style={{
            fontSize: 12,
            color: '#78716C',
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {isPending ? (
            <span
              data-testid="comment-pending"
              aria-label="Posting comment"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Loader2
                size={12}
                style={{ color: 'var(--primary, #6366F1)', animation: 'spin 800ms linear infinite' }}
              />
              <span style={{ fontStyle: 'italic', color: '#71717A' }}>Posting...</span>
            </span>
          ) : (
            <a
              href={comment.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#78716C', textDecoration: 'none' }}
              title={comment.createdAt}
            >
              {timeAgo}
            </a>
          )}
        </span>
      </div>

      {/* Body */}
      <div style={isPending ? { opacity: 0.85 } : undefined}>
        {isDocument ? (
          <DocumentViewer body={comment.body} isAgent={isAgent} />
        ) : (
          <CollapsibleComment body={comment.body} isAgent={isAgent} isDocument={isDocument}>
            <CommentBody body={comment.body} />
          </CollapsibleComment>
        )}
      </div>
    </div>
  );
}
