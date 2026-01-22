/**
 * BSI Design System - Typography Tokens
 *
 * Premium editorial typography that commands attention.
 * Playfair Display for headlines, Source Serif for body,
 * IBM Plex for UI and data.
 *
 * @author Austin Humphrey
 * @version 2.0.0
 */

export const typography = {
  // Font Families
  fontFamily: {
    display: "'Playfair Display', Georgia, serif",
    body: "'Source Serif 4', Georgia, serif",
    ui: "'IBM Plex Sans', 'Helvetica Neue', sans-serif",
    mono: "'IBM Plex Mono', 'Courier New', monospace",
  },

  // Font Sizes (rem-based for accessibility)
  fontSize: {
    '2xs': '0.625rem', // 10px - tiny labels
    xs: '0.75rem', // 12px - small labels, badges
    sm: '0.875rem', // 14px - secondary text, nav
    base: '1rem', // 16px - body text
    md: '1.0625rem', // 17px - enhanced body
    lg: '1.125rem', // 18px - lead paragraphs
    xl: '1.25rem', // 20px - section intros
    '2xl': '1.5rem', // 24px - h4
    '3xl': '1.75rem', // 28px - h3
    '4xl': '2rem', // 32px - h2 mobile
    '5xl': '2.5rem', // 40px - h2 tablet
    '6xl': '3rem', // 48px - h1 mobile
    '7xl': '4rem', // 64px - h1 desktop
    '8xl': '5rem', // 80px - hero display
  },

  // Fluid font sizes using clamp()
  fluidSize: {
    heroTitle: 'clamp(2.5rem, 7vw, 4rem)',
    sectionTitle: 'clamp(1.75rem, 4vw, 2.5rem)',
    cardTitle: 'clamp(1.125rem, 2vw, 1.25rem)',
    leadText: 'clamp(1.0625rem, 2.5vw, 1.25rem)',
  },

  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Line Heights
  lineHeight: {
    none: '1',
    tight: '1.1',
    snug: '1.25',
    normal: '1.5',
    relaxed: '1.6',
    loose: '1.7',
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.02em',
    tight: '-0.01em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
    label: '0.15em',
    badge: '0.2em',
  },

  // Text Transform
  textTransform: {
    uppercase: 'uppercase',
    lowercase: 'lowercase',
    capitalize: 'capitalize',
    normal: 'none',
  },
} as const;

// Predefined text styles for common use cases
export const textStyles = {
  // Headlines
  heroTitle: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fluidSize.heroTitle,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },

  sectionTitle: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fluidSize.sectionTitle,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.tight,
  },

  cardTitle: {
    fontFamily: typography.fontFamily.ui,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.snug,
  },

  // Body Text
  bodyLarge: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fluidSize.leadText,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.relaxed,
  },

  body: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.relaxed,
  },

  // UI Elements
  label: {
    fontFamily: typography.fontFamily.ui,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.badge,
    textTransform: typography.textTransform.uppercase,
  },

  navLink: {
    fontFamily: typography.fontFamily.ui,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
  },

  button: {
    fontFamily: typography.fontFamily.ui,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.normal,
  },

  // Data/Stats
  statValue: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.none,
  },

  statLabel: {
    fontFamily: typography.fontFamily.ui,
    fontSize: typography.fontSize['2xs'],
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.widest,
    textTransform: typography.textTransform.uppercase,
  },

  // Code/Mono
  code: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.relaxed,
  },
} as const;

export type TypographyToken = typeof typography;
export type TextStyleToken = typeof textStyles;
