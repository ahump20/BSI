'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface TickerItem {
  id: string;
  type: 'score' | 'news' | 'alert' | 'injury' | 'trade';
  sport: 'MLB' | 'NFL' | 'NBA' | 'CFB' | 'COLLEGE_BASEBALL';
  headline: string;
  subtext?: string;
  priority: number;
  timestamp: number;
  ttl: number;
  source: string;
}

interface LiveTickerProps {
  /** Worker URL for the news ticker API */
  workerUrl?: string;
  /** Animation duration in seconds (default: 30) */
  duration?: number;
  /** Whether to pause on hover (default: true) */
  pauseOnHover?: boolean;
  /** Show only specific sports */
  sports?: TickerItem['sport'][];
  /** Custom className for container */
  className?: string;
}

const SPORT_COLORS: Record<TickerItem['sport'], string> = {
  MLB: '#BF5700',
  NFL: '#013369',
  NBA: '#C9082A',
  CFB: '#8B4513',
  COLLEGE_BASEBALL: '#FF6B35',
};

const TYPE_ICONS: Record<TickerItem['type'], string> = {
  score: '⚡',
  news: '📰',
  alert: '🚨',
  injury: '🏥',
  trade: '🔄',
};

export function LiveTicker({
  workerUrl = 'https://bsi-news-ticker.humphrey-austin20.workers.dev',
  duration = 30,
  pauseOnHover = true,
  sports,
  className = '',
}: LiveTickerProps) {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // Filter items by sport if specified
  const filteredItems = sports ? items.filter((item) => sports.includes(item.sport)) : items;

  // Connect via REST fallback first, then WebSocket
  const fetchInitialData = useCallback(async () => {
    try {
      const res = await fetch(`${workerUrl}/ticker`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (e) {
      console.error('[LiveTicker] Failed to fetch initial data:', e);
    }
  }, [workerUrl]);

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const wsUrl = workerUrl.replace('https://', 'wss://').replace('http://', 'ws://');
      const ws = new WebSocket(`${wsUrl}/ws`);

      ws.onopen = () => {
        setIsConnected(true);
        console.log('[LiveTicker] WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'init' || data.type === 'refresh') {
            setItems(data.items || []);
          } else if (data.type === 'add') {
            setItems((prev) => {
              // Add new item and sort by priority/timestamp
              const newItems = [data.item, ...prev.filter((i) => i.id !== data.item.id)];
              return newItems
                .sort((a, b) => {
                  if (a.priority !== b.priority) return a.priority - b.priority;
                  return b.timestamp - a.timestamp;
                })
                .slice(0, 20);
            });
          } else if (data.type === 'remove') {
            setItems((prev) => prev.filter((i) => i.id !== data.id));
          } else if (data.type === 'clear') {
            setItems([]);
          }
        } catch (e) {
          console.error('[LiveTicker] Failed to parse message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('[LiveTicker] WebSocket disconnected, reconnecting...');
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = (e) => {
        console.error('[LiveTicker] WebSocket error:', e);
        ws.close();
      };

      wsRef.current = ws;

      // Ping every 30 seconds to keep connection alive
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);

      return () => {
        clearInterval(pingInterval);
        ws.close();
      };
    } catch (e) {
      console.error('[LiveTicker] Failed to connect WebSocket:', e);
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
    }
  }, [workerUrl]);

  useEffect(() => {
    fetchInitialData();
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [fetchInitialData, connectWebSocket]);

  if (filteredItems.length === 0) {
    return (
      <div className={`w-full bg-midnight border-y border-charcoal/50 py-2 ${className}`}>
        <div className="flex items-center justify-center gap-2 text-cream/50 text-sm">
          <span className="animate-pulse">●</span>
          <span>Loading live sports updates...</span>
        </div>
      </div>
    );
  }

  // Double the items for seamless loop
  const tickerContent = [...filteredItems, ...filteredItems];

  return (
    <div
      className={`relative w-full overflow-hidden bg-midnight border-y border-charcoal/50 ${className}`}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      {/* Live indicator */}
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center px-4 bg-gradient-to-r from-midnight via-midnight to-transparent">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}
          />
          <span className="text-burnt-orange font-bold text-sm tracking-wider">LIVE</span>
        </div>
      </div>

      {/* Ticker content */}
      <div
        className="flex py-2"
        style={{
          animation: `ticker ${duration}s linear infinite`,
          animationPlayState: isPaused ? 'paused' : 'running',
        }}
      >
        {tickerContent.map((item, index) => (
          <TickerItemDisplay key={`${item.id}-${index}`} item={item} />
        ))}
      </div>

      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-midnight to-transparent pointer-events-none" />

      {/* Ticker animation keyframes */}
      <style jsx>{`
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}

function TickerItemDisplay({ item }: { item: TickerItem }) {
  const sportColor = SPORT_COLORS[item.sport];
  const typeIcon = TYPE_ICONS[item.type];
  const isBreaking = item.priority === 1;

  return (
    <div className="flex items-center gap-3 px-6 whitespace-nowrap">
      {/* Sport badge */}
      <span
        className={`text-xs font-bold px-2 py-0.5 rounded ${isBreaking ? 'animate-pulse' : ''}`}
        style={{
          backgroundColor: sportColor,
          color: '#FFFFFF',
        }}
      >
        {item.sport === 'COLLEGE_BASEBALL' ? 'COLLEGE BB' : item.sport}
      </span>

      {/* Type icon */}
      <span className="text-sm">{typeIcon}</span>

      {/* Headline */}
      <span className={`text-cream font-medium ${isBreaking ? 'text-burnt-orange' : ''}`}>
        {item.headline}
      </span>

      {/* Subtext */}
      {item.subtext && (
        <span className="text-cream/60 text-sm hidden sm:inline">
          — {item.subtext.substring(0, 60)}...
        </span>
      )}

      {/* Separator */}
      <span className="text-charcoal mx-2">|</span>
    </div>
  );
}

export default LiveTicker;
