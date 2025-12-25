/**
 * BSI Design Tokens - Central Export
 */

export * from './colors';
export * from './typography';
export * from './spacing';
export * from './motion';

// Convenience re-exports
import { colors, colorsGLSL, glslColorSnippet } from './colors';
import { typography, textStyles } from './typography';
import {
  spacing,
  breakpoints,
  containers,
  radii,
  shadows,
  zIndex,
  blur,
  aspectRatios,
} from './spacing';
import {
  duration,
  durationCSS,
  easing,
  easingFn,
  spring,
  transition,
  stagger,
  gsapEasing,
  theatreKeyframes,
} from './motion';

export const tokens = {
  colors,
  colorsGLSL,
  glslColorSnippet,
  typography,
  textStyles,
  spacing,
  breakpoints,
  containers,
  radii,
  shadows,
  zIndex,
  blur,
  aspectRatios,
  // Motion tokens
  duration,
  durationCSS,
  easing,
  easingFn,
  spring,
  transition,
  stagger,
  gsapEasing,
  theatreKeyframes,
} as const;

export default tokens;
