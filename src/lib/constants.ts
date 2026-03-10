export const STATIONS = ['intake', 'spec', 'design', 'build', 'qa', 'bugfix', 'done'] as const;
export type Station = typeof STATIONS[number];

export const STATION_COLORS: Record<Station, string> = {
  intake: '#6B7280',
  spec: '#3B82F6',
  design: '#A855F7',
  build: '#F59E0B',
  qa: '#06B6D4',
  bugfix: '#EF4444',
  done: '#22C55E',
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
  md: '#3B82F6',
  lg: '#F59E0B',
  xl: '#EF4444',
};
