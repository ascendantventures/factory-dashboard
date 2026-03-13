'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import Link from 'next/link';
import {
  Plus, Trash2, Loader2, Save, Shield, Users, Settings, Layers, Server, Key,
  Pencil, X, Github, Database, Triangle, Bot, RotateCw,
  CheckCircle, Activity, Webhook, ChevronRight,
} from 'lucide-react';
import { DashDashboardConfig, DashTemplate } from '@/types';

interface User {
  id: string;
  email: string;
  role: string;
}

interface SettingsClientProps {
  userId: string | null;
  initialConfig: DashDashboardConfig | null;
  isAdmin: boolean;
  allUsers: User[];
}

type Tab = 'general' | 'users' | 'templates' | 'environment' | 'api-keys';

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Badge({ variant, children }: { variant: 'success' | 'error' | 'warning' | 'default' | 'primary'; children: React.ReactNode }) {
  const styles: Record<string, string> = {
    success: 'bg-green-900/40 text-green-400 border border-green-700/40',
    error: 'bg-red-900/40 text-red-400 border border-red-700/40',
    warning: 'bg-amber-900/40 text-amber-400 border border-amber-700/40',
    primary: 'bg-indigo-900/40 text-indigo-400 border border-indigo-700/40',
    default: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}

function StatusDot({ status }: { status: 'ok' | 'error' | 'missing' | 'unchecked' }) {
  const colors: Record<string, string> = {
    ok: 'bg-green-500',
    error: 'bg-red-500',
    missing: 'bg-zinc-500',
    unchecked: 'bg-zinc-600',
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status] ?? colors.unchecked}`} />;
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className={`w-full ${maxWidth} rounded-xl overflow-hidden shadow-2xl`} style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PrimaryBtn({ onClick, disabled, children, className = '' }: { onClick?: () => void; disabled?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50 ${className}`}
      style={{ background: 'var(--primary)', color: '#fff' }}
    >
      {children}
    </button>
  );
}

function SecondaryBtn({ onClick, disabled, children }: { onClick?: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
      style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
    >
      {children}
    </button>
  );
}

function DangerBtn({ onClick, disabled, children }: { onClick?: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50"
      style={{ background: 'var(--error)', color: '#fff' }}
    >
      {children}
    </button>
  );
}

function FieldGroup({ label, helper, error, children }: { label: string; helper?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      {children}
      {helper && !error && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{helper}</p>}
      {error && <p className="text-xs font-medium" style={{ color: 'var(--error)' }}>{error}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, disabled, name }: { value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean; name?: string }) {
  return (
    <input
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="h-9 w-full px-3 rounded-lg text-sm outline-none transition-colors disabled:opacity-60"
      style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3, name }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; name?: string }) {
  return (
    <textarea
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-vertical transition-colors"
      style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)', minHeight: '80px' }}
    />
  );
}

function SelectInput({ value, onChange, options, name }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; name?: string }) {
  return (
    <select
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full px-3 rounded-lg text-sm outline-none appearance-none"
      style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ─── Template Registry Panel ──────────────────────────────────────────────────

interface TemplateFormState {
  template_slug: string;
  template_name: string;
  description: string;
  source_repo: string;
  deploy_target: string;
  project_type: string;
  is_default: boolean;
}

const emptyForm: TemplateFormState = {
  template_slug: '',
  template_name: '',
  description: '',
  source_repo: '',
  deploy_target: 'vercel',
  project_type: 'web',
  is_default: false,
};

function TemplateModal({
  open, onClose, mode, initial, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  initial?: DashTemplate | null;
  onSaved: (t: DashTemplate) => void;
}) {
  const [form, setForm] = useState<TemplateFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(initial ? {
        template_slug: initial.template_slug,
        template_name: initial.template_name,
        description: initial.description ?? '',
        source_repo: initial.source_repo,
        deploy_target: initial.deploy_target,
        project_type: initial.project_type,
        is_default: initial.is_default,
      } : emptyForm);
      setError(null);
    }
  }, [open, initial]);

  async function handleSubmit() {
    setError(null);
    if (!form.template_slug || !form.template_name || !form.source_repo) {
      setError('Slug, name, and source repo are required.');
      return;
    }
    setSaving(true);
    try {
      const url = mode === 'add' ? '/api/config/templates' : `/api/config/templates/${initial?.template_id}`;
      const method = mode === 'add' ? 'POST' : 'PATCH';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, description: form.description || null }) });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error === 'Slug already taken' ? 'Slug already taken' : (data.error ?? 'Something went wrong'));
        return;
      }
      onSaved(data.template);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={mode === 'add' ? 'Add Template' : 'Edit Template'} maxWidth="max-w-xl">
      <div className="px-6 py-5 flex flex-col gap-5">
        <FieldGroup label="Template Slug *" helper="Unique identifier, lowercase with hyphens" error={error === 'Slug already taken' ? 'Slug already taken' : undefined}>
          <Input name="template_slug" value={form.template_slug} onChange={(v) => setForm({ ...form, template_slug: v })} placeholder="nextjs-supabase" disabled={mode === 'edit'} />
        </FieldGroup>
        <FieldGroup label="Template Name *">
          <Input name="template_name" value={form.template_name} onChange={(v) => setForm({ ...form, template_name: v })} placeholder="Next.js + Supabase" />
        </FieldGroup>
        <FieldGroup label="Description">
          <Textarea name="description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Full-stack web app template..." rows={2} />
        </FieldGroup>
        <FieldGroup label="Source Repository *" helper="GitHub repository path (org/repo)">
          <Input name="source_repo" value={form.source_repo} onChange={(v) => setForm({ ...form, source_repo: v })} placeholder="ascendantventures/template-nextjs" />
        </FieldGroup>
        <div className="grid grid-cols-2 gap-4">
          <FieldGroup label="Deploy Target *">
            <SelectInput name="deploy_target" value={form.deploy_target} onChange={(v) => setForm({ ...form, deploy_target: v })} options={[{ value: 'vercel', label: 'Vercel' }, { value: 'railway', label: 'Railway' }, { value: 'self-hosted', label: 'Self-hosted' }]} />
          </FieldGroup>
          <FieldGroup label="Project Type *">
            <SelectInput name="project_type" value={form.project_type} onChange={(v) => setForm({ ...form, project_type: v })} options={[{ value: 'web', label: 'Web' }, { value: 'api', label: 'API' }, { value: 'mobile', label: 'Mobile' }]} />
          </FieldGroup>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} className="w-4 h-4 rounded" />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Set as default for this project type</span>
        </label>
        {error && error !== 'Slug already taken' && (
          <p className="text-xs font-medium" style={{ color: 'var(--error)' }}>{error}</p>
        )}
      </div>
      <div className="flex gap-3 justify-end px-6 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <SecondaryBtn onClick={onClose}>Cancel</SecondaryBtn>
        <PrimaryBtn onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === 'add' ? 'Add Template' : 'Save Template'}
        </PrimaryBtn>
      </div>
    </Modal>
  );
}

function DeleteTemplateModal({ open, onClose, template, onDeleted }: { open: boolean; onClose: () => void; template: DashTemplate | null; onDeleted: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!template) return;
    setDeleting(true);
    setError(null);
    const res = await fetch(`/api/config/templates/${template.template_id}`, { method: 'DELETE' });
    if (res.ok) {
      onDeleted(template.template_id);
      onClose();
    } else {
      const data = await res.json();
      setError(data.error ?? 'Delete failed');
    }
    setDeleting(false);
  }

  return (
    <Modal open={open} onClose={onClose} title="Delete template?" maxWidth="max-w-sm">
      <div className="px-6 py-5">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          This will permanently remove <strong>{template?.template_name}</strong>. This action cannot be undone.
        </p>
        {error && <p className="mt-3 text-xs font-medium" style={{ color: 'var(--error)' }}>{error}</p>}
      </div>
      <div className="flex gap-3 justify-end px-6 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <SecondaryBtn onClick={onClose}>Cancel</SecondaryBtn>
        <DangerBtn onClick={handleDelete} disabled={deleting}>
          {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
          Delete Template
        </DangerBtn>
      </div>
    </Modal>
  );
}

function DeployBadge({ target }: { target: string }) {
  const v: Record<string, 'primary' | 'success' | 'default'> = { vercel: 'primary', railway: 'success', 'self-hosted': 'default' };
  return <Badge variant={v[target] ?? 'default'}>{target}</Badge>;
}

function TypeBadge({ type }: { type: string }) {
  const v: Record<string, 'primary' | 'success' | 'default'> = { web: 'primary', api: 'success', mobile: 'default' };
  return <Badge variant={v[type] ?? 'default'}>{type}</Badge>;
}

function TemplateRegistryPanel({ isAdmin }: { isAdmin: boolean }) {
  const [templates, setTemplates] = useState<DashTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<DashTemplate | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<DashTemplate | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/config/templates');
    if (res.ok) {
      const data = await res.json();
      setTemplates(data.templates ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleSaved(t: DashTemplate) {
    setTemplates((prev) => {
      const idx = prev.findIndex((x) => x.template_id === t.template_id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = t;
        // Clear old default if new one set
        if (t.is_default) return next.map((x) => x.template_id === t.template_id ? x : x.project_type === t.project_type ? { ...x, is_default: false } : x);
        return next;
      }
      return [...prev, t];
    });
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Template Registry</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage build pipeline templates for new projects.</p>
        </div>
        {isAdmin && (
          <button data-testid="add-template-btn" onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>
            <Plus className="w-4 h-4" />
            Add Template
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed" style={{ borderColor: 'var(--border)' }}>
          <Layers className="w-12 h-12 mb-4" style={{ color: 'var(--text-muted)' }} />
          <h4 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No templates configured</h4>
          <p className="text-sm mb-6 max-w-xs text-center" style={{ color: 'var(--text-muted)' }}>Add your first build template to get started with automated deployments.</p>
          {isAdmin && (
            <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>
              <Plus className="w-4 h-4" />
              Add Template
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="template-table">
              <thead>
                <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
                  {['Name', 'Slug', 'Source Repo', 'Deploy Target', 'Project Type', 'Default', ...(isAdmin ? ['Actions'] : [])].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.template_id} data-testid="template-row" className="transition-colors" style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-alt)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
                    <td className="px-4 py-3.5 font-medium" style={{ color: 'var(--text-primary)' }}>{t.template_name}</td>
                    <td className="px-4 py-3.5 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{t.template_slug}</td>
                    <td className="px-4 py-3.5 font-mono text-xs max-w-[180px] truncate" style={{ color: 'var(--text-muted)' }} title={t.source_repo}>{t.source_repo}</td>
                    <td className="px-4 py-3.5"><DeployBadge target={t.deploy_target} /></td>
                    <td className="px-4 py-3.5"><TypeBadge type={t.project_type} /></td>
                    <td className="px-4 py-3.5">{t.is_default && <Badge variant="primary">Default</Badge>}</td>
                    {isAdmin && (
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button data-testid="edit-template-btn" onClick={() => setEditTemplate(t)} className="p-1.5 rounded-lg transition-colors hover:opacity-70" style={{ color: 'var(--text-muted)' }} title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button data-testid="delete-template-btn" onClick={() => setDeleteTemplate(t)} className="p-1.5 rounded-lg transition-colors hover:opacity-70" style={{ color: 'var(--error)' }} title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TemplateModal open={addOpen} onClose={() => setAddOpen(false)} mode="add" onSaved={handleSaved} />
      <TemplateModal open={!!editTemplate} onClose={() => setEditTemplate(null)} mode="edit" initial={editTemplate} onSaved={handleSaved} />
      <DeleteTemplateModal open={!!deleteTemplate} onClose={() => setDeleteTemplate(null)} template={deleteTemplate} onDeleted={(id) => setTemplates((prev) => prev.filter((x) => x.template_id !== id))} />
    </div>
  );
}

// ─── Environment Panel ────────────────────────────────────────────────────────

interface EnvVar { name: string; status: string; required: boolean; masked_preview: string | null }
interface HealthResult { service: string; env_var: string; status: string; latency_ms: number | null; detail: string }

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  GitHub: <Github className="w-5 h-5" />,
  Supabase: <Database className="w-5 h-5" />,
  Vercel: <Triangle className="w-5 h-5" />,
  Anthropic: <Bot className="w-5 h-5" />,
};

function ServiceStatusRow({ result, service, checking }: { result: HealthResult | null; service: string; checking: boolean }) {
  const name = result?.service ?? service;
  const status = checking ? 'checking' : (result?.status ?? 'unchecked');

  return (
    <div data-testid="service-status-row" className="flex items-center gap-4 p-4 rounded-xl border" style={{ border: '1px solid var(--border)', background: 'var(--surface-alt)' }}>
      <span style={{ color: 'var(--text-muted)' }}>{SERVICE_ICONS[name] ?? <Server className="w-5 h-5" />}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{name}</p>
        <p className="text-xs mt-0.5 truncate" style={{ color: status === 'error' ? 'var(--error)' : 'var(--text-muted)' }}>
          {checking ? 'Checking...' : (result?.detail ?? 'Not checked')}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {checking ? (
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--text-muted)' }} />
        ) : (
          <>
            <StatusDot status={(status as 'ok' | 'error' | 'missing' | 'unchecked')} />
            {result?.latency_ms != null && status === 'ok' && (
              <span className="text-xs font-medium" style={{ color: 'var(--success)' }}>{result.latency_ms}ms</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EnvStatusPanel() {
  const [vars, setVars] = useState<EnvVar[]>([]);
  const [loadingVars, setLoadingVars] = useState(true);
  const [healthResults, setHealthResults] = useState<HealthResult[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/config/env-status')
      .then((r) => r.json())
      .then((d) => { setVars(d.variables ?? []); setLoadingVars(false); });
  }, []);

  async function runHealthCheck() {
    setChecking(true);
    const res = await fetch('/api/config/health-check', { method: 'POST' });
    const data = await res.json();
    setHealthResults(data.results ?? []);
    setCheckedAt(data.checked_at ?? null);
    setChecking(false);
  }

  const SERVICES = ['GitHub', 'Supabase', 'Vercel', 'Anthropic'];

  return (
    <div className="space-y-8">
      {/* Env Vars */}
      <div>
        <div className="mb-4">
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Environment Variables</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Status of configured environment variables. Values are masked for security.</p>
        </div>
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
          {loadingVars ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-muted)' }} /></div>
          ) : (
            <div data-testid="env-var-list">
              {vars.map((v, i) => (
                <div key={v.name} data-testid="env-var-row" className="flex items-center justify-between px-4 py-3" style={{ borderBottom: i < vars.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{v.name}</span>
                    {v.required && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>*required</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    {v.masked_preview && (
                      <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{v.masked_preview}</span>
                    )}
                    <Badge variant={v.status === 'set' ? 'success' : 'error'}>{v.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Health Check */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Service Connectivity</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Test live connectivity to external services.</p>
          </div>
          <button
            data-testid="run-health-check-btn"
            onClick={runHealthCheck}
            disabled={checking}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            {checking ? <Loader2 className="w-4 h-4 animate-spin" data-testid="health-check-spinner" /> : <Activity className="w-4 h-4" />}
            {checking ? 'Checking...' : 'Run Health Check'}
          </button>
        </div>
        <div data-testid={healthResults ? 'health-check-results' : undefined} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SERVICES.map((svc) => (
            <ServiceStatusRow
              key={svc}
              service={svc}
              result={healthResults?.find((r) => r.service === svc) ?? null}
              checking={checking}
            />
          ))}
        </div>
        {checkedAt && (
          <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>Last checked: {new Date(checkedAt).toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}

// ─── API Keys Panel ───────────────────────────────────────────────────────────

interface KeyInfo { key_name: string; status: string; masked_preview: string | null; last_rotated_at: string | null; last_rotated_by: string | null }

function RotateKeyModal({ open, onClose, keyName, onRotated }: { open: boolean; onClose: () => void; keyName: string; onRotated: () => void }) {
  const [notes, setNotes] = useState('');
  const [rotating, setRotating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setNotes(''); setSuccess(false); setError(null); }
  }, [open]);

  async function handleRotate() {
    setRotating(true);
    setError(null);
    const res = await fetch('/api/config/keys/rotate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key_name: keyName, notes }) });
    if (res.ok) {
      setSuccess(true);
      onRotated();
    } else {
      const d = await res.json();
      setError(d.error ?? 'Rotation failed');
    }
    setRotating(false);
  }

  return (
    <Modal open={open} onClose={onClose} title={success ? 'Rotation recorded' : 'Log key rotation'} maxWidth="max-w-md">
      {success ? (
        <div className="px-6 py-5">
          <div className="flex flex-col items-center text-center">
            <CheckCircle className="w-10 h-10 mb-3" style={{ color: 'var(--success)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Update <strong>{keyName}</strong> in your deployment environment and redeploy to apply the new key.
            </p>
          </div>
          <p className="text-sm mt-3 text-center" style={{ color: 'var(--text-muted)' }}>Rotation recorded.</p>
        </div>
      ) : (
        <div className="px-6 py-5 flex flex-col gap-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            This logs a rotation event for <strong>{keyName}</strong>. You&apos;ll need to update the actual key value in your deployment environment.
          </p>
          <FieldGroup label="Notes (optional)">
            <Textarea name="notes" value={notes} onChange={setNotes} placeholder="Reason for rotation..." rows={2} />
          </FieldGroup>
          {error && <p className="text-xs font-medium" style={{ color: 'var(--error)' }}>{error}</p>}
        </div>
      )}
      <div className="flex gap-3 justify-end px-6 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
        {success ? (
          <PrimaryBtn onClick={onClose}>Done</PrimaryBtn>
        ) : (
          <>
            <SecondaryBtn onClick={onClose}>Cancel</SecondaryBtn>
            <PrimaryBtn onClick={handleRotate} disabled={rotating} data-testid="confirm-rotate">
              {rotating && <Loader2 className="w-4 h-4 animate-spin" />}
              Log Rotation
            </PrimaryBtn>
          </>
        )}
      </div>
    </Modal>
  );
}

function ApiKeyPanel() {
  const [keys, setKeys] = useState<KeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [rotateKey, setRotateKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/config/keys');
    if (res.ok) {
      const d = await res.json();
      setKeys(d.keys ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function relativeTime(ts: string | null) {
    if (!ts) return '—';
    const diff = Date.now() - new Date(ts).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    return `${days} days ago`;
  }

  return (
    <div>
      <div className="mb-5">
        <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>API Key Management</h3>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>View key status and log rotation events. Actual rotation requires environment updates.</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-muted)' }} /></div>
      ) : (
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
                  {['Key Name', 'Status', 'Preview', 'Last Rotated', 'Rotated By', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.key_name} data-testid="key-row" style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-alt)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
                    <td className="px-4 py-3.5 font-mono text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{k.key_name}</td>
                    <td className="px-4 py-3.5"><Badge variant={k.status === 'set' ? 'success' : 'error'}>{k.status}</Badge></td>
                    <td className="px-4 py-3.5 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{k.masked_preview ?? '—'}</td>
                    <td className="px-4 py-3.5 text-xs" style={{ color: 'var(--text-muted)' }}>{relativeTime(k.last_rotated_at)}</td>
                    <td className="px-4 py-3.5 text-xs" style={{ color: 'var(--text-muted)' }}>{k.last_rotated_by ?? '—'}</td>
                    <td className="px-4 py-3.5">
                      <button data-testid="rotate-key-btn" onClick={() => setRotateKey(k.key_name)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                        <RotateCw className="w-3.5 h-3.5" />
                        Rotate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {rotateKey && (
        <RotateKeyModal open={!!rotateKey} onClose={() => setRotateKey(null)} keyName={rotateKey} onRotated={load} />
      )}
    </div>
  );
}

// ─── Main SettingsClient ──────────────────────────────────────────────────────

export function SettingsClient({ userId, initialConfig, isAdmin, allUsers }: SettingsClientProps) {
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('general');

  const getSupabase = async () => {
    if (!supabaseRef.current) {
      const { createSupabaseBrowserClient } = await import('@/lib/supabase');
      supabaseRef.current = createSupabaseBrowserClient();
    }
    return supabaseRef.current;
  };

  const [repos, setRepos] = useState<string[]>(initialConfig?.tracked_repos ?? []);
  const [newRepo, setNewRepo] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>(allUsers);
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);

  function addRepo() {
    const trimmed = newRepo.trim();
    if (!trimmed || repos.includes(trimmed)) return;
    setRepos([...repos, trimmed]);
    setNewRepo('');
  }

  function removeRepo(repo: string) {
    setRepos(repos.filter((r) => r !== repo));
  }

  async function saveConfig() {
    if (!userId) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    const supabase = await getSupabase();
    const { error } = await supabase
      .from('dash_dashboard_config')
      .upsert({ user_id: userId, tracked_repos: repos, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) setSaveError(error.message);
    else { setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000); }
    setSaving(false);
  }

  async function updateUserRole(targetUserId: string, role: string) {
    setRoleUpdating(targetUserId);
    const supabase = await getSupabase();
    const { error } = await supabase
      .from('dash_user_roles')
      .upsert({ user_id: targetUserId, role, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (!error) setUsers((prev) => prev.map((u) => u.id === targetUserId ? { ...u, role } : u));
    setRoleUpdating(null);
  }

  const allTabs: { id: Tab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { id: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" />, adminOnly: true },
    { id: 'templates', label: 'Templates', icon: <Layers className="w-4 h-4" /> },
    { id: 'environment', label: 'Environment', icon: <Server className="w-4 h-4" /> },
    { id: 'api-keys', label: 'API Keys', icon: <Key className="w-4 h-4" />, adminOnly: true },
  ];
  const tabs = allTabs.filter((t) => !t.adminOnly || isAdmin);

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}>Settings</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Manage templates, environment configuration, and API keys.</p>
      </header>

      <div className="flex gap-0">
        {/* Sidebar */}
        <nav className="w-48 flex-shrink-0 border-r pr-2 hidden md:block" style={{ borderColor: 'var(--border)' }}>
          <div className="flex flex-col gap-0.5">
            {tabs.map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  data-tab={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-colors"
                  style={{
                    background: active ? 'var(--primary-muted)' : 'transparent',
                    color: active ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {t.icon}
                  {t.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Mobile tabs */}
        <div className="md:hidden w-full mb-6">
          <div className="flex gap-1 overflow-x-auto pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
            {tabs.map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  data-tab={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors flex-shrink-0"
                  style={{ background: active ? 'var(--primary-muted)' : 'transparent', color: active ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: active ? 600 : 400 }}
                >
                  {t.icon}
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 md:pl-8 md:pt-0">
          {activeTab === 'general' && (
            <div className="rounded-xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Tracked Repositories</h2>
              <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Add GitHub repos to sync (format: owner/repo)</p>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newRepo}
                  onChange={(e) => setNewRepo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addRepo()}
                  placeholder="e.g. acme/my-project"
                  className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
                <button onClick={addRepo} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--primary)', color: '#fff' }}>
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <div className="space-y-2 mb-5">
                {repos.length === 0 ? (
                  <p className="text-sm py-4 text-center rounded-lg border border-dashed" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>No repositories tracked yet</p>
                ) : repos.map((repo) => (
                  <div key={repo} className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
                    <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>{repo}</span>
                    <button onClick={() => removeRepo(repo)} className="p-1 rounded transition-opacity hover:opacity-80" style={{ color: 'var(--error)' }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={saveConfig} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50" style={{ background: 'var(--primary)', color: '#fff' }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
                {saveSuccess && <span className="text-sm" style={{ color: 'var(--success)' }}>Saved!</span>}
                {saveError && <span className="text-sm" style={{ color: 'var(--error)' }}>{saveError}</span>}
              </div>

              {/* Integrations Section */}
              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                  Integrations
                </p>
                <Link
                  href="/dashboard/settings/webhooks"
                  data-testid="webhooks-settings-card"
                  className="flex items-start justify-between rounded-xl p-5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    textDecoration: 'none',
                    display: 'flex',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.background = 'var(--surface-alt)';
                    el.style.borderColor = 'rgba(99,102,241,0.4)';
                    el.style.transform = 'translateY(-1px)';
                    el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.background = 'var(--surface)';
                    el.style.borderColor = 'var(--border)';
                    el.style.transform = 'translateY(0)';
                    el.style.boxShadow = 'none';
                  }}
                >
                  <div className="flex flex-col">
                    <Webhook className="w-5 h-5 mb-3" style={{ color: 'var(--primary)' }} />
                    <span className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                      Webhooks &amp; Integrations
                    </span>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)', maxWidth: '280px' }}>
                      Configure webhooks for Discord, Slack, and custom endpoints
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'users' && isAdmin && (
            <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2 px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <Users className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>User Management</h2>
                <span className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded text-xs" style={{ background: 'var(--primary-muted)', color: 'var(--primary)' }}>
                  <Shield className="w-3 h-3" />
                  Admin
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Email', 'Role', 'Actions'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-6 py-4" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: u.role === 'admin' ? 'var(--primary-muted)' : 'var(--surface-alt)', color: u.role === 'admin' ? 'var(--primary)' : 'var(--text-muted)' }}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <select value={u.role} onChange={(e) => updateUserRole(u.id, e.target.value)} disabled={roleUpdating === u.id} className="px-2 py-1 rounded text-xs outline-none" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                              <option value="operator">Operator</option>
                              <option value="admin">Admin</option>
                            </select>
                            {roleUpdating === u.id && <Loader2 className="w-3 h-3 animate-spin" style={{ color: 'var(--text-muted)' }} />}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'templates' && <TemplateRegistryPanel isAdmin={isAdmin} />}
          {activeTab === 'environment' && <EnvStatusPanel />}
          {activeTab === 'api-keys' && isAdmin && <ApiKeyPanel />}
        </main>
      </div>
    </div>
  );
}
