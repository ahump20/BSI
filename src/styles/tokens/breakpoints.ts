/**
 * BSI Design System - Breakpoint Tokens
 *
 * Mobile-first responsive breakpoints
 * Use min-width media queries
 */

export const breakpoints = {
  xs: '320px',      // Small phones
  sm: '640px',      // Large phones
  md: '768px',      // Tablets
  lg: '1024px',     // Laptops
  xl: '1280px',     // Desktops
  '2xl': '1536px',  // Large desktops
} as const;

// Media query helpers
export const mediaQueries = {
  xs: `@media (min-width: ${breakpoints.xs})`,
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
} as const;

export type Breakpoints = typeof breakpoints;
export type BreakpointKey = keyof typeof breakpoints;
