'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
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
}

function isDocumentComment(body: string): boolean {
  return body.startsWith('# Spec:') || body.startsWith('# Design:');
}

export function CommentItem({ comment, isNew = false }: Props) {
  const isAgent = comment.authorType === 'Bot';
  const isDocument = isDocumentComment(comment.body);

  // Flash state: start amber when isNew, then fade to base bg after 200ms hold
  const [flash, setFlash] = useState(isNew);

  useEffect(() => {
    if (!isNew) return;
    setFlash(true);
    const timer = setTimeout(() => setFlash(false), 200);
    return () => clearTimeout(timer);
  }, [isNew]);

  const baseBg = isAgent ? '#F5F3FF' : '#FFFFFF';
  const cardBg = flash ? '#FEF3C7' : baseBg;
  const cardBorder = isAgent ? '#DDD6FE' : '#E7E5E4';

  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });

  return (
    <div
      data-testid="comment-item"
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 10,
        padding: '16px 20px',
        marginBottom: 12,
        transition: flash ? 'none' : 'background-color 1.5s ease-out',
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

        {/* Timestamp + link */}
        <span
          style={{
            fontSize: 12,
            color: '#78716C',
            marginLeft: 'auto',
          }}
        >
          <a
            href={comment.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#78716C', textDecoration: 'none' }}
            title={comment.createdAt}
          >
            {timeAgo}
          </a>
        </span>
      </div>

      {/* Body */}
      {isDocument ? (
        <DocumentViewer body={comment.body} isAgent={isAgent} />
      ) : (
        <CollapsibleComment body={comment.body} isAgent={isAgent} isDocument={isDocument}>
          <CommentBody body={comment.body} />
        </CollapsibleComment>
      )}
    </div>
  );
}
