'use client'

interface AppTechStackProps {
  stack: string[]
}

export default function AppTechStack({ stack }: AppTechStackProps) {
  if (!stack || stack.length === 0) return null

  const visible = stack.slice(0, 4)

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
      {visible.map((tech) => (
        <span
          key={tech}
          style={{
            fontSize: '12px',
            paddingLeft: '8px',
            paddingRight: '8px',
            paddingTop: '2px',
            paddingBottom: '2px',
            borderRadius: '6px',
            backgroundColor: 'var(--surface-alt)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          {tech}
        </span>
      ))}
    </div>
  )
}
