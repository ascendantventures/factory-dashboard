'use client';

import { useState, useEffect } from 'react';

interface SpecSectionHighlighterProps {
  markdown: string;
}

const TRACKED_SECTIONS = [
  { label: 'Requirements', patterns: ['## Requirements', '## REQ-'] },
  { label: 'Architecture', patterns: ['## Architecture'] },
  { label: 'Database Schema', patterns: ['## Database Schema', '## Database'] },
  { label: 'Acceptance Criteria', patterns: ['## Acceptance Criteria', '## AC-'] },
  { label: 'API Routes', patterns: ['## API Routes', '## API Endpoints'] },
  { label: 'Migration SQL', patterns: ['## Migration SQL'] },
  { label: 'Components', patterns: ['## Key React Components', '## Components'] },
];

function sectionId(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function detectSections(markdown: string) {
  return TRACKED_SECTIONS.filter(s =>
    s.patterns.some(p => markdown.includes(p))
  );
}

export function SpecSectionHighlighter({ markdown }: SpecSectionHighlighterProps) {
  const sections = detectSections(markdown);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Find which heading is currently near the top of the panel
      for (const section of sections) {
        const id = sectionId(section.label);
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top >= 0 && rect.top < 200) {
            setActiveSection(section.label);
            return;
          }
        }
      }
    };
    const panel = document.querySelector('[data-testid="spec-review-panel"]');
    panel?.addEventListener('scroll', handleScroll, { passive: true });
    return () => panel?.removeEventListener('scroll', handleScroll);
  }, [sections]);

  if (sections.length === 0) return null;

  const scrollTo = (label: string) => {
    const id = sectionId(label);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(label);
    }
  };

  return (
    <div
      data-testid="spec-section-nav"
      style={{
        position: 'sticky',
        top: 80,
        background: '#F1F5F9',
        borderRadius: 8,
        padding: '12px 16px',
        marginBottom: 24,
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        zIndex: 10,
      }}
    >
      {sections.map((section) => {
        const isActive = activeSection === section.label;
        return (
          <button
            key={section.label}
            onClick={() => scrollTo(section.label)}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 12, fontWeight: 500,
              padding: '6px 12px',
              borderRadius: 6,
              border: `1px solid ${isActive ? '#2563EB' : '#E2E8F0'}`,
              background: isActive ? '#2563EB' : '#FFFFFF',
              color: isActive ? '#FFFFFF' : '#475569',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#2563EB';
                (e.currentTarget as HTMLButtonElement).style.color = '#2563EB';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0';
                (e.currentTarget as HTMLButtonElement).style.color = '#475569';
              }
            }}
          >
            {section.label}
          </button>
        );
      })}
    </div>
  );
}
