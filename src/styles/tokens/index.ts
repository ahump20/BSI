/**
 * BSI Design System - Design Tokens
 *
 * Comprehensive design token export for the Blaze Sports Intel
 * brand identity and 3D graphics engine.
 *
 * @author Austin Humphrey
 * @version 2.0.0
 */

export { colors, threeColors, gradients } from './colors';
export type { ColorToken, ThreeColorToken, GradientToken } from './colors';

export { typography, textStyles } from './typography';
export type { TypographyToken, TextStyleToken } from './typography';

export { spacing, componentSpacing, zIndex, borderRadius, shadows } from './spacing';
export type {
  SpacingToken,
  ComponentSpacingToken,
  ZIndexToken,
  BorderRadiusToken,
  ShadowToken,
} from './spacing';

export { animation, keyframes, transitions } from './animation';
export type { AnimationToken, KeyframeToken, TransitionToken } from './animation';

// Breakpoints for responsive design
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1200px',
  '2xl': '1400px',
} as const;

// Media query helpers
export const media = {
  xs: `(min-width: ${breakpoints.xs})`,
  sm: `(min-width: ${breakpoints.sm})`,
  md: `(min-width: ${breakpoints.md})`,
  lg: `(min-width: ${breakpoints.lg})`,
  xl: `(min-width: ${breakpoints.xl})`,
  '2xl': `(min-width: ${breakpoints['2xl']})`,

  // Special queries
  reducedMotion: '(prefers-reduced-motion: reduce)',
  dark: '(prefers-color-scheme: dark)',
  light: '(prefers-color-scheme: light)',
  highContrast: '(prefers-contrast: more)',
  touch: '(hover: none) and (pointer: coarse)',
  mouse: '(hover: hover) and (pointer: fine)',
} as const;

export type Breakpoint = keyof typeof breakpoints;
export type MediaQuery = keyof typeof media;
