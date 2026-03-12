import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface EventDirectionBadgeProps {
  direction: 'in' | 'out';
}

export function EventDirectionBadge({ direction }: EventDirectionBadgeProps) {
  if (direction === 'in') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium whitespace-nowrap"
        style={{ background: '#E0F2FE', color: '#0284C7' }}
      >
        <ArrowDownLeft size={12} />
        IN
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium whitespace-nowrap"
      style={{ background: '#F3E8FF', color: '#7C3AED' }}
    >
      <ArrowUpRight size={12} />
      OUT
    </span>
  );
}
