/**
 * BSI Typography System
 * 
 * Primary: Inter - Clean, readable body text
 * Display: Oswald - Bold, commanding headlines
 * Accent: Playfair Display - Elegant quotes (covenant moments)
 */

export const typography = {
  // Font Families
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    display: ['Oswald', 'Impact', 'sans-serif'],
    serif: ['Playfair Display', 'Georgia', 'serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
  },

  // Font Sizes (rem-based for accessibility)
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],           // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],      // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],         // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],      // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],       // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],        // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],   // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],     // 36px
    '5xl': ['3rem', { lineHeight: '1.15' }],          // 48px
    '6xl': ['3.75rem', { lineHeight: '1.1' }],        // 60px
    '7xl': ['4.5rem', { lineHeight: '1.05' }],        // 72px
    '8xl': ['6rem', { lineHeight: '1' }],             // 96px
  },

  // Font Weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
    // Special: Oswald headlines often need tracking
    display: '0.02em',
    kicker: '0.15em',
  },

  // Line Heights
  lineHeight: {
    none: '1',
    tight: '1.15',
    snug: '1.25',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
} as const;

// Semantic Typography Classes
export const textStyles = {
  // Headlines - Oswald
  h1: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
    fontWeight: '700',
    letterSpacing: '0.02em',
    lineHeight: '1.1',
    textTransform: 'uppercase' as const,
  },
  h2: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: '600',
    letterSpacing: '0.02em',
    lineHeight: '1.15',
    textTransform: 'uppercase' as const,
  },
  h3: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(1.5rem, 3vw, 2rem)',
    fontWeight: '600',
    letterSpacing: '0.02em',
    lineHeight: '1.2',
  },
  h4: {
    fontFamily: 'var(--font-sans)',
    fontSize: '1.25rem',
    fontWeight: '600',
    lineHeight: '1.3',
  },

  // Body - Inter
  body: {
    fontFamily: 'var(--font-sans)',
    fontSize: '1rem',
    fontWeight: '400',
    lineHeight: '1.6',
  },
  bodyLarge: {
    fontFamily: 'var(--font-sans)',
    fontSize: '1.125rem',
    fontWeight: '400',
    lineHeight: '1.7',
  },
  bodySmall: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.875rem',
    fontWeight: '400',
    lineHeight: '1.5',
  },

  // Utility
  kicker: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.75rem',
    fontWeight: '600',
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.75rem',
    fontWeight: '400',
    lineHeight: '1.4',
  },
  stat: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2rem, 5vw, 4rem)',
    fontWeight: '700',
    letterSpacing: '-0.02em',
    lineHeight: '1',
  },

  // Quote - Playfair Display (covenant moments)
  quote: {
    fontFamily: 'var(--font-serif)',
    fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
    fontWeight: '400',
    fontStyle: 'italic' as const,
    lineHeight: '1.6',
  },
} as const;

export type FontFamily = keyof typeof typography.fontFamily;
export type TextStyle = keyof typeof textStyles;
