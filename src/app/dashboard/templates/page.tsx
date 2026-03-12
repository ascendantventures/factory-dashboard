'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { LayoutTemplate, Plus } from 'lucide-react';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { TemplatePreviewModal } from '@/components/templates/TemplatePreviewModal';
import { TemplateFormModal } from '@/components/templates/TemplateFormModal';
import { DeleteConfirmModal } from '@/components/templates/DeleteConfirmModal';
import QuickCreateModal from '@/components/QuickCreateModal';
import type { FdIssueTemplate } from '@/types';
import { createSupabaseBrowserClient } from '@/lib/supabase';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<FdIssueTemplate[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [trackedRepos, setTrackedRepos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [previewTemplate, setPreviewTemplate] = useState<FdIssueTemplate | null>(null);
  const [formTemplate, setFormTemplate] = useState<FdIssueTemplate | null | 'new'>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<FdIssueTemplate | null>(null);
  const [quickCreateTemplate, setQuickCreateTemplate] = useState<FdIssueTemplate | null | 'open'>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();

      // Fetch current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      // Check admin role
      if (user) {
        const { data: roleData } = await supabase
          .from('dash_user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        setIsAdmin(roleData?.role === 'admin');

        // Fetch tracked repos from dash_dashboard_config
        const { data: configData } = await supabase
          .from('dash_dashboard_config')
          .select('tracked_repos')
          .eq('user_id', user.id)
          .single();

        setTrackedRepos(configData?.tracked_repos ?? []);
      }

      // Fetch templates
      const res = await fetch('/api/templates');
      if (!res.ok) {
        throw new Error(`Failed to fetch templates: ${res.statusText}`);
      }
      const json = await res.json();
      setTemplates(json.templates ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers
  const handlePreview = useCallback((template: FdIssueTemplate) => {
    setPreviewTemplate(template);
  }, []);

  const handleUse = useCallback((template: FdIssueTemplate) => {
    setPreviewTemplate(null);
    setQuickCreateTemplate(template);
  }, []);

  const handleEdit = useCallback((template: FdIssueTemplate) => {
    setFormTemplate(template);
  }, []);

  const handleDelete = useCallback((template: FdIssueTemplate) => {
    setDeleteTemplate(template);
  }, []);

  const handleFormSave = useCallback((savedTemplate: FdIssueTemplate) => {
    setTemplates((prev) => {
      if (formTemplate === 'new') {
        return [...prev, savedTemplate];
      }
      return prev.map((t) => (t.id === savedTemplate.id ? savedTemplate : t));
    });
    setFormTemplate(null);
  }, [formTemplate]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTemplate) return;
    try {
      const res = await fetch(`/api/templates/${deleteTemplate.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        console.error('Failed to delete template:', res.statusText);
        return;
      }
      setTemplates((prev) => prev.filter((t) => t.id !== deleteTemplate.id));
      console.log('Template deleted successfully:', deleteTemplate.id);
    } catch (err) {
      console.error('Error deleting template:', err);
    } finally {
      setDeleteTemplate(null);
    }
  }, [deleteTemplate]);

  const handleDeleteClose = useCallback(() => {
    setDeleteTemplate(null);
  }, []);

  // Loading state — 6 skeleton cards
  if (loading) {
    return (
      <div style={{ padding: '32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <div
            style={{
              height: '34px',
              width: '160px',
              borderRadius: '8px',
              background: 'var(--surface-alt)',
              marginBottom: '8px',
            }}
          />
          <div
            style={{
              height: '20px',
              width: '300px',
              borderRadius: '6px',
              background: 'var(--surface-alt)',
            }}
          />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: '180px',
                borderRadius: '12px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ padding: '32px' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            padding: '48px',
            borderRadius: '12px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            background: 'rgba(239, 68, 68, 0.08)',
            maxWidth: '480px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#f87171', fontSize: '14px', margin: 0 }}>
            {error}
          </p>
          <button
            onClick={fetchData}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px' }}>
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '32px',
          gap: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 6px 0',
              fontFamily: 'var(--font-heading, "DM Sans", sans-serif)',
              lineHeight: 1.2,
            }}
          >
            Templates
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              margin: 0,
            }}
          >
            Choose a template to create a new issue
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setFormTemplate('new')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'var(--primary, #6366F1)',
              color: '#ffffff',
              border: 'none',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'var(--primary-hover, #4F46E5)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'var(--primary, #6366F1)';
            }}
          >
            <Plus size={16} />
            New Template
          </button>
        )}
      </div>

      {/* Empty state */}
      {templates.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            padding: '80px 32px',
            textAlign: 'center',
          }}
        >
          <LayoutTemplate
            size={48}
            style={{ color: 'var(--text-muted, #71717A)' }}
          />
          <div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: '0 0 8px 0',
              }}
            >
              No templates yet
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                margin: 0,
                maxWidth: '360px',
              }}
            >
              Templates help you create issues faster with pre-filled content.
            </p>
          </div>

          {isAdmin ? (
            <button
              onClick={() => setFormTemplate('new')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '8px',
                background: 'var(--primary, #6366F1)',
                color: '#ffffff',
                border: 'none',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                marginTop: '8px',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'var(--primary-hover, #4F46E5)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'var(--primary, #6366F1)';
              }}
            >
              <Plus size={16} />
              Create your first template
            </button>
          ) : (
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-muted, #71717A)',
                margin: '8px 0 0 0',
              }}
            >
              Ask an admin to create templates for your team.
            </p>
          )}
        </div>
      ) : (
        /* Template grid */
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
          }}
        >
          {templates.map((template) => (
            <motion.div key={template.id} variants={staggerItem}>
              <TemplateCard
                template={template}
                isAdmin={isAdmin}
                onPreview={() => handlePreview(template)}
                onUse={() => handleUse(template)}
                onEdit={() => handleEdit(template)}
                onDelete={() => handleDelete(template)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Modals */}
      <TemplatePreviewModal
        isOpen={previewTemplate !== null}
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUse={() => { if (previewTemplate) handleUse(previewTemplate); }}
      />

      <TemplateFormModal
        isOpen={formTemplate !== null}
        template={formTemplate === 'new' ? null : formTemplate}
        onSave={handleFormSave}
        onClose={() => setFormTemplate(null)}
      />

      <DeleteConfirmModal
        isOpen={deleteTemplate !== null}
        template={deleteTemplate}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteClose}
      />

      <QuickCreateModal
        isOpen={quickCreateTemplate !== null}
        initialTemplate={quickCreateTemplate === 'open' ? null : quickCreateTemplate}
        trackedRepos={trackedRepos}
        onClose={() => setQuickCreateTemplate(null)}
      />
    </div>
  );
}
