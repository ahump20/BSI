export const colors = {
  background: '#0b1120',
  surface: '#111827',
  surfaceMuted: '#1f2937',
  border: 'rgba(148, 163, 184, 0.28)',
  borderStrong: 'rgba(148, 163, 184, 0.45)',
  textPrimary: '#e2e8f0',
  textMuted: '#94a3b8',
  accent: '#fbbf24',
  accentStrong: '#dc2626',
  accentAlt: '#f59e0b'
} as const;

export const spacing = {
  gutterXs: '0.5rem',
  gutterSm: '0.75rem',
  gutterMd: '1rem',
  gutterLg: '1.5rem',
  gutterXl: '2rem',
  gutter2xl: '3rem'
} as const;

export const radii = {
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1.125rem',
  xl: '1.5rem',
  pill: '9999px'
} as const;

export type DesignColorToken = keyof typeof colors;
export type DesignSpacingToken = keyof typeof spacing;
export type DesignRadiusToken = keyof typeof radii;
