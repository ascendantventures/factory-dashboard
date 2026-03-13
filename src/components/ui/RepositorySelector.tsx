'use client';

import { useState, useEffect, useId } from 'react';
import { ChevronDown, AlertCircle, Loader2, FolderOpen } from 'lucide-react';

interface BuildRepo {
  github_repo: string;
  display_name: string;
  live_url: string | null;
  issue_number: number;
}

interface RepositorySelectorProps {
  value: string;
  onChange: (repo: string) => void;
  error?: string;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  helperText?: string;
  'data-testid'?: string;
}

export function RepositorySelector({
  value,
  onChange,
  error,
  disabled,
  label,
  required,
  helperText,
  'data-testid': dataTestId = 'repo-selector',
}: RepositorySelectorProps) {
  const [repos, setRepos] = useState<BuildRepo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const inputId = useId();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setFetchError(null);
      try {
        const res = await fetch('/api/build-repos');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (!cancelled) setRepos(data.repos ?? []);
      } catch {
        if (!cancelled) setFetchError('Could not load repositories.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectStyle: React.CSSProperties = {
    width: '100%',
    height: '44px',
    background: '#1C1C1C',
    border: `1px solid ${error ? '#EF4444' : '#3F3F46'}`,
    borderRadius: '6px',
    padding: '0 36px 0 12px',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    color: value ? '#FAFAFA' : '#71717A',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    outline: 'none',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
    opacity: disabled || isLoading ? 0.5 : 1,
    boxShadow: error ? '0 0 0 3px rgba(239,68,68,0.2)' : 'none',
  };

  const errorStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: 500,
    color: '#EF4444',
    marginTop: '6px',
    fontFamily: 'Inter, sans-serif',
  };

  if (isLoading) {
    return (
      <div>
        {label && (
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#FAFAFA',
              marginBottom: '8px',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {label}
            {required && <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>}
          </label>
        )}
        <div
          style={{
            height: '44px',
            background: 'linear-gradient(90deg, #1C1C1C 0%, #262626 50%, #1C1C1C 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: '6px',
            border: '1px solid #262626',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '12px',
            gap: '8px',
          }}
        >
          <Loader2 size={16} style={{ color: '#71717A', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '14px', color: '#71717A', fontFamily: 'Inter, sans-serif' }}>
            Loading repositories...
          </span>
        </div>
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

  if (!isLoading && repos.length === 0 && !fetchError) {
    return (
      <div>
        {label && (
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#FAFAFA',
              marginBottom: '8px',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {label}
            {required && <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>}
          </label>
        )}
        <div
          style={{
            background: '#1C1C1C',
            border: '1px solid #262626',
            borderRadius: '6px',
            padding: '20px 12px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FolderOpen size={24} style={{ color: '#71717A' }} />
          <p style={{ fontSize: '13px', color: '#71717A', margin: 0, fontFamily: 'Inter, sans-serif' }}>
            No repositories available
          </p>
          <a
            href="/dashboard/settings"
            style={{ fontSize: '12px', color: '#10B981', fontFamily: 'Inter, sans-serif' }}
          >
            Create an issue on a new app first
          </a>
        </div>
        {error && (
          <p style={errorStyle} role="alert" data-testid="repo-selector-error">
            <AlertCircle size={14} /> {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 500,
            color: '#FAFAFA',
            marginBottom: '8px',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {label}
          {required && <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <select
          id={inputId}
          data-testid={dataTestId}
          value={value}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          style={selectStyle}
          onFocus={(e) => {
            if (!error) {
              e.currentTarget.style.borderColor = '#6366F1';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)';
            }
          }}
          onBlur={(e) => {
            if (!error) {
              e.currentTarget.style.borderColor = '#3F3F46';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
          onChange={(e) => onChange(e.currentTarget.value)}
        >
          <option value="" style={{ background: '#1C1C1C', color: '#71717A' }}>
            Select a repository...
          </option>
          {repos.map((repo) => (
            <option
              key={repo.github_repo}
              value={repo.github_repo}
              style={{ background: '#1C1C1C', color: '#FAFAFA' }}
            >
              {repo.display_name} ({repo.github_repo})
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
      </div>
      {helperText && !error && (
        <p style={{ fontSize: '12px', color: '#71717A', marginTop: '6px', fontFamily: 'Inter, sans-serif' }}>
          {helperText}
        </p>
      )}
      {fetchError && !error && (
        <p style={errorStyle} role="alert">
          <AlertCircle size={14} /> {fetchError}
        </p>
      )}
      {error && (
        <p
          id={`${inputId}-error`}
          style={errorStyle}
          role="alert"
          data-testid="repo-selector-error"
        >
          <AlertCircle size={14} /> {error}
        </p>
      )}
    </div>
  );
}
