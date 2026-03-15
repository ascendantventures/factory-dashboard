'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { UserPlus, Search, ChevronLeft, ChevronRight, Trash2, Shield, User, ChevronDown, SearchX, FlaskConical, CheckCircle } from 'lucide-react';
import { InviteUserModal } from './InviteUserModal';
import { DeactivateModal } from './DeactivateModal';
import { UserFilterTabs, type UserFilter } from './UserFilterTabs';
import { TestAccountBadge } from './TestAccountBadge';
import { RoleChangeConfirmDialog } from './RoleChangeConfirmDialog';
import { BulkDeleteConfirmDialog } from './BulkDeleteConfirmDialog';
import { RoleAuditPanel } from './RoleAuditPanel';
import { QaPurgePanel } from './QaPurgePanel';

interface User {
  id: string;
  email: string;
  display_name: string;
  role: string;
  is_active: boolean;
  last_sign_in_at: string | null;
  created_at: string;
  isTestAccount: boolean;
}

interface Props {
  currentUserId: string;
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function RoleDropdown({ userId, currentRole, disabled, onRoleChange }: {
  userId: string; currentRole: string; disabled: boolean;
  onRoleChange: (userId: string, newRole: string, oldRole: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    if (open) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative', width: '120px' }}>
      <button data-testid="role-dropdown" onClick={() => !disabled && setOpen(v => !v)} disabled={disabled}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '120px', height: '32px', padding: '0 10px', background: '#18181B', border: '1px solid #3F3F46', borderRadius: '6px', fontFamily: "'Inter', system-ui, sans-serif", fontSize: '13px', fontWeight: 500, color: disabled ? 'rgba(250,250,250,0.5)' : '#FAFAFA', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}
        onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.borderColor = '#71717A'; }}
        onMouseLeave={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.borderColor = '#3F3F46'; }}
      >
        <span style={{ textTransform: 'capitalize' }}>{currentRole}</span>
        <ChevronDown size={14} style={{ color: '#71717A', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '140px', background: '#323238', border: '1px solid #3F3F46', borderRadius: '6px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.4)', zIndex: 50, padding: '4px' }}>
          {(['admin', 'operator'] as const).map(r => (
            <button key={r} onClick={() => { setOpen(false); if (r !== currentRole) onRoleChange(userId, r, currentRole); }}
              style={{ width: '100%', textAlign: 'left', padding: '8px 10px', border: 'none', borderRadius: '4px', background: r === currentRole ? 'rgba(99,102,241,0.15)' : 'transparent', fontFamily: "'Inter', system-ui, sans-serif", fontSize: '13px', fontWeight: r === currentRole ? 500 : 400, color: r === currentRole ? '#6366F1' : '#A1A1AA', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'capitalize' }}
              onMouseEnter={e => { if (r !== currentRole) { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.15)'; (e.currentTarget as HTMLButtonElement).style.color = '#FAFAFA'; } }}
              onMouseLeave={e => { if (r !== currentRole) { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#A1A1AA'; } }}
            >
              {r === 'admin' ? <Shield size={12} /> : <User size={12} />}
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.25)', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 500, color: '#4ADE80', textTransform: 'uppercase' as const, letterSpacing: '0.02em' }}>
      <CheckCircle size={10} />ACTIVE
    </span>
  );
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '4px', background: '#27272A', border: '1px solid #3F3F46', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 500, color: '#71717A', textTransform: 'uppercase' as const, letterSpacing: '0.02em' }}>
      INACTIVE
    </span>
  );
}

export function UserManagementClient({ currentUserId }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ all: 0, real: 0, test: 0 });
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<UserFilter>('all');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingRoleChange, setPendingRoleChange] = useState<{ userId: string; email: string; fromRole: string; toRole: string } | null>(null);
  const [roleChangeLoading, setRoleChangeLoading] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users?pageSize=1&page=1&filter=all');
      const data = await res.json();
      if (res.ok) setCounts({ all: data.total, real: data.realCount ?? 0, test: data.testCount ?? 0 });
    } catch { /* non-blocking */ }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search: debouncedSearch, filter, page: String(page), pageSize: String(pageSize) });
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (res.ok) { setUsers(data.users); setTotal(data.total); setTotalPages(data.totalPages ?? 1); }
    } finally { setLoading(false); }
  }, [debouncedSearch, filter, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  function handleFilterChange(v: UserFilter) { setFilter(v); setPage(1); setSelectedIds(new Set()); }

  function toggleSelect(id: string) {
    if (id === currentUserId) return;
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleSelectAll() {
    const eligible = users.filter(u => u.id !== currentUserId).map(u => u.id);
    if (eligible.every(id => selectedIds.has(id))) setSelectedIds(new Set());
    else setSelectedIds(new Set(eligible));
  }

  function handleRoleChange(userId: string, newRole: string, oldRole: string) {
    const u = users.find(u => u.id === userId);
    if (u) setPendingRoleChange({ userId, email: u.email, fromRole: oldRole, toRole: newRole });
  }

  async function confirmRoleChange() {
    if (!pendingRoleChange) return;
    setRoleChangeLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${pendingRoleChange.userId}/role`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: pendingRoleChange.toRole }),
      });
      if (res.ok) { showToast('Role updated'); setPendingRoleChange(null); fetchUsers(); }
      else { const d = await res.json(); showToast(d.error ?? 'Role update failed', 'error'); }
    } finally { setRoleChangeLoading(false); }
  }

  async function handleDeleteUser(userId: string, email: string) {
    if (!confirm(`Delete ${email}? This cannot be undone.`)) return;
    const res = await fetch('/api/admin/users/bulk', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userIds: [userId] }) });
    if (res.ok) { showToast(`Deleted ${email}`); fetchUsers(); fetchCounts(); }
    else showToast('Delete failed', 'error');
  }

  async function confirmBulkDelete() {
    setBulkDeleteLoading(true);
    try {
      const res = await fetch('/api/admin/users/bulk', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userIds: Array.from(selectedIds) }) });
      const data = await res.json();
      if (res.ok) { showToast(`Deleted ${data.deleted} user${data.deleted !== 1 ? 's' : ''}`); setSelectedIds(new Set()); setShowBulkDelete(false); fetchUsers(); fetchCounts(); }
      else showToast(data.error ?? 'Bulk delete failed', 'error');
    } finally { setBulkDeleteLoading(false); }
  }

  const allEligibleSelected = users.filter(u => u.id !== currentUserId).length > 0 &&
    users.filter(u => u.id !== currentUserId).every(u => selectedIds.has(u.id));

  return (
    <div style={{ padding: '32px', maxWidth: '1280px', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, background: '#18181B', color: '#FAFAFA', padding: '14px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', minWidth: '280px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.4)', fontSize: '14px', fontWeight: 500, border: '1px solid #3F3F46' }}>
          {toast.type === 'success' ? <span style={{ color: '#4ADE80' }}>✓</span> : <span style={{ color: '#EF4444' }}>✕</span>}
          {toast.message}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '28px', fontWeight: 700, color: '#FAFAFA', margin: 0, letterSpacing: '-0.02em' }}>Users</h1>
          <p style={{ fontSize: '14px', color: '#A1A1AA', marginTop: '4px', marginBottom: 0 }}>Manage team access and roles</p>
        </div>
        <button data-testid="invite-user-btn" onClick={() => setShowInvite(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 600, background: '#6366F1', color: '#fff', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#4F46E5'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#6366F1'; }}
        >
          <UserPlus size={16} /> Invite User
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717A', pointerEvents: 'none' }} />
          <input type="text" data-testid="user-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email"
            style={{ height: '40px', width: '100%', boxSizing: 'border-box', background: '#18181B', border: '1px solid #3F3F46', borderRadius: '6px', paddingLeft: '40px', paddingRight: '12px', fontSize: '14px', color: '#FAFAFA', outline: 'none', fontFamily: "'Inter', system-ui, sans-serif" }}
            onFocus={e => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.25)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#3F3F46'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
        <UserFilterTabs activeFilter={filter} counts={counts} onChange={handleFilterChange} />
      </div>

      <div data-testid="user-table" style={{ background: '#18181B', border: '1px solid #3F3F46', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#27272A', borderBottom: '1px solid #3F3F46', height: '44px' }}>
              <th style={{ width: '40px', padding: '0 16px', textAlign: 'center' }}>
                <input data-testid="select-all-checkbox" type="checkbox" checked={allEligibleSelected && users.length > 0} onChange={toggleSelectAll}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#6366F1' }} />
              </th>
              <th style={{ padding: '0 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.02em' }}>User</th>
              <th style={{ width: '140px', padding: '0 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Role</th>
              <th style={{ width: '100px', padding: '0 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Status</th>
              <th style={{ width: '140px', padding: '0 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Last Sign In</th>
              <th style={{ width: '60px' }} />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '64px 16px', textAlign: 'center', color: '#71717A', fontSize: '14px' }}>Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '64px 24px', textAlign: 'center' }}>
                  {filter === 'test' ? (
                    <>
                      <FlaskConical size={48} style={{ color: '#71717A', opacity: 0.5, marginBottom: '16px' }} />
                      <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '18px', fontWeight: 600, color: '#FAFAFA', margin: '0 0 8px' }}>No test accounts found</p>
                      <p style={{ fontSize: '14px', color: '#A1A1AA', margin: 0 }}>Test accounts match patterns: qa_, qa-, testuser+, _test, +test</p>
                    </>
                  ) : (
                    <>
                      <SearchX size={48} style={{ color: '#71717A', opacity: 0.5, marginBottom: '16px' }} />
                      <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '18px', fontWeight: 600, color: '#FAFAFA', margin: '0 0 8px' }}>{search ? 'No users found' : 'No team members yet'}</p>
                      <p style={{ fontSize: '14px', color: '#A1A1AA', margin: '0 0 16px' }}>{search ? 'Try adjusting your search or filter criteria.' : 'Invite your first user to get started.'}</p>
                      {search && (
                        <button onClick={() => setSearch('')}
                          style={{ padding: '10px 16px', border: '1px solid #3F3F46', borderRadius: '6px', background: 'transparent', fontSize: '14px', fontWeight: 500, color: '#A1A1AA', cursor: 'pointer' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#27272A'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                        >Clear filters</button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ) : users.map((u, idx) => {
              const isSelected = selectedIds.has(u.id);
              const isOwn = u.id === currentUserId;
              return (
                <tr key={u.id} data-testid="user-row"
                  style={{ height: '56px', borderBottom: idx < users.length - 1 ? '1px solid #2D2D33' : 'none', background: isSelected ? 'rgba(99,102,241,0.15)' : '#18181B', transition: 'background 150ms ease', borderLeft: isSelected ? '2px solid #6366F1' : '2px solid transparent' }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(99,102,241,0.08)'; }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = '#18181B'; }}
                >
                  <td style={{ padding: '0 16px', textAlign: 'center', width: '40px' }}>
                    {!isOwn && <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(u.id)} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#6366F1' }} />}
                  </td>
                  <td style={{ padding: '0 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: u.isTestAccount ? 'rgba(245,158,11,0.2)' : 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: u.isTestAccount ? '#F59E0B' : '#6366F1', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: 600, flexShrink: 0 }}>
                        {getInitials(u.display_name)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                          <span data-testid="user-email" style={{ fontSize: '14px', fontWeight: 500, color: '#FAFAFA' }}>{u.email}</span>
                          {isOwn && <span style={{ fontSize: '11px', color: '#71717A' }}>(you)</span>}
                          {u.isTestAccount && <TestAccountBadge />}
                        </div>
                        {u.display_name && u.display_name !== u.email.split('@')[0] && (
                          <span style={{ fontSize: '12px', color: '#71717A' }}>{u.display_name}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0 16px', width: '140px' }}>
                    <RoleDropdown userId={u.id} currentRole={u.role} disabled={isOwn || roleChangeLoading} onRoleChange={handleRoleChange} />
                  </td>
                  <td style={{ padding: '0 16px', width: '100px' }}><StatusBadge isActive={u.is_active} /></td>
                  <td style={{ padding: '0 16px', width: '140px', fontSize: '13px', color: '#71717A' }}>{formatRelativeTime(u.last_sign_in_at)}</td>
                  <td style={{ padding: '0 8px', width: '60px', textAlign: 'center' }}>
                    {!isOwn && (
                      <button onClick={() => handleDeleteUser(u.id, u.email)} title={`Delete ${u.email}`}
                        style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717A', transition: 'all 150ms ease' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.12)'; (e.currentTarget as HTMLButtonElement).style.color = '#EF4444'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#71717A'; }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {total > 0 && (
          <div data-testid="pagination" style={{ padding: '12px 16px', borderTop: '1px solid #3F3F46', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: '#71717A' }}>Page {page} of {totalPages}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { key: 'prev', icon: <ChevronLeft size={18} />, disabled: page === 1, action: () => setPage(p => Math.max(1, p - 1)) },
                { key: 'next', icon: <ChevronRight size={18} />, disabled: page === totalPages, action: () => setPage(p => Math.min(totalPages, p + 1)) },
              ].map(btn => (
                <button key={btn.key} onClick={btn.action} disabled={btn.disabled}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', border: '1px solid #3F3F46', borderRadius: '6px', background: '#18181B', color: btn.disabled ? '#3F3F46' : '#A1A1AA', cursor: btn.disabled ? 'not-allowed' : 'pointer', opacity: btn.disabled ? 0.4 : 1, transition: 'all 150ms ease' }}
                  onMouseEnter={e => { if (!btn.disabled) { (e.currentTarget as HTMLButtonElement).style.background = '#27272A'; (e.currentTarget as HTMLButtonElement).style.color = '#FAFAFA'; } }}
                  onMouseLeave={e => { if (!btn.disabled) { (e.currentTarget as HTMLButtonElement).style.background = '#18181B'; (e.currentTarget as HTMLButtonElement).style.color = '#A1A1AA'; } }}
                >
                  {btn.icon}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div data-testid="bulk-action-bar" style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '16px', background: '#323238', border: '1px solid #3F3F46', borderRadius: '8px', padding: '12px 20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.4)', zIndex: 40 }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#FAFAFA', whiteSpace: 'nowrap' }}>{selectedIds.size} selected</span>
          <div style={{ width: '1px', height: '24px', background: '#3F3F46' }} />
          <button data-testid="bulk-delete-btn" onClick={() => setShowBulkDelete(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#EF4444', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#DC2626'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#EF4444'; }}
          >
            <Trash2 size={16} />Delete {selectedIds.size} Selected
          </button>
        </div>
      )}

      {pendingRoleChange && (
        <RoleChangeConfirmDialog email={pendingRoleChange.email} fromRole={pendingRoleChange.fromRole} toRole={pendingRoleChange.toRole} loading={roleChangeLoading} onConfirm={confirmRoleChange} onCancel={() => setPendingRoleChange(null)} />
      )}
      {showBulkDelete && (
        <BulkDeleteConfirmDialog count={selectedIds.size} loading={bulkDeleteLoading} onConfirm={confirmBulkDelete} onCancel={() => setShowBulkDelete(false)} />
      )}
      {deactivateUser && (
        <DeactivateModal user={deactivateUser} onClose={() => setDeactivateUser(null)} onSuccess={() => { const wasActive = deactivateUser.is_active; setDeactivateUser(null); showToast(wasActive ? 'User deactivated' : 'User reactivated'); fetchUsers(); fetchCounts(); }} />
      )}
      {showInvite && (
        <InviteUserModal onClose={() => setShowInvite(false)} onSuccess={() => { setShowInvite(false); showToast('Invite sent successfully'); fetchUsers(); fetchCounts(); }} />
      )}

      <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <RoleAuditPanel />
        <QaPurgePanel />
      </div>
    </div>
  );
}
