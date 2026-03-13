'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { UserPlus, MoreVertical, Search } from 'lucide-react';
import { RoleBadge } from './RoleBadge';
import { StatusBadge } from './StatusBadge';
import { InviteUserModal } from './InviteUserModal';
import { EditRoleModal } from './EditRoleModal';
import { DeactivateModal } from './DeactivateModal';
import { BulkActionsBar } from './BulkActionsBar';
import { UserFilters } from './UserFilters';

interface User {
  id: string;
  email: string;
  display_name: string;
  role: string;
  is_active: boolean;
  last_sign_in_at: string | null;
  created_at: string;
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

function TableScrollContainer({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function update() {
      if (!el) return;
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    }

    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="table-scroll-container"
      role="region"
      aria-label="Users table"
      data-scroll-left={canScrollLeft}
      data-scroll-right={canScrollRight}
    >
      {children}
    </div>
  );
}

export function UserManagementClient({ currentUserId }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const [showInvite, setShowInvite] = useState(false);
  const [editRoleUser, setEditRoleUser] = useState<User | null>(null);
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null);

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
        role: roleFilter,
        status: statusFilter,
        page: String(page),
        pageSize: String(pageSize),
      });
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, statusFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounce search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  function toggleSelect(id: string) {
    if (id === currentUserId) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const eligible = users.filter(u => u.id !== currentUserId).map(u => u.id);
    if (eligible.every(id => selectedIds.has(id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(eligible));
    }
  }

  async function handleBulkAction(action: 'role_change' | 'deactivate' | 'reactivate', role?: string) {
    const res = await fetch('/api/admin/users/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_ids: Array.from(selectedIds), action, role }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`Updated ${data.updated} user${data.updated !== 1 ? 's' : ''}`);
      setSelectedIds(new Set());
      fetchUsers();
    } else {
      showToast(data.error ?? 'Bulk action failed', 'error');
    }
  }

  const totalPages = Math.ceil(total / pageSize);
  const allEligibleSelected = users.filter(u => u.id !== currentUserId).every(u => selectedIds.has(u.id));

  return (
    <div style={{ padding: '32px', maxWidth: '1280px', fontFamily: "'Outfit', system-ui, sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div
          data-testid={toast.type === 'success' ? 'toast-success' : 'toast-error'}
          style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
            background: '#0F172A', color: '#FFFFFF', padding: '14px 16px',
            borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px',
            minWidth: '320px', boxShadow: '0 10px 15px -3px rgba(15,23,42,0.25)',
            fontSize: '14px', fontWeight: 500,
          }}
        >
          {toast.type === 'success'
            ? <span style={{ color: '#10B981', fontSize: '18px' }}>✓</span>
            : <span style={{ color: '#EF4444', fontSize: '18px' }}>✕</span>}
          {toast.message}
        </div>
      )}

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Users</h1>
          <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px', marginBottom: 0 }}>Manage team access and roles</p>
        </div>
        <button
          data-testid="invite-user-btn"
          onClick={() => setShowInvite(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 600,
            background: '#2563EB', color: '#FFFFFF', border: 'none', cursor: 'pointer',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1D4ED8'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2563EB'; }}
        >
          <UserPlus size={16} /> Invite User
        </button>
      </div>

      {/* Filters */}
      <UserFilters
        search={search}
        role={roleFilter}
        status={statusFilter}
        onSearchChange={v => { setSearch(v); }}
        onRoleChange={v => { setRoleFilter(v); setPage(1); }}
        onStatusChange={v => { setStatusFilter(v); setPage(1); }}
        onClear={() => { setSearch(''); setRoleFilter('all'); setStatusFilter('all'); setPage(1); }}
      />

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          onAction={handleBulkAction}
          onClear={() => setSelectedIds(new Set())}
        />
      )}

      {/* Table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
        <TableScrollContainer>
        <table className="users-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ width: '48px', padding: '12px 16px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={allEligibleSelected && users.length > 0}
                  onChange={toggleSelectAll}
                  style={{ width: '18px', height: '18px', accentColor: '#2563EB', cursor: 'pointer' }}
                />
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User</th>
              <th style={{ width: '120px', padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
              <th style={{ width: '130px', padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
              <th style={{ width: '150px', padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Login</th>
              <th style={{ width: '48px' }} />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '64px 16px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>
                  Loading…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '64px 16px', textAlign: 'center' }}>
                  <Search size={48} style={{ color: '#CBD5E1', marginBottom: '12px' }} />
                  <p style={{ fontSize: '16px', fontWeight: 600, color: '#334155', margin: '0 0 4px' }}>
                    {search || roleFilter !== 'all' || statusFilter !== 'all' ? 'No users match your search' : 'No team members yet'}
                  </p>
                  <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
                    {search || roleFilter !== 'all' || statusFilter !== 'all' ? 'Try adjusting your filters or search term.' : 'Invite your first user to get started.'}
                  </p>
                  {!(search || roleFilter !== 'all' || statusFilter !== 'all') && (
                    <button
                      onClick={() => setShowInvite(true)}
                      style={{ marginTop: '16px', padding: '10px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 600, background: '#2563EB', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
                    >
                      Invite User
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
                    style={{
                      borderBottom: idx < users.length - 1 ? '1px solid #F1F5F9' : 'none',
                      background: isSelected ? '#DBEAFE' : 'transparent',
                      transition: 'background 150ms ease',
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = '#F8FAFC'; }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '14px 16px', textAlign: 'center', width: '48px' }}>
                      {!isOwn && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(u.id)}
                          style={{ width: '18px', height: '18px', accentColor: '#2563EB', cursor: 'pointer' }}
                        />
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '50%', background: '#2563EB',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#FFF', fontSize: '14px', fontWeight: 600, flexShrink: 0,
                        }}>
                          {getInitials(u.display_name)}
                        </div>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                            {u.display_name} {isOwn && <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 400 }}>(you)</span>}
                          </p>
                          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', width: '120px' }}>
                      <RoleBadge role={u.role} />
                    </td>
                    <td style={{ padding: '14px 16px', width: '130px' }}>
                      <StatusBadge isActive={u.is_active} />
                    </td>
                    <td style={{ padding: '14px 16px', width: '150px', fontSize: '13px', color: '#64748B' }}>
                      {formatRelativeTime(u.last_sign_in_at)}
                    </td>
                    <td style={{ padding: '14px 8px', width: '48px', position: 'relative' }}>
                      {!isOwn && (
                        <div style={{ position: 'relative' }}>
                          <button
                            data-testid="row-actions-btn"
                            onClick={() => setOpenDropdownId(openDropdownId === u.id ? null : u.id)}
                            style={{
                              width: '36px', height: '36px', border: 'none', background: 'transparent',
                              cursor: 'pointer', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F1F5F9'; (e.currentTarget as HTMLButtonElement).style.color = '#334155'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#64748B'; }}
                          >
                            <MoreVertical size={16} />
                          </button>
                          {openDropdownId === u.id && (
                            <div
                              style={{
                                position: 'absolute', right: 0, top: '100%', marginTop: '4px', zIndex: 20,
                                background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px',
                                boxShadow: '0 10px 15px -3px rgba(15,23,42,0.1)', minWidth: '180px', padding: '4px 0',
                              }}
                            >
                              <button
                                onClick={() => { setEditRoleUser(u); setOpenDropdownId(null); }}
                                style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: 'transparent', fontSize: '14px', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F1F5F9'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                              >
                                Edit Role
                              </button>
                              <div style={{ height: '1px', background: '#E2E8F0', margin: '4px 0' }} />
                              <button
                                data-testid={u.is_active ? 'deactivate-btn' : 'reactivate-btn'}
                                onClick={() => { setDeactivateUser(u); setOpenDropdownId(null); }}
                                style={{
                                  width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: 'transparent',
                                  fontSize: '14px', color: u.is_active ? '#DC2626' : '#059669', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', gap: '10px',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = u.is_active ? '#FEF2F2' : '#F0FDF4'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                              >
                                {u.is_active ? 'Deactivate' : 'Reactivate'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </TableScrollContainer>

        {/* Pagination */}
        {total > pageSize && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: '#64748B' }}>
              Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total} users
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  width: '32px', height: '32px', borderRadius: '6px', border: 'none',
                  background: 'transparent', fontSize: '13px', cursor: page === 1 ? 'not-allowed' : 'pointer',
                  color: page === 1 ? '#CBD5E1' : '#334155',
                }}
              >‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      width: '32px', height: '32px', borderRadius: '6px', border: 'none',
                      background: page === p ? '#DBEAFE' : 'transparent',
                      color: page === p ? '#1D4ED8' : '#334155',
                      fontSize: '13px', fontWeight: page === p ? 600 : 400, cursor: 'pointer',
                    }}
                  >{p}</button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  width: '32px', height: '32px', borderRadius: '6px', border: 'none',
                  background: 'transparent', fontSize: '13px', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  color: page === totalPages ? '#CBD5E1' : '#334155',
                }}
              >›</button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showInvite && (
        <InviteUserModal
          onClose={() => setShowInvite(false)}
          onSuccess={() => { setShowInvite(false); showToast('Invite sent successfully'); fetchUsers(); }}
        />
      )}
      {editRoleUser && (
        <EditRoleModal
          user={editRoleUser}
          onClose={() => setEditRoleUser(null)}
          onSuccess={() => { setEditRoleUser(null); showToast('Role updated'); fetchUsers(); }}
        />
      )}
      {deactivateUser && (
        <DeactivateModal
          user={deactivateUser}
          onClose={() => setDeactivateUser(null)}
          onSuccess={() => { setDeactivateUser(null); showToast(deactivateUser.is_active ? 'User deactivated' : 'User reactivated'); fetchUsers(); }}
        />
      )}

      {/* Close dropdowns on outside click */}
      {openDropdownId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setOpenDropdownId(null)} />
      )}
    </div>
  );
}
