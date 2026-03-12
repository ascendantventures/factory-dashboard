'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import type { Components } from 'react-markdown';
import type { ReactNode, CSSProperties } from 'react';

export function processMarkdownText(text: string): string {
  // Replace REQ-XXX-NNN tokens
  let processed = text.replace(
    /REQ-([A-Z]+-\d+)/g,
    '<span id="REQ-$1" class="req-highlight" style="background:#FEF3C7;color:#92400E;padding:1px 4px;border-radius:3px;font-weight:600;">REQ-$1</span>'
  );
  // Replace AC-NNN.N tokens and link to parent REQ anchor
  processed = processed.replace(
    /AC-(\d+\.\d+)/g,
    '<a href="#REQ-$1" class="ac-link" style="color:#D97706;font-weight:600;text-decoration:underline;">AC-$1</a>'
  );
  return processed;
}

const baseTextStyle: CSSProperties = {
  color: '#1C1917',
  fontFamily: 'inherit',
  lineHeight: 1.7,
};

const components: Components = {
  a: ({ href, children, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: '#D97706', textDecoration: 'underline' }}
      {...props}
    >
      {children}
    </a>
  ),
  p: ({ children, ...props }) => (
    <p
      style={{ ...baseTextStyle, marginBottom: 12 }}
      {...props}
    >
      {children}
    </p>
  ),
  h1: ({ children, ...props }) => (
    <h1
      style={{
        ...baseTextStyle,
        fontSize: 22,
        fontWeight: 700,
        marginTop: 24,
        marginBottom: 12,
        borderBottom: '1px solid #E7E5E4',
        paddingBottom: 8,
      }}
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      style={{
        ...baseTextStyle,
        fontSize: 18,
        fontWeight: 700,
        marginTop: 20,
        marginBottom: 10,
        borderBottom: '1px solid #E7E5E4',
        paddingBottom: 6,
      }}
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      style={{
        ...baseTextStyle,
        fontSize: 15,
        fontWeight: 600,
        marginTop: 16,
        marginBottom: 8,
      }}
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4
      style={{
        ...baseTextStyle,
        fontSize: 14,
        fontWeight: 600,
        marginTop: 12,
        marginBottom: 6,
      }}
      {...props}
    >
      {children}
    </h4>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = className?.startsWith('language-');
    if (isBlock) {
      return (
        <code
          className={className}
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: 13,
            color: '#D4D4D4',
          }}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        style={{
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: 12,
          background: '#F5F5F4',
          color: '#1C1917',
          padding: '1px 5px',
          borderRadius: 3,
          border: '1px solid #E7E5E4',
        }}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => (
    <pre
      style={{
        background: '#1E1E1E',
        color: '#D4D4D4',
        borderRadius: 8,
        padding: '16px',
        overflowX: 'auto',
        marginBottom: 16,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 13,
        lineHeight: 1.6,
      }}
      {...props}
    >
      {children}
    </pre>
  ),
  table: ({ children, ...props }) => (
    <div style={{ overflowX: 'auto', marginBottom: 16 }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 14,
          color: '#1C1917',
        }}
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead
      style={{ background: '#F5F5F4', borderBottom: '2px solid #D6D3D1' }}
      {...props}
    >
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody {...props}>{children}</tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr
      style={{ borderBottom: '1px solid #E7E5E4' }}
      {...props}
    >
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th
      style={{
        padding: '8px 12px',
        textAlign: 'left',
        fontWeight: 600,
        color: '#44403C',
        fontSize: 13,
      }}
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      style={{
        padding: '8px 12px',
        color: '#1C1917',
        fontSize: 14,
      }}
      {...props}
    >
      {children}
    </td>
  ),
  ul: ({ children, ...props }) => (
    <ul
      style={{ paddingLeft: 20, marginBottom: 12, color: '#1C1917' }}
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol
      style={{ paddingLeft: 20, marginBottom: 12, color: '#1C1917' }}
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li
      style={{ marginBottom: 4, lineHeight: 1.6, color: '#1C1917' }}
      {...props}
    >
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      style={{
        borderLeft: '3px solid #D97706',
        paddingLeft: 12,
        marginLeft: 0,
        color: '#78716C',
        fontStyle: 'italic',
        marginBottom: 12,
      }}
      {...props}
    >
      {children}
    </blockquote>
  ),
  hr: ({ ...props }) => (
    <hr
      style={{ border: 'none', borderTop: '1px solid #E7E5E4', margin: '16px 0' }}
      {...props}
    />
  ),
};

interface Props {
  body: string;
}

export function CommentBody({ body }: Props) {
  const processed = processMarkdownText(body);

  return (
    <div style={{ color: '#1C1917', fontSize: 14, lineHeight: 1.7 }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={components}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}
