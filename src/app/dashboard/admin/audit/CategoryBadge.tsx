import { Users, Workflow, FileText, Settings, Shield, LucideProps } from 'lucide-react';

type Category = 'user_management' | 'pipeline' | 'issues' | 'settings' | 'auth';

const CATEGORY_CONFIG: Record<Category, {
  bg: string;
  color: string;
  Icon: React.FC<LucideProps>;
  label: string;
}> = {
  user_management: {
    bg: '#1E2A3D',
    color: '#60A5FA',
    Icon: Users,
    label: 'user mgmt',
  },
  pipeline: {
    bg: '#2D2640',
    color: '#A78BFA',
    Icon: Workflow,
    label: 'pipeline',
  },
  issues: {
    bg: '#3D3526',
    color: '#D4A534',
    Icon: FileText,
    label: 'issues',
  },
  settings: {
    bg: '#1A3D30',
    color: '#34D399',
    Icon: Settings,
    label: 'settings',
  },
  auth: {
    bg: '#3D2020',
    color: '#F87171',
    Icon: Shield,
    label: 'auth',
  },
};

interface CategoryBadgeProps {
  category: string;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category as Category];
  if (!config) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 500,
          background: '#1E2328',
          color: '#A8B2BF',
        }}
        data-testid="category-badge"
      >
        {category}
      </span>
    );
  }
  const { bg, color, Icon, label } = config;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 500,
        background: bg,
        color,
        whiteSpace: 'nowrap',
      }}
      data-testid="category-badge"
    >
      <Icon className="w-3.5 h-3.5" style={{ width: '14px', height: '14px', flexShrink: 0 }} />
      {label}
    </span>
  );
}
