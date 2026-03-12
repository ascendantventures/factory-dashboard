'use client'

interface AppGridProps {
  children: React.ReactNode
}

export default function AppGrid({ children }: AppGridProps) {
  return (
    <div
      data-testid="app-grid"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch"
    >
      {children}
    </div>
  )
}
