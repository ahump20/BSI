/**
 * BSI Cinematic Components - Central Export
 *
 * Premium visual effects and interaction layer
 */

export { NoiseOverlay } from './NoiseOverlay';
export type { NoiseOverlayProps } from './NoiseOverlay';

// Alternative SVG-based noise (no external PNG required)
export { NoiseOverlay as NoiseOverlaySVG } from './NoiseOverlaySVG';

export { CustomCursor } from './CustomCursor';
export type { CustomCursorProps } from './CustomCursor';

export { IntelTicker } from './IntelTicker';
export type { IntelTickerProps, TickerItem } from './IntelTicker';

// ScrollReveal now uses Framer Motion - re-exported from motion system
export { ScrollReveal, ScrollRevealGroup } from '../motion/ScrollReveal';
export type { ScrollRevealProps, ScrollRevealGroupProps } from '../motion/ScrollReveal';

export { ParallaxImage } from './ParallaxImage';
export type { ParallaxImageProps } from './ParallaxImage';

export { StatCounter, StatGroup } from './StatCounter';
export type { StatCounterProps, StatGroupProps } from './StatCounter';

export { CovenantQuote, TexasCovenantQuote } from './CovenantQuote';
export type { CovenantQuoteProps } from './CovenantQuote';
