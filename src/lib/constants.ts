export const STATIONS = ['intake', 'spec', 'design', 'build', 'qa', 'bugfix', 'done'] as const;
export type Station = typeof STATIONS[number];

export const STATION_COLORS: Record<Station, string> = {
  intake: '#F59E0B',
  spec: '#8B5CF6',
  design: '#EC4899',
  build: '#3B82F6',
  qa: '#14B8A6',
  bugfix: '#EF4444',
  done: '#22C55E',
};

export const STATION_BG_COLORS: Record<Station, string> = {
  intake: '#92400E',
  spec: '#5B21B6',
  design: '#9D174D',
  build: '#1E40AF',
  qa: '#115E59',
  bugfix: '#991B1B',
  done: '#166534',
};

export const STATION_LABELS: Record<Station, string> = {
  intake: 'Intake',
  spec: 'Spec',
  design: 'Design',
  build: 'Build',
  qa: 'QA',
  bugfix: 'Bugfix',
  done: 'Done',
};

export const COMPLEXITY_LABELS: Record<string, string> = {
  xs: 'XS',
  sm: 'SM',
  md: 'MD',
  lg: 'LG',
  xl: 'XL',
};

export const COMPLEXITY_COLORS: Record<string, string> = {
  xs: '#22C55E',
  sm: '#06B6D4',
  md: '#F59E0B',
  lg: '#EF4444',
  xl: '#EF4444',
};
