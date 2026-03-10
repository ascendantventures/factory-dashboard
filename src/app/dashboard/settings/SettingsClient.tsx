'use client';

import { useState, useRef } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Plus, Trash2, Loader2, Save, Shield, Users } from 'lucide-react';
import { DashDashboardConfig } from '@/types';

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

export function SettingsClient({ userId, initialConfig, isAdmin, allUsers }: SettingsClientProps) {
  const supabaseRef = useRef<SupabaseClient | null>(null);

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

    const payload = {
      user_id: userId,
      tracked_repos: repos,
      updated_at: new Date().toISOString(),
    };

    const supabase = await getSupabase();
    const { error } = await supabase
      .from('dash_dashboard_config')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) {
      setSaveError(error.message);
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setSaving(false);
  }

  async function updateUserRole(targetUserId: string, role: string) {
    setRoleUpdating(targetUserId);
    const supabase = await getSupabase();
    const { error } = await supabase
      .from('dash_user_roles')
      .upsert({ user_id: targetUserId, role, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });

    if (!error) {
      setUsers((prev) => prev.map((u) => u.id === targetUserId ? { ...u, role } : u));
    }
    setRoleUpdating(null);
  }

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto">
      <h1
        className="text-2xl font-bold mb-6"
        style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}
      >
        Settings
      </h1>

      {/* Tracked Repos */}
      <div
        className="rounded-xl border p-6 mb-6"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <h2
          className="text-base font-semibold mb-1"
          style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}
        >
          Tracked Repositories
        </h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
          Add GitHub repos to sync (format: owner/repo)
        </p>

        {/* Add repo */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newRepo}
            onChange={(e) => setNewRepo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addRepo()}
            placeholder="e.g. acme/my-project"
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              background: 'var(--surface-alt)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            onClick={addRepo}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Repo list */}
        <div className="space-y-2 mb-5">
          {repos.length === 0 ? (
            <p className="text-sm py-4 text-center rounded-lg border border-dashed" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
              No repositories tracked yet
            </p>
          ) : (
            repos.map((repo) => (
              <div
                key={repo}
                className="flex items-center justify-between px-4 py-3 rounded-lg"
                style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}
              >
                <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                  {repo}
                </span>
                <button
                  onClick={() => removeRepo(repo)}
                  className="p-1 rounded transition-opacity hover:opacity-80"
                  style={{ color: 'var(--error)' }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            onClick={saveConfig}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
          {saveSuccess && (
            <span className="text-sm" style={{ color: 'var(--success)' }}>
              Saved!
            </span>
          )}
          {saveError && (
            <span className="text-sm" style={{ color: 'var(--error)' }}>
              {saveError}
            </span>
          )}
        </div>
      </div>

      {/* User Management (admin only) */}
      {isAdmin && (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div
            className="flex items-center gap-2 px-6 py-4 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <Users className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            <h2
              className="text-base font-semibold"
              style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}
            >
              User Management
            </h2>
            <span
              className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded text-xs"
              style={{ background: '#3B82F620', color: 'var(--primary)', border: '1px solid #3B82F630' }}
            >
              <Shield className="w-3 h-3" />
              Admin
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Email', 'Role', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-medium"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-6 py-4" style={{ color: 'var(--text-secondary)' }}>
                      {u.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: u.role === 'admin' ? '#3B82F620' : 'var(--surface-alt)',
                          color: u.role === 'admin' ? 'var(--primary)' : 'var(--text-muted)',
                          border: `1px solid ${u.role === 'admin' ? '#3B82F640' : 'var(--border)'}`,
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={u.role}
                          onChange={(e) => updateUserRole(u.id, e.target.value)}
                          disabled={roleUpdating === u.id}
                          className="px-2 py-1 rounded text-xs outline-none"
                          style={{
                            background: 'var(--surface-alt)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          <option value="operator">Operator</option>
                          <option value="admin">Admin</option>
                        </select>
                        {roleUpdating === u.id && (
                          <Loader2 className="w-3 h-3 animate-spin" style={{ color: 'var(--text-muted)' }} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
