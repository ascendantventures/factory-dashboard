'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { UserPlus, Search, SearchX, ChevronDown, ChevronLeft, ChevronRight, Trash2, CheckCircle } from 'lucide-react';
import { RoleBadge } from './RoleBadge';
import { StatusBadge } from './StatusBadge';
import { InviteUserModal } from './InviteUserModal';
import { DeactivateModal } from './DeactivateModal';
import { UserFilterTabs, type UserFilter } from './UserFilterTabs';
import { TestAccountBadge } from './TestAccountBadge';
import { RoleChangeConfirmDialog } from './RoleChangeConfirmDialog';
import { BulkDeleteConfirmDialog } from './BulkDeleteConfirmDialog';

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

interface Counts {
  all: number;
  real: number;
  test: number;
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

// Inline role selector for a single row
function RoleSelector({
  userId,
  currentRole,
  isOwn,
  onRoleChange,
}: {
  userId: string;
  currentRole: string;
  isOwn: boolean;
  onRoleChange: (userId: string, newRole: string, oldRole: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (isOwn) return <RoleBadge role={currentRole} />;

  const roles = ['admin', 'operator', 'viewer'];

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        data-testid="role-dropdown"
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '120px', height: '32px', padding: '0 10px',
          background: '#18181B', border: '1px solid #3F3F46', borderRadius: '6px',
          fontSize: '13px', fontWeight: 500, color: '#FAFAFA', cursor: 'pointer',
          fontFamily: "'Inter', system-ui, sans-serif", gap: '6px',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#71717A'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#3F3F46'; }}
      >
        <span style={{ textTransform: 'capitalize' }}>{currentRole}</span>
        <ChevronDown size={14} style={{ color: '#71717A', flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '140px',
          background: '#323238', border: '1px solid #3F3F46', borderRadius: '6px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)', zIndex: 50, padding: '4px',
        }}>
          {roles.map(r => (
            <button
              key={r}
              onClick={() => { setOpen(false); if (r !== currentRole) onRoleChange(userId, r, currentRole); }}
              style={{
                width: '100%', textAlign: 'left', padding: '8px 10px', border: 'none', borderRadius: '4px',
                background: r === currentRole ? 'rgba(99,102,241,0.15)' : 'transparent',
                fontSize: '13px', fontWeight: r === currentRole ? 500 : 400,
                color: r === currentRole ? '#6366F1' : '#A1A1AA',
                cursor: 'pointer', textTransform: 'capitalize', fontFamily: "'Inter', system-ui, sans-serif",
              }}
              onMouseEnter={e => { if (r !== currentRole) { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.15)'; (e.currentTarget as HTMLButtonElement).style.color = '#FAFAFA'; } }}
              onMouseLeave={e => { if (r !== currentRole) { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#A1A1AA'; } }}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function UserManagementClient({ currentUserId }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState<Counts>({ all: 0, real: 0, test: 0 });
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<UserFilter>('all');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [showInvite, setShowInvite] = useState(false);
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null);

  const [pendingRoleChange, setPendingRoleChange] = useState<{
    userId: string; email: string; fromRole: string; toRole: string;
  } | null>(null);
  const [roleChangeLoading, setRoleChangeLoading] = useState(false);

  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: debouncedSearch,
        filter,
        page: String(page),
        pageSize: String(pageSize),
      });
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
        setTotal(data.total);
        setTotalPages(data.totalPages ?? Math.ceil(data.total / pageSize));
        if (data.counts) setCounts(data.counts);
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filter, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  function toggleSelect(id: string) {
    if (id === currentUserId) return;
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  function toggleSelectAll() {
    const eligible = users.filter(u => u.id !== currentUserId).map(u => u.id);
    if (eligible.every(id => selectedIds.has(id))) { setSelectedIds(new Set()); }
    else { setSelectedIds(new Set(eligible)); }
  }

  function handleRoleDropdownChange(userId: string, newRole: string, oldRole: string) {
    const u = users.find(u => u.id === userId);
    if (!u) return;
    setPendingRoleChange({ userId, email: u.email, fromRole: oldRole, toRole: newRole });
  }

  async function confirmRoleChange() {
    if (!pendingRoleChange) return;
    setRoleChangeLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${pendingRoleChange.userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: pendingRoleChange.toRole }),
      });
      if (res.ok) { showToast('Role updated'); setPendingRoleChange(null); fetchUsers(); }
      else { const data = await res.json(); showToast(data.error ?? 'Role update failed', 'error'); }
    } finally { setRoleChangeLoading(false); }
  }

  async function confirmBulkDelete() {
    setBulkDeleteLoading(true);
    try {
      const res = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_ids: Array.from(selectedIds), action: 'delete' }),
      });
      const data = await res.json();
      if (res.ok) { showToast(`Deleted ${data.updated} user${data.updated !== 1 ? 's' : ''}`); setSelectedIds(new Set()); setShowBulkDelete(false); fetchUsers(); }
      else { showToast(data.error ?? 'Bulk delete failed', 'error'); }
    } finally { setBulkDeleteLoading(false); }
  }

  async function handleSingleDelete(userId: string) {
    const res = await fetch('/api/admin/users/bulk', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_ids: [userId], action: 'delete' }),
    });
    if (res.ok) { showToast('User deleted'); fetchUsers(); }
    else { const data = await res.json(); showToast(data.error ?? 'Delete failed', 'error'); }
  }

  const eligible = users.filter(u => u.id !== currentUserId);
  const allEligibleSelected = eligible.length > 0 && eligible.every(u => selectedIds.has(u.id));
  const hasFilters = !!search || filter !== 'all';

  return (
    <div style={{ padding: '32px', maxWidth: '1280px', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div
          data-testid={toast.type === 'success' ? 'toast-success' : 'toast-error'}
          style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
            background: '#18181B', color: '#FAFAFA', padding: '14px 16px',
            borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px',
            minWidth: '320px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.4)',
            fontSize: '14px', fontWeight: 500, border: '1px solid #3F3F46',
          }}
        >
          {toast.type === 'success'
            ? <CheckCircle size={18} style={{ color: '#22C55E', flexShrink: 0 }} />
            : <span style={{ color: '#EF4444', fontSize: '18px', flexShrink: 0 }}>✕</span>}
          {toast.message}
        </div>
      )}

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#FAFAFA', margin: 0, letterSpacing: '-0.02em', fontFamily: "'DM Sans', system-ui, sans-serif" }}>Users</h1>
          <p style={{ fontSize: '14px', color: '#A1A1AA', marginTop: '4px', marginBottom: 0 }}>Manage team access and roles</p>
        </div>
        <button
          data-testid="invite-user-btn"
          onClick={() => setShowInvite(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 600,
            background: '#6366F1', color: '#fff', border: 'none', cursor: 'pointer',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#4F46E5'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#6366F1'; }}
        >
          <UserPlus size={16} /> Invite User
        </button>
      </div>

      {/* Toolbar: search + filter tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717A', pointerEvents: 'none' }} />
          <input
            type="text"
            data-testid="user-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by email"
            style={{
              height: '40px', width: '100%', boxSizing: 'border-box',
              border: '1px solid #3F3F46', borderRadius: '6px',
              paddingLeft: '40px', paddingRight: '12px',
              fontSize: '14px', color: '#FAFAFA', background: '#18181B', outline: 'none',
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.25)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#3F3F46'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
        <UserFilterTabs activeFilter={filter} counts={counts} onChange={v => { setFilter(v); setPage(1); }} />
        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setFilter('all'); setPage(1); }}
            style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, border: 'none', background: 'transparent', color: '#6366F1', cursor: 'pointer' }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div
          data-testid="bulk-action-bar"
          style={{
            position: 'sticky', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
            display: 'inline-flex', alignItems: 'center', gap: '16px',
            background: '#323238', border: '1px solid #3F3F46', borderRadius: '8px',
            padding: '12px 20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.4)', zIndex: 40, marginBottom: '16px',
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#FAFAFA' }}>{selectedIds.size} selected</span>
          <div style={{ width: '1px', height: '24px', background: '#3F3F46' }} />
          <button
            data-testid="bulk-delete-btn"
            onClick={() => setShowBulkDelete(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 16px', border: 'none', borderRadius: '6px',
              background: '#EF4444', fontSize: '14px', fontWeight: 600, color: '#fff', cursor: 'pointer',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#DC2626'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#EF4444'; }}
          >
            <Trash2 size={16} /> Delete {selectedIds.size} Selected
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            style={{ padding: '8px 12px', border: 'none', background: 'transparent', color: '#71717A', cursor: 'pointer', fontSize: '13px' }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div data-testid="user-table" style={{ background: '#18181B', border: '1px solid #3F3F46', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#27272A', borderBottom: '1px solid #3F3F46' }}>
              <th style={{ width: '40px', padding: '12px 16px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  data-testid="select-all-checkbox"
                  checked={allEligibleSelected}
                  onChange={toggleSelectAll}
                  style={{ width: '16px', height: '16px', accentColor: '#6366F1', cursor: 'pointer' }}
                />
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.02em' }}>User</th>
              <th style={{ width: '140px', padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Role</th>
              <th style={{ width: '100px', padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Status</th>
              <th style={{ width: '140px', padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Last Sign In</th>
              <th style={{ width: '60px' }} />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '64px 16px', textAlign: 'center', color: '#71717A', fontSize: '14px' }}>Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '64px 24px', textAlign: 'center' }}>
                  <SearchX size={48} style={{ color: '#71717A', opacity: 0.5, marginBottom: '16px' }} />
                  <p style={{ fontSize: '18px', fontWeight: 600, color: '#FAFAFA', margin: '0 0 8px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                    {filter === 'test' ? 'No test accounts found' : 'No users found'}
                  </p>
                  <p style={{ fontSize: '14px', color: '#A1A1AA', margin: '0 0 16px' }}>
                    {filter === 'test'
                      ? 'Test accounts match patterns: qa_, qa-, testuser+, _test, +test'
                      : 'Try adjusting your search or filter criteria.'}
                  </p>
                  {hasFilters && (
                    <button
                      onClick={() => { setSearch(''); setFilter('all'); setPage(1); }}
                      style={{ padding: '10px 16px', border: '1px solid #3F3F46', borderRadius: '6px', background: 'transparent', fontSize: '14px', fontWeight: 500, color: '#A1A1AA', cursor: 'pointer' }}
                    >
                      Clear filters
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              users.map((u, idx) => {
                const isSelected = selectedIds.has(u.id);
                const isOwn = u.id === currentUserId;
                return (
                  <tr
                    key={u.id}
                    data-testid="user-row"
                    style={{
                      borderBottom: idx < users.length - 1 ? '1px solid #2D2D33' : 'none',
                      background: isSelected ? 'rgba(99,102,241,0.15)' : '#18181B',
                      borderLeft: isSelected ? '2px solid #6366F1' : '2px solid transparent',
                      transition: 'background 150ms ease',
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(99,102,241,0.08)'; }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = '#18181B'; }}
                  >
                    <td style={{ padding: '14px 16px', textAlign: 'center', width: '40px' }}>
                      {!isOwn && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(u.id)}
                          style={{ width: '16px', height: '16px', accentColor: '#6366F1', cursor: 'pointer' }}
                        />
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%', background: '#6366F1',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: '13px', fontWeight: 600, flexShrink: 0,
                        }}>
                          {getInitials(u.display_name)}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span data-testid="user-email" style={{ fontSize: '14px', fontWeight: 500, color: '#FAFAFA' }}>
                              {u.email}
                            </span>
                            {isOwn && <span style={{ fontSize: '11px', color: '#71717A', fontWeight: 400 }}>(you)</span>}
                            {u.isTestAccount && <TestAccountBadge />}
                          </div>
                          {u.display_name && u.display_name !== u.email.split('@')[0] && (
                            <p style={{ fontSize: '12px', color: '#71717A', margin: 0 }}>{u.display_name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', width: '140px' }}>
                      <RoleSelector
                        userId={u.id}
                        currentRole={u.role}
                        isOwn={isOwn}
                        onRoleChange={handleRoleDropdownChange}
                      />
                    </td>
                    <td style={{ padding: '14px 16px', width: '100px' }}>
                      <StatusBadge isActive={u.is_active} />
                    </td>
                    <td style={{ padding: '14px 16px', width: '140px', fontSize: '13px', color: '#71717A' }}>
                      {formatRelativeTime(u.last_sign_in_at)}
                    </td>
                    <td style={{ padding: '14px 8px', width: '60px', textAlign: 'center' }}>
                      {!isOwn && (
                        <button
                          data-testid="row-delete-btn"
                          onClick={() => handleSingleDelete(u.id)}
                          title="Delete user"
                          style={{
                            width: '32px', height: '32px', border: 'none', background: 'transparent',
                            cursor: 'pointer', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717A',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.12)'; (e.currentTarget as HTMLButtonElement).style.color = '#EF4444'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#71717A'; }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            data-testid="pagination"
            style={{
              padding: '12px 16px', borderTop: '1px solid #3F3F46',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '13px', color: '#71717A' }}>Page {page} of {totalPages}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '36px', height: '36px', borderRadius: '6px',
                  border: '1px solid #3F3F46', background: '#18181B',
                  color: page === 1 ? '#3F3F46' : '#A1A1AA',
                  cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1,
                }}
                onMouseEnter={e => { if (page > 1) (e.currentTarget as HTMLButtonElement).style.background = '#27272A'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#18181B'; }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '36px', height: '36px', borderRadius: '6px',
                  border: '1px solid #3F3F46', background: '#18181B',
                  color: page >= totalPages ? '#3F3F46' : '#A1A1AA',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1,
                }}
                onMouseEnter={e => { if (page < totalPages) (e.currentTarget as HTMLButtonElement).style.background = '#27272A'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#18181B'; }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Role change confirmation dialog */}
      {pendingRoleChange && (
        <RoleChangeConfirmDialog
          email={pendingRoleChange.email}
          fromRole={pendingRoleChange.fromRole}
          toRole={pendingRoleChange.toRole}
          loading={roleChangeLoading}
          onConfirm={confirmRoleChange}
          onCancel={() => setPendingRoleChange(null)}
        />
      )}

      {/* Bulk delete confirmation dialog */}
      {showBulkDelete && (
        <BulkDeleteConfirmDialog
          count={selectedIds.size}
          loading={bulkDeleteLoading}
          onConfirm={confirmBulkDelete}
          onCancel={() => setShowBulkDelete(false)}
        />
      )}

      {/* Invite modal */}
      {showInvite && (
        <InviteUserModal
          onClose={() => setShowInvite(false)}
          onSuccess={() => { setShowInvite(false); showToast('Invite sent successfully'); fetchUsers(); }}
        />
      )}

      {/* Deactivate modal */}
      {deactivateUser && (
        <DeactivateModal
          user={deactivateUser}
          onClose={() => setDeactivateUser(null)}
          onSuccess={() => { setDeactivateUser(null); showToast(deactivateUser.is_active ? 'User deactivated' : 'User reactivated'); fetchUsers(); }}
        />
      )}
    </div>
  );
}
