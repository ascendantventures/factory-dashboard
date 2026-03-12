'use client';

import { useState, useEffect, useRef } from 'react';

interface TocItem {
  level: 2 | 3;
  text: string;
  anchor: string;
}

interface Props {
  markdown: string;
}

function parseHeadings(markdown: string): TocItem[] {
  const items: TocItem[] = [];
  const lines = markdown.split('\n');
  for (const line of lines) {
    const h2Match = line.match(/^## (.+)$/);
    const h3Match = line.match(/^### (.+)$/);
    if (h2Match) {
      const text = h2Match[1].trim();
      const anchor = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      items.push({ level: 2, text, anchor });
    } else if (h3Match) {
      const text = h3Match[1].trim();
      const anchor = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      items.push({ level: 3, text, anchor });
    }
  }
  return items;
}

export function TableOfContents({ markdown }: Props) {
  const items = parseHeadings(markdown);
  const [activeAnchor, setActiveAnchor] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (items.length === 0) return;

    const anchors = items.map((item) => item.anchor);

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveAnchor(entry.target.id);
          }
        }
      },
      { rootMargin: '0px 0px -60% 0px', threshold: 0 }
    );

    for (const anchor of anchors) {
      const el = document.getElementById(anchor);
      if (el) observerRef.current.observe(el);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [markdown]); // eslint-disable-line react-hooks/exhaustive-deps

  if (items.length === 0) return null;

  return (
    <nav
      style={{
        position: 'sticky',
        top: 16,
        width: 240,
        flexShrink: 0,
        alignSelf: 'flex-start',
      }}
      aria-label="Table of contents"
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#78716C',
          marginBottom: 8,
        }}
      >
        Contents
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item) => {
          const isActive = activeAnchor === item.anchor;
          return (
            <li key={item.anchor} style={{ marginBottom: 2 }}>
              <a
                href={`#${item.anchor}`}
                style={{
                  display: 'block',
                  fontSize: item.level === 2 ? 13 : 12,
                  paddingTop: 4,
                  paddingBottom: 4,
                  paddingLeft: item.level === 3 ? 14 : 2,
                  color: isActive ? '#D97706' : '#78716C',
                  fontWeight: isActive ? 600 : 400,
                  textDecoration: 'none',
                  borderLeft: isActive ? '2px solid #D97706' : '2px solid transparent',
                  transition: 'color 0.15s, border-color 0.15s',
                  lineHeight: 1.4,
                }}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
