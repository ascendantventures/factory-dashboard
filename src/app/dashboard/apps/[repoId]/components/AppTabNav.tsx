'use client';

export type AppTab = 'overview' | 'issues' | 'timeline';

interface AppTabNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const TABS: { id: AppTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'issues', label: 'Issues' },
  { id: 'timeline', label: 'Timeline' },
];

export default function AppTabNav({ activeTab, onTabChange }: AppTabNavProps) {
  return (
    <div
      style={{
        display: 'flex',
        borderBottom: '1px solid #3D3937',
        marginBottom: '24px',
        gap: 0,
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: 'var(--font-ui, "Plus Jakarta Sans", system-ui, sans-serif)',
              color: isActive ? '#D4A012' : '#7A7672',
              background: 'transparent',
              border: 'none',
              borderBottom: isActive ? '2px solid #D4A012' : '2px solid transparent',
              marginBottom: '-1px',
              cursor: 'pointer',
              transition: 'color 150ms ease',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.color = '#B8B4AF';
                (e.currentTarget as HTMLButtonElement).style.background = '#252321';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.color = '#7A7672';
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
