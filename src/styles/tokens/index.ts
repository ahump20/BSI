/**
 * BSI Design Tokens - Central Export
 */

export * from './colors';
export * from './typography';
export * from './spacing';

// Convenience re-exports
import { colors } from './colors';
import { typography, textStyles } from './typography';
import {
  spacing,
  breakpoints,
  containers,
  radii,
  shadows,
  zIndex,
  durations,
  easings,
  blur,
  aspectRatios,
} from './spacing';

export const tokens = {
  colors,
  typography,
  textStyles,
  spacing,
  breakpoints,
  containers,
  radii,
  shadows,
  zIndex,
  durations,
  easings,
  blur,
  aspectRatios,
} as const;

export default tokens;
