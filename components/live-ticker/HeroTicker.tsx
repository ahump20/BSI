'use client';

/**
 * BSI Hero Ticker
 *
 * Full-featured ticker for hero sections with Three.js visual effects.
 * Combines LiveTicker component with TickerGlow for breaking news emphasis.
 */

import { useState, useCallback } from 'react';
import { LiveTicker } from './LiveTicker';
import { useTicker, type TickerItem } from './useTicker';
import { ThreeCanvas } from '../three';
import { TickerGlow } from './TickerGlow';

type League = 'MLB' | 'NFL' | 'NCAAF' | 'NBA' | 'NCAABB';
type TickerType = 'score' | 'news' | 'injury' | 'trade' | 'weather';
type Priority = 1 | 2 | 3;

interface HeroTickerProps {
  /** WebSocket URL */
  wsUrl?: string;
  /** Filter by leagues */
  leagues?: League[];
  /** Filter by types */
  types?: TickerType[];
  /** Minimum priority level */
  minPriority?: Priority;
  /** Enable Three.js glow effects */
  enableGlow?: boolean;
  /** Position: top or bottom of hero */
  position?: 'top' | 'bottom';
  /** Custom class name */
  className?: string;
}

export function HeroTicker({
  wsUrl = 'wss://ticker.blazesportsintel.com/ws',
  leagues,
  types,
  minPriority = 3,
  enableGlow = true,
  position = 'bottom',
  className = '',
}: HeroTickerProps) {
  const [hasBreakingNews, setHasBreakingNews] = useState(false);

  // Handle new items - check for breaking news
  const handleNewItem = useCallback((item: TickerItem) => {
    if (item.priority === 1) {
      setHasBreakingNews(true);
      // Clear breaking state after 10 seconds
      setTimeout(() => setHasBreakingNews(false), 10000);
    }
  }, []);

  const positionClasses = position === 'top' ? 'top-0' : 'bottom-0';

  return (
    <div className={`absolute left-0 right-0 ${positionClasses} z-20 ${className}`}>
      {/* Three.js Glow Layer */}
      {enableGlow && (
        <div className="absolute inset-0 pointer-events-none">
          <ThreeCanvas
            className="w-full h-full"
            fallback={
              hasBreakingNews ? (
                <div className="absolute inset-0 bg-gradient-to-t from-red-600/20 to-transparent animate-pulse" />
              ) : null
            }
          >
            <TickerGlow isBreaking={hasBreakingNews} position={[0, 0, 0]} intensity={0.8} />
          </ThreeCanvas>
        </div>
      )}

      {/* CSS Fallback Glow (always present for low-end devices) */}
      {hasBreakingNews && !enableGlow && (
        <div className="absolute inset-0 bg-gradient-to-t from-red-600/30 to-transparent animate-pulse pointer-events-none" />
      )}

      {/* Ticker Component */}
      <div className="relative px-4 py-2 bg-midnight/80 backdrop-blur-sm border-t border-charcoal/30">
        <LiveTicker
          wsUrl={wsUrl}
          leagues={leagues}
          types={types}
          minPriority={minPriority}
          compact
          onNewItem={handleNewItem}
          className="max-w-7xl mx-auto"
        />
      </div>
    </div>
  );
}

/**
 * Standalone hook-based version for custom implementations
 */
export function useHeroTicker(options?: {
  wsUrl?: string;
  leagues?: League[];
  types?: TickerType[];
  minPriority?: Priority;
}) {
  const ticker = useTicker({
    url: options?.wsUrl,
    leagues: options?.leagues,
    types: options?.types,
    minPriority: options?.minPriority ?? 3,
    maxItems: 10,
  });

  return {
    ...ticker,
    // Convenience computed values for hero sections
    displayItem: ticker.latestItem,
    showBreakingAlert: ticker.hasBreakingNews,
    breakingItem: ticker.items.find((item) => item.priority === 1) ?? null,
  };
}

export default HeroTicker;
