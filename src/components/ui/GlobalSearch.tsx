'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, SearchX, FileText, Package } from 'lucide-react';

interface SearchResult {
  type: 'issue' | 'app';
  id: string;
  title: string;
  subtitle: string;
  href: string;
  rank: number;
}

const resultIcons = {
  issue: FileText,
  app: Package,
};

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4" style={{ height: '52px', padding: '12px 16px' }}>
      <div
        className="animate-pulse flex-shrink-0 rounded"
        style={{ width: '16px', height: '16px', background: 'var(--surface-alt)' }}
      />
      <div className="flex flex-col gap-1 flex-1">
        <div
          className="animate-pulse rounded"
          style={{ height: '14px', width: '200px', background: 'var(--surface-alt)' }}
        />
        <div
          className="animate-pulse rounded"
          style={{ height: '12px', width: '140px', background: 'var(--surface-alt)' }}
        />
      </div>
    </div>
  );
}

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeModal = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        closeModal();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeModal]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=8`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results ?? []);
          setHasSearched(true);
          setSelectedIndex(0);
        }
      } catch {
        setResults([]);
        setHasSearched(true);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleResultClick(href: string) {
    router.push(href);
    closeModal();
  }

  function handleKeyNavigation(e: React.KeyboardEvent) {
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleResultClick(results[selectedIndex].href);
      }
    }
  }

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
          className="hidden sm:inline-flex items-center px-1.5 rounded text-xs font-mono"
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
            className="fixed left-1/2 z-50 w-full max-w-lg -translate-x-1/2 rounded-xl border overflow-hidden"
            style={{
              top: '96px',
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
            }}
          >
            {/* Search input */}
            <div
              className="flex items-center gap-3 px-4 border-b"
              style={{ borderColor: 'var(--border)', height: '52px' }}
            >
              <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
              <input
                ref={inputRef}
                autoFocus
                type="text"
                placeholder="Search issues, pages..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyNavigation}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>

            {/* Results area */}
            {loading && (
              <div>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            )}

            {!loading && !hasSearched && query.length < 2 && (
              <div className="py-4 text-center">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Type to search issues and apps
                </p>
              </div>
            )}

            {!loading && hasSearched && results.length > 0 && (
              <div role="listbox" aria-live="polite">
                {results.map((r, i) => {
                  const Icon = resultIcons[r.type];
                  const isSelected = i === selectedIndex;
                  return (
                    <button
                      key={r.id}
                      data-testid="search-result"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleResultClick(r.href)}
                      className="w-full flex items-center gap-3 text-left transition-colors"
                      style={{
                        padding: '12px 16px',
                        minHeight: '52px',
                        background: isSelected ? 'var(--primary-muted)' : 'transparent',
                        borderLeft: isSelected ? '2px solid var(--primary)' : '2px solid transparent',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={() => setSelectedIndex(i)}
                    >
                      <Icon
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: 'var(--text-muted)' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm truncate"
                          style={{ color: 'var(--text-primary)', fontWeight: 500 }}
                        >
                          {r.title}
                        </p>
                        <p
                          className="text-xs truncate"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {r.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {!loading && hasSearched && results.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3" style={{ padding: '48px 0' }}>
                <SearchX className="w-10 h-10" style={{ color: 'var(--border)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  No results found
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
