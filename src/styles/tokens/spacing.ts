/**
 * BSI Design System - Spacing Tokens
 *
 * Mathematical spacing scale based on golden ratio principles
 * for natural visual rhythm.
 *
 * @author Austin Humphrey
 * @version 2.0.0
 */

export const spacing = {
  // Base spacing scale (rem-based)
  0: '0',
  px: '1px',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px - base
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  11: '2.75rem', // 44px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  28: '7rem', // 112px
  32: '8rem', // 128px
  36: '9rem', // 144px
  40: '10rem', // 160px
  44: '11rem', // 176px
  48: '12rem', // 192px
  52: '13rem', // 208px
  56: '14rem', // 224px
  60: '15rem', // 240px
  64: '16rem', // 256px
  72: '18rem', // 288px
  80: '20rem', // 320px
  96: '24rem', // 384px
} as const;

// Component-specific spacing
export const componentSpacing = {
  // Card padding
  card: {
    sm: spacing[4],
    md: spacing[6],
    lg: spacing[8],
  },

  // Section padding
  section: {
    mobile: spacing[16],
    tablet: spacing[20],
    desktop: spacing[24],
  },

  // Container max widths
  container: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1200px',
    '2xl': '1400px',
  },

  // Container padding
  containerPadding: {
    mobile: spacing[4],
    tablet: spacing[6],
    desktop: spacing[8],
  },

  // Gap scales
  gap: {
    xs: spacing[2],
    sm: spacing[3],
    md: spacing[4],
    lg: spacing[6],
    xl: spacing[8],
    '2xl': spacing[12],
  },
} as const;

// Z-index scale
export const zIndex = {
  behind: -1,
  base: 0,
  raised: 10,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  popover: 500,
  toast: 600,
  tooltip: 700,
  max: 1000,
} as const;

// Border radius
export const borderRadius = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  '3xl': '24px',
  full: '9999px',
} as const;

// Shadows (with brand color glow options)
export const shadows = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
  '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',

  // Brand glow shadows
  glowSm: '0 0 10px rgba(191, 87, 0, 0.2)',
  glowMd: '0 0 20px rgba(191, 87, 0, 0.25)',
  glowLg: '0 0 40px rgba(191, 87, 0, 0.3)',
  glowXl: '0 0 60px rgba(191, 87, 0, 0.4)',

  // Card shadows
  card: '0 10px 30px rgba(0, 0, 0, 0.3)',
  cardHover: '0 20px 50px rgba(0, 0, 0, 0.4)',
  cardGlow: '0 0 40px rgba(191, 87, 0, 0.15)',

  // 3D depth shadows
  depth: '0 30px 80px rgba(0, 0, 0, 0.4)',
  depthGlow: '0 30px 80px rgba(0, 0, 0, 0.4), 0 0 40px rgba(191, 87, 0, 0.1)',
} as const;

export type SpacingToken = typeof spacing;
export type ComponentSpacingToken = typeof componentSpacing;
export type ZIndexToken = typeof zIndex;
export type BorderRadiusToken = typeof borderRadius;
export type ShadowToken = typeof shadows;
