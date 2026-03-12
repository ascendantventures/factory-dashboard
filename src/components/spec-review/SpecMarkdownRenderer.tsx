'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import type { ReactNode } from 'react';

interface SpecMarkdownRendererProps {
  markdown: string;
}

const components: Components = {
  h1: ({ children }) => (
    <h1
      id={headingId(children)}
      style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 24, fontWeight: 700, color: '#0F172A',
        lineHeight: 1.2, marginTop: 32, marginBottom: 16,
        letterSpacing: '-0.02em',
      }}
    >
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2
      id={headingId(children)}
      style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 20, fontWeight: 600, color: '#0F172A',
        lineHeight: 1.25, marginTop: 28, marginBottom: 12,
        paddingBottom: 8, borderBottom: '1px solid #E2E8F0',
        letterSpacing: '-0.01em',
      }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      id={headingId(children)}
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 16, fontWeight: 600, color: '#0F172A',
        lineHeight: 1.4, marginTop: 24, marginBottom: 8,
      }}
    >
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4
      id={headingId(children)}
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 14, fontWeight: 600, color: '#0F172A',
        lineHeight: 1.4, marginTop: 20, marginBottom: 6,
      }}
    >
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, lineHeight: 1.7, color: '#0F172A', marginBottom: 16 }}>
      {children}
    </p>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB', textDecoration: 'underline' }}>
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = className?.startsWith('language-');
    if (isBlock) {
      return (
        <code
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13, lineHeight: 1.6,
            color: '#E2E8F0',
          }}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          background: '#F1F5F9',
          padding: '2px 6px',
          borderRadius: 4,
          color: '#0F172A',
        }}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 13, lineHeight: 1.6,
        background: '#0F172A',
        color: '#E2E8F0',
        padding: 16,
        borderRadius: 8,
        overflowX: 'auto',
        margin: '16px 0',
      }}
    >
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div style={{ overflowX: 'auto', margin: '16px 0' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 12, fontWeight: 600, color: '#475569',
        textTransform: 'uppercase', letterSpacing: '0.04em',
        padding: 12, textAlign: 'left',
        background: '#F1F5F9',
        borderBottom: '2px solid #E2E8F0',
      }}
    >
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 14, lineHeight: 1.5, color: '#0F172A',
        padding: 12,
      }}
    >
      {children}
    </td>
  ),
  blockquote: ({ children }) => (
    <blockquote
      style={{
        borderLeft: '3px solid #2563EB',
        background: '#FAFBFC',
        padding: '12px 16px',
        margin: '16px 0',
        fontStyle: 'italic',
        color: '#475569',
        borderRadius: '0 4px 4px 0',
      }}
    >
      {children}
    </blockquote>
  ),
  ul: ({ children }) => (
    <ul style={{ paddingLeft: 24, margin: '12px 0', listStyleType: 'disc', color: '#2563EB' }}>
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol style={{ paddingLeft: 24, margin: '12px 0', color: '#475569' }}>
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, lineHeight: 1.7, color: '#0F172A', margin: '8px 0' }}>
      {children}
    </li>
  ),
  hr: () => (
    <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '24px 0' }} />
  ),
};

function headingId(children: ReactNode): string {
  const text = typeof children === 'string'
    ? children
    : Array.isArray(children)
      ? children.filter(c => typeof c === 'string').join('')
      : '';
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function SpecMarkdownRenderer({ markdown }: SpecMarkdownRendererProps) {
  return (
    <div data-testid="spec-markdown-renderer">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
