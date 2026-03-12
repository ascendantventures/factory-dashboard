'use client';

interface SpecMetadataProps {
  markdown: string;
  issueNumber: number;
}

function extractComplexity(markdown: string): string | null {
  const match = markdown.match(/complexity[:\s]+([a-zA-Z]+)/i);
  if (!match) return null;
  const val = match[1].toLowerCase();
  if (['simple', 'low', 'xs', 'sm'].includes(val)) return 'Low';
  if (['medium', 'moderate', 'md'].includes(val)) return 'Medium';
  if (['complex', 'high', 'lg', 'xl'].includes(val)) return 'High';
  return val.charAt(0).toUpperCase() + val.slice(1);
}

function extractScope(markdown: string): string | null {
  const match = markdown.match(/(?:scope|estimate|effort)[:\s]+([^\n]+)/i);
  return match?.[1]?.trim() ?? null;
}

function ComplexityBadge({ complexity }: { complexity: string }) {
  const c = complexity.toLowerCase();
  let bg = '#F1F5F9', color = '#475569';
  if (c === 'low') { bg = '#D1FAE5'; color = '#059669'; }
  else if (c === 'medium') { bg = '#FEF3C7'; color = '#D97706'; }
  else if (c === 'high') { bg = '#FEE2E2'; color = '#DC2626'; }

  return (
    <span style={{
      background: bg, color,
      fontFamily: 'Inter, sans-serif',
      fontSize: 12, fontWeight: 600,
      padding: '4px 10px', borderRadius: 6,
    }}>
      {complexity}
    </span>
  );
}

export function SpecMetadata({ markdown, issueNumber }: SpecMetadataProps) {
  const complexity = extractComplexity(markdown);
  const scope = extractScope(markdown);

  if (!complexity && !scope) return null;

  return (
    <div
      data-testid="spec-metadata"
      style={{
        background: '#F1F5F9',
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
      }}
    >
      <div>
        <div style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 11, fontWeight: 600, color: '#94A3B8',
          textTransform: 'uppercase', letterSpacing: '0.04em',
          marginBottom: 4,
        }}>
          Issue
        </div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#0F172A' }}>
          #{issueNumber}
        </div>
      </div>

      {complexity && (
        <div>
          <div style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 11, fontWeight: 600, color: '#94A3B8',
            textTransform: 'uppercase', letterSpacing: '0.04em',
            marginBottom: 4,
          }}>
            Complexity
          </div>
          <ComplexityBadge complexity={complexity} />
        </div>
      )}

      {scope && (
        <div>
          <div style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 11, fontWeight: 600, color: '#94A3B8',
            textTransform: 'uppercase', letterSpacing: '0.04em',
            marginBottom: 4,
          }}>
            Scope
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#0F172A' }}>
            {scope.length > 40 ? scope.slice(0, 40) + '…' : scope}
          </div>
        </div>
      )}
    </div>
  );
}
