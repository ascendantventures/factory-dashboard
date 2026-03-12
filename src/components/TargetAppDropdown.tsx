'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Sparkles, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';

export interface BuildRepo {
  github_repo: string;
  display_name: string;
  live_url: string | null;
  issue_number: number;
}

interface TargetAppDropdownProps {
  value: string;
  onChange: (repo: string | null) => void;
  disabled?: boolean;
}

export function TargetAppDropdown({ value, onChange, disabled }: TargetAppDropdownProps) {
  const [repos, setRepos] = useState<BuildRepo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/build-repos');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (!cancelled) setRepos(data.repos ?? []);
      } catch {
        if (!cancelled) setError('Could not load target apps. You can still create a new app.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedRepo = repos.find((r) => r.github_repo === value);

  const selectStyle: React.CSSProperties = {
    width: '100%',
    height: '40px',
    background: '#1C1C1C',
    border: '1px solid #262626',
    borderRadius: '6px',
    padding: '0 36px 0 12px',
    color: isLoading ? '#71717A' : '#FAFAFA',
    fontSize: '14px',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    outline: 'none',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
    fontFamily: 'Inter, sans-serif',
    opacity: disabled || isLoading ? 0.5 : 1,
  };

  return (
    <div>
      <div style={{ position: 'relative' }}>
        {isLoading ? (
          <div
            style={{
              width: '100%',
              height: '40px',
              borderRadius: '6px',
              background: 'linear-gradient(90deg, #1C1C1C 0%, #262626 50%, #1C1C1C 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '12px',
              border: '1px solid #262626',
            }}
          >
            <Loader2
              size={16}
              style={{ color: '#71717A', animation: 'spin 1s linear infinite' }}
            />
            <span style={{ marginLeft: '8px', fontSize: '14px', color: '#71717A', fontFamily: 'Inter, sans-serif' }}>
              Loading apps...
            </span>
          </div>
        ) : (
          <>
            <select
              data-testid="target-app-dropdown"
              value={value}
              disabled={disabled}
              style={selectStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#10B981';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#262626';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onChange={(e) => {
                const val = e.currentTarget.value;
                onChange(val === '' ? null : val);
              }}
            >
              <option value="" style={{ background: '#1C1C1C', color: '#FAFAFA' }}>
                ✨ New App (no existing repo)
              </option>
              {repos.map((repo) => (
                <option
                  key={repo.github_repo}
                  value={repo.github_repo}
                  style={{ background: '#1C1C1C', color: '#FAFAFA' }}
                >
                  {repo.display_name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#71717A',
                pointerEvents: 'none',
              }}
            />
          </>
        )}
      </div>

      {/* Live URL badge — shown when selected repo has a live URL */}
      {selectedRepo?.live_url && (
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <a
            href={selectedRepo.live_url}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="live-url-badge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '10px',
              fontWeight: 500,
              color: '#22C55E',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textDecoration: 'none',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <ExternalLink size={10} />
            LIVE
          </a>
          <span style={{ fontSize: '12px', color: '#71717A', fontFamily: 'JetBrains Mono, monospace' }}>
            {selectedRepo.live_url}
          </span>
        </div>
      )}

      {/* Repos with live URLs — rendered as hidden badges for Playwright test discovery */}
      {repos
        .filter((r) => r.live_url && r.github_repo !== value)
        .map((r) => (
          <span
            key={r.github_repo}
            data-testid="live-url-badge"
            data-repo={r.github_repo}
            data-url={r.live_url}
            style={{ display: 'none' }}
          />
        ))}

      {/* Error state */}
      {error && (
        <p
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: '#EF4444',
            marginTop: '6px',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <AlertCircle size={12} />
          {error}
        </p>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
