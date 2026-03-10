'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface IssueBodyProps {
  body: string | null;
}

export function IssueBody({ body }: IssueBodyProps) {
  if (!body) {
    return (
      <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>
        No description provided.
      </p>
    );
  }

  return (
    <div
      className="prose prose-sm max-w-none"
      style={{
        color: 'var(--text-secondary)',
        '--tw-prose-body': 'var(--text-secondary)',
        '--tw-prose-headings': 'var(--text-primary)',
        '--tw-prose-code': 'var(--text-primary)',
        '--tw-prose-pre-bg': 'var(--surface-alt)',
      } as React.CSSProperties}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mb-3" style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold mb-2 mt-4" style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold mb-2 mt-3" style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}>
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-3 leading-relaxed text-sm" style={{ color: 'var(--text-secondary)' }}>
              {children}
            </p>
          ),
          code: ({ inline, children, ...props }: { inline?: boolean; children?: React.ReactNode }) =>
            inline ? (
              <code
                className="px-1.5 py-0.5 rounded text-xs font-mono"
                style={{ background: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                {...props}
              >
                {children}
              </code>
            ) : (
              <code className="font-mono text-xs" style={{ color: 'var(--text-primary)' }} {...props}>
                {children}
              </code>
            ),
          pre: ({ children }) => (
            <pre
              className="p-4 rounded-lg overflow-x-auto text-xs font-mono mb-3"
              style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              {children}
            </pre>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {children}
            </ol>
          ),
          blockquote: ({ children }) => (
            <blockquote
              className="border-l-4 pl-4 italic mb-3 text-sm"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition-opacity hover:opacity-80"
              style={{ color: 'var(--primary)' }}
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3">
              <table className="w-full text-sm border-collapse" style={{ border: '1px solid var(--border)' }}>
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th
              className="px-3 py-2 text-left text-xs font-semibold"
              style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              className="px-3 py-2 text-xs"
              style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              {children}
            </td>
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
