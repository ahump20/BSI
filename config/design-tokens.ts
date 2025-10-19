export const colors = {
  background: '#0b1120',
  surface: '#111827',
  surfaceMuted: '#1f2937',
  border: 'rgba(148, 163, 184, 0.2)',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  accent: '#fbbf24',
  accentStrong: '#dc2626'
} as const;

export const spacing = {
  pageX: '1rem',
  pageY: '3.5rem',
  shellGap: '3rem',
  sectionGap: '1.5rem',
  heroGap: '1.5rem',
  cardGap: '1.25rem',
  cardPadding: '1.35rem',
  listGap: '0.45rem',
  inlineGap: '0.4rem',
  kickerSpacing: '0.75rem'
} as const;

export const radii = {
  card: '18px',
  pill: '999px'
} as const;

export const typography = {
  fonts: {
    heading: ['Source Serif Pro', 'Times New Roman', 'serif'] as const,
    body: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'] as const
  },
  letterSpacing: {
    kicker: '0.08em'
  }
} as const;

export const sizing = {
  maxWidth: '1120px'
} as const;

export const gradients = {
  shell: 'radial-gradient(circle at top, rgba(220, 38, 38, 0.18), transparent 45%), radial-gradient(circle at 80% 20%, rgba(251, 191, 36, 0.18), transparent 40%)',
  page: 'radial-gradient(circle at 10% 10%, rgba(15, 118, 110, 0.2), transparent 40%)'
} as const;

export const designTokens = {
  colors,
  spacing,
  radii,
  typography,
  sizing,
  gradients
};

export type DesignTokens = typeof designTokens;
