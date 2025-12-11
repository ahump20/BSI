/**
 * BSI Graphics Engine - React Integration
 *
 * React components and hooks for integrating BSI 3D graphics
 * into React applications.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

// Components
export { BlazeCanvas } from './BlazeCanvas';
export type { BlazeCanvasProps, BlazeCanvasAPI, PerformanceTier as CanvasPerformanceTier } from './BlazeCanvas';

export { BlazeBackground } from './BlazeBackground';
export type { BlazeBackgroundProps, BlazeBackgroundPreset } from './BlazeBackground';

// Hooks
export { useBlaze3D, BLAZE_THREE_COLORS } from './useBlaze3D';
export type { UseBlaze3DConfig, UseBlaze3DReturn, PerformanceTier } from './useBlaze3D';
