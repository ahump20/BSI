'use client';

/**
 * BSI Live Sports Ticker
 *
 * Real-time breaking news and score ticker with WebSocket connection.
 * Integrates with Three.js hero headers for visual effects.
 * Uses user's timezone preference for time display.
 *
 * Last Updated: 2025-01-07
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserSettings } from '@/lib/hooks';
import { logger } from '@/lib/utils/logger';

// Types (matching worker types)
type TickerType = 'score' | 'news' | 'injury' | 'trade' | 'weather';
type League = 'MLB' | 'NFL' | 'NCAAF' | 'NBA' | 'NCAABB';
type Priority = 1 | 2 | 3;

interface TickerItem {
  id: string;
  type: TickerType;
  league: League;
  headline: string;
  timestamp: number;
  priority: Priority;
  metadata?: {
    teamIds?: string[];
    gameId?: string;
    playerId?: string;
    link?: string;
  };
}

interface WSMessage {
  type: string;
  payload?: unknown;
  timestamp: number;
}

interface LiveTickerProps {
  /** WebSocket URL (defaults to production) */
  wsUrl?: string;
  /** Filter by leagues */
  leagues?: League[];
  /** Filter by types */
  types?: TickerType[];
  /** Minimum priority (1=breaking, 2=important, 3=all) */
  minPriority?: Priority;
  /** Max items to display */
  maxItems?: number;
  /** Auto-scroll speed in ms per item */
  scrollSpeed?: number;
  /** Custom class name */
  className?: string;
  /** Compact mode for hero headers */
  compact?: boolean;
  /** Callback when new item arrives */
  onNewItem?: (item: TickerItem) => void;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  1: 'bg-red-600', // Breaking
  2: 'bg-amber-500', // Important
  3: 'bg-charcoal', // Standard
};

// ── SVG league markers (renders consistently across devices) ──
const TickerBaseballIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.5}><circle cx="8" cy="8" r="6.5" /><path d="M4.5 3c1 1.5 1 3.5 0 5s-1 3.5 0 5" /><path d="M11.5 3c-1 1.5-1 3.5 0 5s1 3.5 0 5" /></svg>
);
const TickerFootballIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.5}><ellipse cx="8" cy="8" rx="6.5" ry="4" transform="rotate(-45 8 8)" /><path d="M5.5 5.5l5 5" /></svg>
);
const TickerBasketballIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.5}><circle cx="8" cy="8" r="6.5" /><path d="M1.5 8h13M8 1.5v13" /></svg>
);

const LEAGUE_ICON_COMPONENTS: Record<League, React.FC> = {
  MLB: TickerBaseballIcon,
  NFL: TickerFootballIcon,
  NCAAF: TickerFootballIcon,
  NBA: TickerBasketballIcon,
  NCAABB: TickerBasketballIcon,
};

const TYPE_LABELS: Record<TickerType, string> = {
  score: 'SCORE',
  news: 'NEWS',
  injury: 'INJURY',
  trade: 'TRADE',
  weather: 'WEATHER',
};

export function LiveTicker({
  wsUrl = 'wss://ticker.blazesportsintel.com/ws',
  leagues,
  types,
  minPriority = 3,
  maxItems = 10,
  scrollSpeed = 5000,
  className = '',
  compact = false,
  onNewItem,
}: LiveTickerProps) {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get user's timezone preference for formatting
  const { formatTime, isLoaded: timezoneLoaded } = useUserSettings();

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);

        // Subscribe with filters
        const subscription: WSMessage = {
          type: 'subscribe',
          payload: {
            ...(leagues && { leagues }),
            ...(types && { types }),
            minPriority,
          },
          timestamp: Date.now(),
        };
        wsRef.current?.send(JSON.stringify(subscription));

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
          }
        }, 25000);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WSMessage;

          if (message.type === 'ticker_batch') {
            setItems(message.payload as TickerItem[]);
          } else if (message.type === 'ticker_item') {
            const newItem = message.payload as TickerItem;
            setItems((prev) => [newItem, ...prev.slice(0, maxItems - 1)]);
            onNewItem?.(newItem);
          }
        } catch (e) {
          logger.warn('Failed to parse ticker message', { error: String(e) });
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }

        // Reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      wsRef.current.onerror = (error) => {
        logger.warn('Ticker WebSocket error', { error: String(error) });
      };
    } catch (error) {
      logger.warn('Failed to connect to ticker', { error: String(error) });
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, [wsUrl, leagues, types, minPriority, maxItems, onNewItem]);

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [connect]);

  // Auto-scroll through items
  useEffect(() => {
    if (items.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, scrollSpeed);

    return () => clearInterval(interval);
  }, [items.length, scrollSpeed]);

  // Render fallback for no items
  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="flex items-center gap-2 text-cream/50">
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}
          />
          <span className="text-sm">
            {isConnected ? 'Waiting for updates...' : 'Connecting...'}
          </span>
        </div>
      </div>
    );
  }

  const currentItem = items[currentIndex];

  if (compact) {
    return (
      <div className={`overflow-hidden ${className}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2"
          >
            {(() => { const LeagueIcon = LEAGUE_ICON_COMPONENTS[currentItem.league]; return <LeagueIcon />; })()}
            <span
              className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded ${PRIORITY_COLORS[currentItem.priority]} text-white`}
            >
              {TYPE_LABELS[currentItem.type]}
            </span>
            <span className="text-sm text-cream truncate">{currentItem.headline}</span>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div
      className={`bg-midnight/90 backdrop-blur-sm border border-charcoal/50 rounded-lg ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-charcoal/50">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}
          />
          <span className="text-xs font-semibold text-ember uppercase tracking-wider">
            Live Ticker
          </span>
        </div>
        <div className="flex items-center gap-1">
          {items.map((_, idx) => (
            <div
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                idx === currentIndex ? 'bg-ember' : 'bg-charcoal'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Ticker Content */}
      <div className="p-3 min-h-[60px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-1">
              {(() => { const LeagueIcon = LEAGUE_ICON_COMPONENTS[currentItem.league]; return <LeagueIcon />; })()}
              <span
                className={`px-2 py-0.5 text-xs font-bold uppercase rounded ${PRIORITY_COLORS[currentItem.priority]} text-white`}
              >
                {currentItem.priority === 1 ? '🔴 BREAKING' : TYPE_LABELS[currentItem.type]}
              </span>
              <span className="text-xs text-cream/50">{currentItem.league}</span>
            </div>
            <p className="text-cream font-medium leading-snug">{currentItem.headline}</p>
            <p className="text-xs text-cream/40 mt-1">
              {timezoneLoaded
                ? formatTime(new Date(currentItem.timestamp))
                : new Date(currentItem.timestamp).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default LiveTicker;
