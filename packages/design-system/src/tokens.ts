export const colorTokens = {
  background: '#0b1120',
  surface: '#111827',
  surfaceElevated: '#1f2937',
  surfaceMuted: '#1b2533',
  border: '#1f2937',
  accent: '#fbbf24',
  accentSecondary: '#dc2626',
  accentMuted: '#fde68a',
  foreground: '#e2e8f0',
  foregroundMuted: '#94a3b8',
  highlight: '#38bdf8',
  success: '#34d399',
  warning: '#f59e0b',
  danger: '#f87171'
} as const;

export const spacingScale = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem',
  '2xl': '2rem',
  '3xl': '3rem',
  '4xl': '4rem'
} as const;

export const radiusScale = {
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem',
  pill: '9999px'
} as const;

export const fontFamilies = {
  sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
  serif: ['var(--font-serif)', '"Source Serif Pro"', 'serif']
} as const;

export type ColorTokenKey = keyof typeof colorTokens;
export type SpacingTokenKey = keyof typeof spacingScale;
export type RadiusTokenKey = keyof typeof radiusScale;
