'use client';

import { useState, useEffect } from 'react';
import { Search, SearchX } from 'lucide-react';

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
            onClick={() => { setOpen(false); setQuery(''); }}
          />

          {/* Dialog content */}
          <div
            className="fixed top-24 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 rounded-xl border shadow-2xl"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
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
                placeholder="Search issues, pages..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>

            {/* Empty state */}
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <SearchX className="w-10 h-10" style={{ color: 'var(--border)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                No results found
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
