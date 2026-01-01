/**
 * BSI Live Sports Ticker
 *
 * Real-time breaking news and score ticker via WebSocket.
 * Integrates with Three.js for hero header visual effects.
 */

export { LiveTicker, default as LiveTickerComponent } from './LiveTicker';
export { HeroTicker, useHeroTicker } from './HeroTicker';
export { TickerGlow } from './TickerGlow';
export { useTicker, type TickerItem } from './useTicker';
