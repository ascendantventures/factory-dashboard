'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { LayoutTemplate, Plus, Search, X as XIcon, FileSearch } from 'lucide-react';
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

  // Search & filter state
  const [search, setSearch] = useState('');
  const [complexityFilter, setComplexityFilter] = useState<'simple' | 'medium' | 'complex' | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Filtered templates — client-side, no API calls on keystroke
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesComplexity = !complexityFilter || t.complexity === complexityFilter;
    return matchesSearch && matchesComplexity;
  });

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

      {/* Search + filter bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        {/* Search input */}
        <div
          className="template-search"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            height: '40px',
            maxWidth: '360px',
            width: '100%',
            background: 'var(--surface-elevated, #1C1C1C)',
            border: '1px solid var(--border-subtle, #262626)',
            borderRadius: '8px',
            padding: '0 10px',
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
          }}
          onFocusCapture={(e) => {
            const el = e.currentTarget as HTMLDivElement;
            el.style.borderColor = '#6366F1';
            el.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)';
          }}
          onBlurCapture={(e) => {
            const el = e.currentTarget as HTMLDivElement;
            el.style.borderColor = 'var(--border-subtle, #262626)';
            el.style.boxShadow = 'none';
          }}
        >
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={searchRef}
            data-testid="template-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            aria-label="Search templates"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
            }}
          />
          {search && (
            <button
              onClick={() => { setSearch(''); searchRef.current?.focus(); }}
              aria-label="Clear search"
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                flexShrink: 0,
                transition: 'color 150ms ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
            >
              <XIcon size={14} />
            </button>
          )}
        </div>

        {/* Complexity filter pills */}
        {(
          [
            { key: 'simple', label: 'Simple', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
            { key: 'medium', label: 'Medium', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
            { key: 'complex', label: 'Complex', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
          ] as const
        ).map(({ key, label, color, bg }) => {
          const active = complexityFilter === key;
          return (
            <button
              key={key}
              data-testid={`complexity-filter-${key}`}
              role="button"
              aria-pressed={active}
              onClick={() => setComplexityFilter(active ? null : key)}
              style={{
                height: '32px',
                padding: '0 14px',
                borderRadius: '16px',
                border: `1px solid ${active ? color : 'var(--border, #3F3F46)'}`,
                background: active ? bg : 'transparent',
                color: active ? color : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 150ms ease',
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  const btn = e.currentTarget as HTMLButtonElement;
                  btn.style.borderColor = 'var(--text-muted)';
                  btn.style.background = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  const btn = e.currentTarget as HTMLButtonElement;
                  btn.style.borderColor = 'var(--border, #3F3F46)';
                  btn.style.background = 'transparent';
                }
              }}
            >
              {label}
            </button>
          );
        })}

        {/* Result count */}
        {templates.length > 0 && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: '13px',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
            }}
          >
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
          </span>
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
      ) : filteredTemplates.length === 0 ? (
        /* No results from search/filter */
        <div
          data-testid="templates-empty-state"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            padding: '64px 32px',
            textAlign: 'center',
          }}
        >
          <FileSearch size={48} style={{ color: 'var(--text-muted, #71717A)' }} />
          <div>
            <h2
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: '0 0 4px 0',
              }}
            >
              No templates found
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
              Try adjusting your search or filters
            </p>
          </div>
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
          {filteredTemplates.map((template) => (
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
