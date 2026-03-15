'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  SearchX,
  Loader2,
  GitPullRequest,
  LayoutDashboard,
} from 'lucide-react';
import type { SearchResult } from '@/app/api/search/route';

// Badge color config for station labels
function getBadgeStyle(badge: string): React.CSSProperties {
  if (badge === 'admin') return { background: 'rgba(239,68,68,0.15)', color: '#F87171' };
  switch (badge) {
    case 'station:intake':  return { background: 'rgba(107,114,128,0.2)', color: '#9CA3AF' };
    case 'station:spec':    return { background: 'rgba(59,130,246,0.2)',  color: '#60A5FA' };
    case 'station:design':  return { background: 'rgba(168,85,247,0.2)',  color: '#C084FC' };
    case 'station:build':   return { background: 'rgba(245,158,11,0.2)',  color: '#FBBF24' };
    case 'station:qa':      return { background: 'rgba(6,182,212,0.2)',   color: '#22D3EE' };
    case 'station:done':    return { background: 'rgba(34,197,94,0.2)',   color: '#4ADE80' };
    default:                return { background: 'rgba(113,113,122,0.2)', color: '#A1A1AA' };
  }
}

interface SearchResultRowProps {
  result: SearchResult;
  isSelected: boolean;
  index: number;
  onSelect: (result: SearchResult) => void;
}

function SearchResultRow({ result, isSelected, index, onSelect }: SearchResultRowProps) {
  const selectedStyle: React.CSSProperties = isSelected
    ? {
        background: 'var(--primary-muted)',
        boxShadow: 'inset 2px 0 0 var(--primary)',
      }
    : {};

  return (
    <div
      id={`search-result-${index}`}
      role="option"
      aria-selected={isSelected}
      data-testid="search-result-row"
      data-selected={isSelected ? 'true' : undefined}
      onClick={() => onSelect(result)}
      className="flex items-center gap-3 mx-2 px-2 rounded-md cursor-pointer"
      style={{
        height: '44px',
        transition: 'background 100ms ease',
        ...selectedStyle,
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLElement).style.background = 'var(--surface-alt)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLElement).style.background = 'transparent';
        }
      }}
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-md"
        style={{
          width: 32,
          height: 32,
          background: result.type === 'issue'
            ? 'rgba(99,102,241,0.1)'
            : 'rgba(113,113,122,0.1)',
        }}
      >
        {result.type === 'issue' ? (
          <GitPullRequest className="w-4 h-4" style={{ color: 'var(--primary)' }} />
        ) : (
          <LayoutDashboard className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <span
          className="text-sm font-medium truncate"
          style={{ color: 'var(--text-primary)', lineHeight: '1.4' }}
        >
          {result.title}
        </span>
        {result.subtitle && (
          <span
            className="text-xs truncate"
            style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}
          >
            {result.subtitle}
          </span>
        )}
      </div>

      {/* Badge */}
      {result.badge && (
        <span
          className="flex-shrink-0 text-xs font-semibold rounded"
          style={{
            padding: '2px 6px',
            fontSize: '10px',
            ...getBadgeStyle(result.badge),
          }}
        >
          {result.badge.replace('station:', '')}
        </span>
      )}
    </div>
  );
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const closeModal = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setSelectedIndex(0);
  }, []);

  // Global keyboard shortcut — open modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced fetch
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setSelectedIndex(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation inside the modal
  function handleModalKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      closeModal();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      router.push(results[selectedIndex].href);
      closeModal();
    }
  }

  function handleSelectResult(result: SearchResult) {
    router.push(result.href);
    closeModal();
  }

  // Split results into groups
  const issueResults = results.filter((r) => r.type === 'issue');
  const pageResults = results.filter((r) => r.type === 'page');

  // Build a flat ordered list matching what's rendered (for selectedIndex mapping)
  const orderedResults: SearchResult[] = [...issueResults, ...pageResults];

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors hover:opacity-80"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
        }}
        aria-label="Open search"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd
          className="hidden sm:inline-flex items-center px-1.5 rounded font-mono"
          style={{
            background: 'var(--surface-alt)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            fontSize: '11px',
          }}
        >
          ⌘K
        </kbd>
      </button>

      {/* Dialog */}
      {open && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={closeModal}
          />

          {/* Dialog content */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search issues and pages"
            className="fixed left-1/2 z-50 w-full -translate-x-1/2 rounded-xl border shadow-2xl"
            style={{
              top: '96px',
              maxWidth: '512px',
              background: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
            onKeyDown={handleModalKeyDown}
          >
            {/* Search input */}
            <div
              className="flex items-center gap-3 px-4 border-b"
              style={{ borderColor: 'var(--border)', height: '52px' }}
            >
              <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
              <input
                autoFocus
                type="text"
                role="combobox"
                aria-expanded={true}
                aria-controls="search-results"
                aria-activedescendant={results.length > 0 ? `search-result-${selectedIndex}` : undefined}
                aria-autocomplete="list"
                placeholder="Search issues, pages..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>

            {/* Content area */}
            <div
              id="search-results"
              role="listbox"
              aria-label="Search results"
              className="overflow-y-auto"
              style={{ maxHeight: '360px', padding: '8px 0' }}
            >
              {/* Loading state */}
              {loading && (
                <div
                  data-testid="search-loading"
                  className="flex items-center gap-3 px-4"
                  style={{ height: '44px' }}
                >
                  <Loader2
                    className="w-4 h-4 animate-spin"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Searching...
                  </span>
                </div>
              )}

              {/* Hint state — initial open */}
              {!loading && query.length < 2 && (
                <div className="flex flex-col items-center justify-center gap-3" style={{ padding: '48px 16px' }}>
                  <Search className="w-10 h-10" style={{ color: 'var(--border)' }} />
                  <p
                    className="text-center"
                    style={{ fontSize: '13px', color: 'var(--text-muted)' }}
                  >
                    Start typing to search issues and pages...
                  </p>
                </div>
              )}

              {/* Results */}
              {!loading && results.length > 0 && (
                <>
                  {/* Issues section */}
                  {issueResults.length > 0 && (
                    <div role="group" aria-label="Issues">
                      <div
                        className="px-4 uppercase tracking-wider"
                        style={{
                          paddingTop: '8px',
                          paddingBottom: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          letterSpacing: '0.05em',
                          color: 'var(--text-muted)',
                        }}
                      >
                        Issues
                      </div>
                      {issueResults.map((result) => {
                        const idx = orderedResults.indexOf(result);
                        return (
                          <SearchResultRow
                            key={result.id}
                            result={result}
                            isSelected={idx === selectedIndex}
                            index={idx}
                            onSelect={handleSelectResult}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Pages section */}
                  {pageResults.length > 0 && (
                    <div role="group" aria-label="Pages">
                      <div
                        className="px-4 uppercase tracking-wider"
                        style={{
                          paddingTop: issueResults.length > 0 ? '12px' : '8px',
                          paddingBottom: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          letterSpacing: '0.05em',
                          color: 'var(--text-muted)',
                        }}
                      >
                        Pages
                      </div>
                      {pageResults.map((result) => {
                        const idx = orderedResults.indexOf(result);
                        return (
                          <SearchResultRow
                            key={result.id}
                            result={result}
                            isSelected={idx === selectedIndex}
                            index={idx}
                            onSelect={handleSelectResult}
                          />
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Empty state — only after a real search with zero results */}
              {!loading && query.length >= 2 && results.length === 0 && (
                <div
                  className="flex flex-col items-center justify-center gap-3"
                  style={{ padding: '48px 16px' }}
                >
                  <SearchX className="w-10 h-10" style={{ color: 'var(--border)' }} />
                  <p
                    className="text-center"
                    style={{ fontSize: '13px', color: 'var(--text-muted)' }}
                  >
                    No results found
                  </p>
                  <p
                    className="text-center"
                    style={{ fontSize: '12px', color: 'var(--text-muted)', opacity: 0.7 }}
                  >
                    Try a different search term
                  </p>
                </div>
              )}
            </div>

            {/* Footer — keyboard shortcut hints */}
            <div
              className="hidden sm:flex items-center justify-center gap-4 border-t"
              style={{
                height: '40px',
                borderColor: 'var(--border)',
                background: 'var(--surface-alt)',
                opacity: 0.5,
                borderBottomLeftRadius: '12px',
                borderBottomRightRadius: '12px',
              }}
            >
              {[
                { keys: ['↑', '↓'], label: 'to navigate' },
                { keys: ['↵'], label: 'to select' },
                { keys: ['esc'], label: 'to close' },
              ].map(({ keys, label }) => (
                <div key={label} className="flex items-center gap-1">
                  {keys.map((k) => (
                    <kbd
                      key={k}
                      className="inline-flex items-center justify-center rounded font-mono"
                      style={{
                        padding: '2px 4px',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        fontSize: '10px',
                        fontWeight: 500,
                        color: 'var(--text-muted)',
                        minWidth: '18px',
                      }}
                    >
                      {k}
                    </kbd>
                  ))}
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
