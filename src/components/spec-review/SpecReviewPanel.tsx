'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { DashIssue } from '@/types';
import type { SpecActivity, SpecContentResponse } from '@/types/spec-flow';
import { SpecMarkdownRenderer } from './SpecMarkdownRenderer';
import { SpecSectionHighlighter } from './SpecSectionHighlighter';
import { SpecMetadata } from './SpecMetadata';
import { SpecActivityFeed } from './SpecActivityFeed';
import { ApproveConfirmDialog } from './ApproveConfirmDialog';
import { FeedbackDialog } from './FeedbackDialog';
import { SkipDesignConfirmDialog } from './SkipDesignConfirmDialog';
import { createSupabaseBrowserClient } from '@/lib/supabase';

type DialogType = 'approve' | 'feedback' | 'skip_design' | null;

interface SpecReviewPanelProps {
  issue: DashIssue;
  onClose: () => void;
  onStationChange?: () => void;
}

export function SpecReviewPanel({ issue, onClose, onStationChange }: SpecReviewPanelProps) {
  const [specContent, setSpecContent] = useState<SpecContentResponse | null>(null);
  const [activities, setActivities] = useState<SpecActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [visible, setVisible] = useState(false);

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 250);
  };

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Fetch spec content
  const fetchSpec = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/specs/${issue.issue_number}?repo=${encodeURIComponent(issue.repo)}`
      );
      if (res.ok) {
        const data: SpecContentResponse = await res.json();
        setSpecContent(data);
      }
    } catch {
      // handled below
    } finally {
      setLoading(false);
    }
  }, [issue]);

  // Fetch activities from Supabase
  const fetchActivities = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from('factory_spec_activities')
      .select('*')
      .eq('issue_id', issue.id)
      .order('created_at', { ascending: false });
    if (data) setActivities(data as SpecActivity[]);
  }, [issue.id]);

  useEffect(() => {
    fetchSpec();
    fetchActivities();
  }, [fetchSpec, fetchActivities]);

  // Approve
  const handleApprove = async (notes?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/specs/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId: issue.id,
          issueNumber: issue.issue_number,
          repo: issue.repo,
          notes,
          skipDesign: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to approve');
      toast.success('Spec approved successfully');
      setActiveDialog(null);
      fetchActivities();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve spec');
    } finally {
      setActionLoading(false);
    }
  };

  // Request Changes
  const handleFeedback = async (feedback: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/specs/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId: issue.id,
          issueNumber: issue.issue_number,
          repo: issue.repo,
          feedback,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to post feedback');
      toast.success('Feedback posted to GitHub', {
        description: data.commentUrl ? 'View comment on GitHub' : undefined,
        action: data.commentUrl ? {
          label: 'View',
          onClick: () => window.open(data.commentUrl, '_blank'),
        } : undefined,
      });
      setActiveDialog(null);
      fetchActivities();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to post feedback');
    } finally {
      setActionLoading(false);
    }
  };

  // Skip Design
  const handleSkipDesign = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/specs/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId: issue.id,
          issueNumber: issue.issue_number,
          repo: issue.repo,
          skipDesign: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to skip design');
      toast.success('Spec approved — advancing to Design');
      setActiveDialog(null);
      fetchActivities();
      onStationChange?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to skip design');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 40,
          opacity: visible ? 1 : 0,
          transition: 'opacity 200ms ease',
        }}
      />

      {/* Panel */}
      <div
        data-testid="spec-review-panel"
        style={{
          position: 'fixed', right: 0, top: 0, bottom: 0,
          width: 680,
          maxWidth: 'calc(100vw - 24px)',
          background: '#FFFFFF',
          boxShadow: '0 25px 50px rgba(15, 23, 42, 0.12), 0 12px 24px rgba(15, 23, 42, 0.08)',
          zIndex: 50,
          borderLeft: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{
          height: 64,
          padding: '0 32px',
          borderBottom: '1px solid #E2E8F0',
          background: '#FFFFFF',
          display: 'flex', alignItems: 'center', gap: 12,
          flexShrink: 0,
        }}>
          <button
            onClick={handleClose}
            aria-label="Close spec review panel"
            style={{
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none',
              borderRadius: 8, cursor: 'pointer',
              color: '#475569',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F1F5F9'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <X style={{ width: 20, height: 20 }} />
          </button>

          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 18, fontWeight: 600, color: '#0F172A',
            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            Spec Review
          </div>

          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 12, fontWeight: 500, color: '#6366F1',
            background: '#EEF2FF',
            padding: '2px 8px', borderRadius: 6,
            flexShrink: 0,
          }}>
            #{issue.issue_number}
          </span>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 32px',
          }}
        >
          {/* Issue title */}
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 22, fontWeight: 700, color: '#0F172A',
            lineHeight: 1.3, letterSpacing: '-0.01em',
            marginBottom: 20,
            marginTop: 0,
          }}>
            {issue.title}
          </h1>

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '32px 0', color: '#94A3B8' }}>
              <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14 }}>Loading spec…</span>
            </div>
          )}

          {!loading && !specContent?.specMarkdown && (
            <div style={{
              textAlign: 'center', padding: '48px 0',
              fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#94A3B8',
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
              <div style={{ fontWeight: 600, color: '#475569', marginBottom: 4 }}>No spec found</div>
              <div>No spec comment was found on this issue.</div>
            </div>
          )}

          {!loading && specContent?.specMarkdown && (
            <>
              <SpecMetadata markdown={specContent.specMarkdown} issueNumber={issue.issue_number} />
              <SpecSectionHighlighter markdown={specContent.specMarkdown} />
              <SpecMarkdownRenderer markdown={specContent.specMarkdown} />
            </>
          )}

          <SpecActivityFeed activities={activities} />
        </div>

        {/* Footer — Action Bar */}
        <div style={{
          height: 72,
          padding: '0 32px',
          background: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center', gap: 12,
          flexShrink: 0,
        }}>
          {/* Request Changes — ghost */}
          <button
            data-testid="spec-action-request-changes"
            onClick={() => setActiveDialog('feedback')}
            disabled={actionLoading}
            style={{
              fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
              padding: '10px 16px', borderRadius: 8,
              background: 'transparent', border: 'none',
              color: '#475569', cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#F1F5F9';
              (e.currentTarget as HTMLButtonElement).style.color = '#0F172A';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = '#475569';
            }}
          >
            Request Changes
          </button>

          {/* Skip Design — secondary */}
          <button
            data-testid="spec-action-skip-design"
            onClick={() => setActiveDialog('skip_design')}
            disabled={actionLoading}
            style={{
              fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
              padding: '10px 20px', borderRadius: 8,
              background: 'transparent',
              border: '1px solid #E2E8F0',
              color: '#475569', cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#F1F5F9';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#CBD5E1';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0';
            }}
          >
            Skip Design
          </button>

          {/* Approve — primary, pushed right */}
          <button
            data-testid="spec-action-approve"
            onClick={() => setActiveDialog('approve')}
            disabled={actionLoading}
            style={{
              fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
              padding: '10px 20px', borderRadius: 8,
              background: actionLoading ? '#94A3B8' : '#2563EB',
              border: 'none', color: '#FFFFFF',
              cursor: actionLoading ? 'not-allowed' : 'pointer',
              marginLeft: 'auto',
              transition: 'all 150ms ease-out',
            }}
            onMouseEnter={(e) => {
              if (!actionLoading) {
                (e.currentTarget as HTMLButtonElement).style.background = '#1D4ED8';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(37,99,235,0.25)';
              }
            }}
            onMouseLeave={(e) => {
              if (!actionLoading) {
                (e.currentTarget as HTMLButtonElement).style.background = '#2563EB';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
              }
            }}
          >
            Approve
          </button>
        </div>
      </div>

      {/* Dialogs */}
      {activeDialog === 'approve' && (
        <ApproveConfirmDialog
          onConfirm={handleApprove}
          onCancel={() => setActiveDialog(null)}
          loading={actionLoading}
        />
      )}
      {activeDialog === 'feedback' && (
        <FeedbackDialog
          onConfirm={handleFeedback}
          onCancel={() => setActiveDialog(null)}
          loading={actionLoading}
        />
      )}
      {activeDialog === 'skip_design' && (
        <SkipDesignConfirmDialog
          onConfirm={handleSkipDesign}
          onCancel={() => setActiveDialog(null)}
          loading={actionLoading}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes dialogEnter {
          from { transform: scale(0.95); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
