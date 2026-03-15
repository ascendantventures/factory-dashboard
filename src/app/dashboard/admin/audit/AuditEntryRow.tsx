'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronRight } from 'lucide-react';
import { CategoryBadge } from './CategoryBadge';

export interface AuditEntry {
  id: string;
  created_at: string;
  user_id: string | null;
  actor_email: string;
  action: string;
  category: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function absoluteTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

interface AuditEntryRowProps {
  entry: AuditEntry;
  index: number;
  isNew?: boolean;
}

export function AuditEntryRow({ entry, index, isNew }: AuditEntryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <>
      <motion.tr
        custom={index}
        initial={isNew ? { opacity: 0, y: -8, backgroundColor: 'rgba(99,102,241,0.2)' } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0, backgroundColor: 'transparent' }}
        transition={isNew
          ? { duration: 0.5, ease: [0.25, 1, 0.5, 1] }
          : { delay: Math.min(index * 0.03, 0.3), duration: 0.3, ease: [0.25, 1, 0.5, 1] }
        }
        style={{
          background: expanded ? '#3D3526' : hovered ? '#1E2328' : 'transparent',
          borderBottom: '1px solid #1F242A',
          cursor: 'pointer',
          transition: 'background-color 150ms ease',
          borderLeft: expanded ? '2px solid #D4A534' : '2px solid transparent',
        }}
        onClick={() => setExpanded(e => !e)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Timestamp */}
        <td style={{ padding: '14px 16px', width: '180px', whiteSpace: 'nowrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock style={{ width: '14px', height: '14px', color: '#6B7785', flexShrink: 0 }} />
            <span
              style={{ fontSize: '13px', color: '#6B7785' }}
              title={absoluteTime(entry.created_at)}
              data-testid="entry-timestamp"
            >
              {relativeTime(entry.created_at)}
            </span>
          </div>
        </td>

        {/* Actor */}
        <td style={{ padding: '14px 16px', width: '200px' }}>
          <span
            style={{ fontSize: '14px', fontWeight: 500, color: '#F0F2F5', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}
            data-testid="actor-email"
          >
            {entry.actor_email}
          </span>
        </td>

        {/* Action */}
        <td style={{ padding: '14px 16px', width: '160px' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 500,
              background: '#1E2328',
              color: '#A8B2BF',
              border: '1px solid #2A3038',
              whiteSpace: 'nowrap',
            }}
            data-testid="action-badge"
          >
            {entry.action}
          </span>
        </td>

        {/* Category */}
        <td style={{ padding: '14px 16px', width: '140px' }}>
          <CategoryBadge category={entry.category} />
        </td>

        {/* Target */}
        <td style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{ fontSize: '13px', color: '#6B7785' }}
              data-testid="target-info"
            >
              {entry.target_type && entry.target_id
                ? `${entry.target_type}: ${entry.target_id}`
                : entry.target_type || '—'}
            </span>
            <ChevronRight
              style={{
                width: '16px',
                height: '16px',
                color: '#6B7785',
                flexShrink: 0,
                transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 200ms ease',
              }}
            />
          </div>
        </td>
      </motion.tr>

      <AnimatePresence>
        {expanded && (
          <motion.tr
            key={`${entry.id}-details`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <td
              colSpan={5}
              style={{
                background: '#12151A',
                padding: '16px 16px 16px 48px',
                borderBottom: '1px solid #2A3038',
              }}
              data-testid="entry-details"
            >
              <p style={{ fontSize: '12px', fontWeight: 500, color: '#6B7785', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Details
              </p>
              <pre
                style={{
                  background: '#0D0F12',
                  border: '1px solid #1F242A',
                  borderRadius: '8px',
                  padding: '16px',
                  fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: '#A8B2BF',
                  overflowX: 'auto',
                  maxHeight: '300px',
                  margin: 0,
                  overflowY: 'auto',
                }}
              >
                {entry.details ? JSON.stringify(entry.details, null, 2) : '{}'}
              </pre>
              {entry.ip_address && (
                <p style={{ fontSize: '12px', color: '#6B7785', marginTop: '12px' }}>
                  IP: {entry.ip_address}
                </p>
              )}
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}
