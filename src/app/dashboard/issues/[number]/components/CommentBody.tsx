'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { visit } from 'unist-util-visit';
import type { Components } from 'react-markdown';
import type { CSSProperties } from 'react';
import type { Root, Text, Element } from 'hast';

// Rehype plugin: replaces REQ-XXX-NNN and AC-NNN.N tokens in text nodes,
// skipping nodes inside <code> or <pre> elements so backtick spans are unaffected.
function rehypeTokenHighlight() {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, _index, parent) => {
      const p = parent as Element | undefined;
      if (p && (p.tagName === 'code' || p.tagName === 'pre')) return;

      const REQ_RE = /REQ-([A-Z]+-\d+)/g;
      const AC_RE = /AC-(\d+\.\d+)/g;

      let text = node.value;
      if (!REQ_RE.test(text) && !AC_RE.test(text)) return;

      // Build array of hast nodes by splitting on tokens
      const COMBINED = /(REQ-[A-Z]+-\d+|AC-\d+\.\d+)/g;
      const parts = text.split(COMBINED);
      if (parts.length <= 1) return;

      const replacement = parts.map((part): Text | Element => {
        const reqMatch = part.match(/^REQ-([A-Z]+-\d+)$/);
        if (reqMatch) {
          return {
            type: 'element',
            tagName: 'span',
            properties: {
              id: `REQ-${reqMatch[1]}`,
              className: ['req-highlight'],
              style: 'background:#FEF3C7;color:#92400E;padding:1px 4px;border-radius:3px;font-weight:600;',
            },
            children: [{ type: 'text', value: part }],
          } as Element;
        }
        const acMatch = part.match(/^AC-(\d+\.\d+)$/);
        if (acMatch) {
          return {
            type: 'element',
            tagName: 'a',
            properties: {
              href: `#REQ-${acMatch[1]}`,
              className: ['ac-link'],
              style: 'color:#D97706;font-weight:600;text-decoration:underline;',
            },
            children: [{ type: 'text', value: part }],
          } as Element;
        }
        return { type: 'text', value: part } as Text;
      });

      // Replace this text node with multiple nodes via splice on parent's children
      const parentEl = parent as Element;
      const idx = parentEl.children.indexOf(node);
      parentEl.children.splice(idx, 1, ...replacement);
    });
  };
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
  return (
    <div style={{ color: '#1C1917', fontSize: 14, lineHeight: 1.7 }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeTokenHighlight, rehypeHighlight]}
        components={components}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
