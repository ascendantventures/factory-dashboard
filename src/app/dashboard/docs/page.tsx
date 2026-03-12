'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  X,
  ChevronDown,
  Lock,
} from 'lucide-react';
import { ROUTE_MANIFEST, ROUTE_CATEGORIES, type RouteEntry, type RouteCategory } from '@/lib/route-manifest';

// ── Method Badge ─────────────────────────────────────────────────────────────
function MethodBadge({ method }: { method: RouteEntry['method'] }) {
  const styles: Record<string, { background: string; color: string }> = {
    GET: { background: '#D1FAE5', color: '#059669' },
    POST: { background: '#DBEAFE', color: '#2563EB' },
    PATCH: { background: '#FEF3C7', color: '#D97706' },
    PUT: { background: '#FEF3C7', color: '#D97706' },
    DELETE: { background: '#FEE2E2', color: '#DC2626' },
  };
  const s = styles[method] ?? styles.GET;
  return (
    <span
      className="shrink-0"
      style={{
        ...s,
        padding: '4px 6px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 600,
        fontFamily: 'monospace',
        letterSpacing: '0.02em',
      }}
    >
      {method}
    </span>
  );
}

// ── Category Badge ────────────────────────────────────────────────────────────
function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      style={{
        background: '#F4F5F7',
        color: '#475569',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 500,
      }}
    >
      {category}
    </span>
  );
}

// ── Route Card ────────────────────────────────────────────────────────────────
function RouteCard({ route }: { route: RouteEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      data-testid="route-card"
      className="rounded-lg cursor-pointer transition-all"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E4E9',
        marginBottom: '8px',
        transition: 'border-color 150ms ease, background 150ms ease',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Collapsed row */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ minHeight: '56px' }}
      >
        <MethodBadge method={route.method} />
        <span
          className="flex-1 min-w-0 truncate"
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#0F172A',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {route.path}
        </span>
        <span
          className="hidden sm:block shrink-0"
          style={{ fontSize: '13px', color: '#475569', flex: '0 0 auto', maxWidth: '300px' }}
        >
          {route.description}
        </span>
        <CategoryBadge category={route.category} />
        <ChevronDown
          size={18}
          style={{
            color: '#94A3B8',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease',
            flexShrink: 0,
          }}
        />
      </div>

      {/* Expanded content */}
      {expanded && (
        <div
          className="border-t px-5 pb-5 pt-4"
          style={{ borderColor: '#E2E4E9' }}
          onClick={(e) => e.stopPropagation()}
        >
          <p style={{ fontSize: '14px', color: '#475569', marginBottom: '20px' }}>
            {route.description}
          </p>

          {/* Parameters */}
          {route.parameters.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '12px',
                }}
              >
                Parameters
              </h4>
              <div
                className="overflow-hidden rounded-md"
                style={{ background: '#F4F5F7', border: '1px solid #E2E4E9' }}
              >
                <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E2E4E9' }}>
                      {['Name', 'In', 'Type', 'Required', 'Description'].map((h) => (
                        <th
                          key={h}
                          className="text-left"
                          style={{
                            padding: '8px 12px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#94A3B8',
                            textTransform: 'uppercase',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {route.parameters.map((p, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom: i < route.parameters.length - 1 ? '1px solid #E2E4E9' : 'none',
                        }}
                      >
                        <td
                          style={{
                            padding: '8px 12px',
                            fontSize: '13px',
                            color: '#0F172A',
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {p.name}
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: '13px', color: '#475569' }}>
                          {p.in}
                        </td>
                        <td
                          style={{
                            padding: '8px 12px',
                            fontSize: '13px',
                            color: '#475569',
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {p.type}
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: '13px', color: '#475569' }}>
                          {p.required ? 'Yes' : 'No'}
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: '13px', color: '#475569' }}>
                          {p.description ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Example Request */}
          {route.example_request && (
            <div style={{ marginBottom: '20px' }}>
              <h4
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '12px',
                }}
              >
                Example Request
              </h4>
              <pre
                className="overflow-x-auto rounded-md"
                style={{
                  background: '#0F172A',
                  padding: '12px 16px',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  color: '#E2E4E9',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {route.example_request}
              </pre>
            </div>
          )}

          {/* Example Response */}
          {route.example_response && (
            <div style={{ marginBottom: '20px' }}>
              <h4
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '12px',
                }}
              >
                Response
              </h4>
              <pre
                className="overflow-x-auto rounded-md"
                style={{
                  background: '#0F172A',
                  padding: '12px 16px',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  color: '#E2E4E9',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {route.example_response}
              </pre>
            </div>
          )}

          {/* Auth requirement */}
          <div className="flex items-center gap-1.5" style={{ color: '#94A3B8', fontSize: '13px' }}>
            <Lock size={14} />
            <span>{route.auth_required ? 'Authentication required (Admin)' : 'Public endpoint'}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Docs Page ─────────────────────────────────────────────────────────────────
export default function DocsPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | RouteCategory>('all');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return ROUTE_MANIFEST.filter((route) => {
      const matchesCategory =
        activeCategory === 'all' || route.category === activeCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        route.path.toLowerCase().includes(q) ||
        route.description.toLowerCase().includes(q) ||
        route.category.toLowerCase().includes(q) ||
        route.method.toLowerCase().includes(q)
      );
    });
  }, [search, activeCategory]);

  const categories: ('all' | RouteCategory)[] = ['all', ...ROUTE_CATEGORIES];

  return (
    <div
      className="min-h-screen"
      style={{ background: '#FAFBFC', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px' }}>
        {/* Page Header */}
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-6"
          style={{ borderBottom: '1px solid #E2E4E9' }}
        >
          <div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#0F172A',
                lineHeight: '1.2',
                letterSpacing: '-0.02em',
              }}
            >
              API Documentation
            </h1>
            <p style={{ fontSize: '14px', color: '#475569', marginTop: '8px' }}>
              Reference for all Factory Dashboard endpoints
            </p>
          </div>

          {/* Search */}
          <div className="relative" style={{ width: '100%', maxWidth: '320px' }}>
            <Search
              size={16}
              className="absolute"
              style={{
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search endpoints..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
              style={{
                height: '40px',
                paddingLeft: '40px',
                paddingRight: search ? '36px' : '12px',
                border: '1px solid #E2E4E9',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#0F172A',
                background: '#FFFFFF',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2563EB';
                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E2E4E9';
                e.target.style.boxShadow = 'none';
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute flex items-center justify-center"
                style={{
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94A3B8',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div
          className="flex gap-1 flex-wrap mb-6 p-1 rounded-lg overflow-x-auto"
          style={{ background: '#F4F5F7' }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="capitalize transition-all"
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                background: activeCategory === cat ? '#FFFFFF' : 'transparent',
                color: activeCategory === cat ? '#0F172A' : '#475569',
                boxShadow: activeCategory === cat ? '0 1px 2px rgba(15, 23, 42, 0.05)' : 'none',
                transition: 'all 150ms ease',
                whiteSpace: 'nowrap',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Route List */}
        {filtered.length === 0 ? (
          <div className="text-center" style={{ padding: '48px 24px' }}>
            <Search size={48} style={{ color: '#94A3B8', margin: '0 auto 16px' }} />
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#0F172A',
                marginBottom: '8px',
              }}
            >
              No matching endpoints
            </h3>
            <p style={{ fontSize: '14px', color: '#475569', marginBottom: '16px' }}>
              Try adjusting your search or browse all endpoints.
            </p>
            <button
              onClick={() => { setSearch(''); setActiveCategory('all'); }}
              style={{
                background: 'transparent',
                color: '#2563EB',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Clear search
            </button>
          </div>
        ) : (
          <div>
            {filtered.map((route, i) => (
              <RouteCard key={`${route.method}-${route.path}-${i}`} route={route} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
