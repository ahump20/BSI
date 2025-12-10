/**
 * BSI Design System - Token Exports
 *
 * Central export for all design tokens
 * Import from '@/styles/tokens' or './tokens'
 */

export { colors } from './colors';
export type {
  Colors,
  BrandColor,
  BackgroundColor,
  SemanticColor,
  NeutralColor,
  SportsColor,
} from './colors';

export { typography } from './typography';
export type { Typography, FontFamily, FontSize, FontWeight } from './typography';

export { spacing } from './spacing';
export type { Spacing, SpacingKey } from './spacing';

export { breakpoints, mediaQueries } from './breakpoints';
export type { Breakpoints, BreakpointKey } from './breakpoints';

// Combined tokens object for convenience
export const tokens = {
  colors: require('./colors').colors,
  typography: require('./typography').typography,
  spacing: require('./spacing').spacing,
  breakpoints: require('./breakpoints').breakpoints,
} as const;

export default tokens;
