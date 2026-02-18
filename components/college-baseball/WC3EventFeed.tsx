'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// WC3 Design Tokens
const WC3 = {
  gold: '#D4AF37',
  goldLight: '#E8D5A3',
  goldDark: '#A08629',
  stone: '#2D2926',
  stoneDark: '#1A1714',
  obsidian: '#0D0D0D',
  fontDisplay: "'Cinzel', 'Cormorant Garamond', serif",
  fontMono: "'JetBrains Mono', monospace",
} as const;

interface BlazeCraftEvent {
  id?: string;
  type?: string;
  message: string;
  timestamp: string;
  source?: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
}

const MAX_EVENTS = 8;

/**
 * WC3EventFeed — subscribes to BlazeCraft's SSE endpoint for real-time event streaming.
 *
 * Displays a WC3-styled event log with:
 * - Gold timestamps on a stone background
 * - Collapsible/expandable interface
 * - Max 8 events shown at a time
 * - Graceful fallback to "Powered by BlazeCraft" when offline
 *
 * Uses inline styles with WC3 design tokens for the Warcraft 3 aesthetic.
 */
export function WC3EventFeed() {
  const [events, setEvents] = useState<BlazeCraftEvent[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    // Clean up any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      const es = new EventSource(
        'https://blazecraft-events.blazesportsintel.workers.dev/hub/events/stream'
      );
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
        setConnectionAttempts(0);
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as BlazeCraftEvent;
          setEvents((prev) => {
            const next = [data, ...prev];
            return next.slice(0, MAX_EVENTS);
          });
        } catch {
          // If data isn't JSON, treat the raw text as a message
          if (event.data && event.data !== ':keepalive') {
            setEvents((prev) => {
              const next: BlazeCraftEvent[] = [
                { message: event.data, timestamp: new Date().toISOString() },
                ...prev,
              ];
              return next.slice(0, MAX_EVENTS);
            });
          }
        }
      };

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;
        setIsConnected(false);

        // Exponential backoff: 2s, 4s, 8s, 16s, max 30s
        const delay = Math.min(2000 * Math.pow(2, connectionAttempts), 30_000);
        setConnectionAttempts((prev) => prev + 1);

        reconnectTimeoutRef.current = setTimeout(connect, delay);
      };
    } catch {
      setIsConnected(false);
    }
  }, [connectionAttempts]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const formatTime = (iso: string): string => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      return '--:--:--';
    }
  };

  const severityColor = (severity?: string): string => {
    switch (severity) {
      case 'error':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      case 'success':
        return '#22C55E';
      default:
        return WC3.goldLight;
    }
  };

  // Offline / disconnected fallback
  if (!isConnected && events.length === 0) {
    return (
      <a
        href="https://blazecraft.app"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          background: `linear-gradient(135deg, ${WC3.stone} 0%, ${WC3.obsidian} 100%)`,
          border: `1px solid ${WC3.goldDark}`,
          borderRadius: '6px',
          textDecoration: 'none',
          fontFamily: WC3.fontDisplay,
          fontSize: '12px',
          color: WC3.goldDark,
          letterSpacing: '0.5px',
          transition: 'border-color 0.2s',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={WC3.goldDark} strokeWidth="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        Powered by BlazeCraft
      </a>
    );
  }

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${WC3.stone} 0%, ${WC3.obsidian} 100%)`,
        border: `1px solid ${WC3.gold}`,
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: `0 0 12px rgba(212, 175, 55, 0.1)`,
        maxWidth: '480px',
        width: '100%',
      }}
    >
      {/* Header — always visible, acts as expand/collapse toggle */}
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '10px 14px',
          background: `linear-gradient(90deg, rgba(212, 175, 55, 0.1) 0%, transparent 100%)`,
          border: 'none',
          borderBottom: isExpanded ? `1px solid rgba(212, 175, 55, 0.2)` : 'none',
          cursor: 'pointer',
          fontFamily: WC3.fontDisplay,
          color: WC3.gold,
        }}
        aria-expanded={isExpanded}
        aria-label="Toggle BlazeCraft event feed"
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={WC3.gold} strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          BlazeCraft Events
          {/* Connection indicator */}
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isConnected ? '#22C55E' : '#888',
              boxShadow: isConnected ? '0 0 4px #22C55E' : 'none',
            }}
          />
        </span>

        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {events.length > 0 && (
            <span
              style={{
                fontSize: '10px',
                color: WC3.goldDark,
                fontFamily: WC3.fontMono,
              }}
            >
              {events.length} event{events.length !== 1 ? 's' : ''}
            </span>
          )}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke={WC3.goldDark}
            strokeWidth="2"
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      {/* Event list — collapsible */}
      {isExpanded && (
        <div
          style={{
            maxHeight: '320px',
            overflowY: 'auto',
            padding: '4px 0',
          }}
        >
          {events.length === 0 ? (
            <div
              style={{
                padding: '20px 14px',
                textAlign: 'center',
                fontFamily: WC3.fontMono,
                fontSize: '11px',
                color: WC3.goldDark,
              }}
            >
              Listening for events...
            </div>
          ) : (
            events.map((event, idx) => (
              <div
                key={event.id || `${event.timestamp}-${idx}`}
                style={{
                  display: 'flex',
                  gap: '10px',
                  padding: '8px 14px',
                  borderBottom:
                    idx < events.length - 1
                      ? `1px solid rgba(212, 175, 55, 0.08)`
                      : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background =
                    'rgba(212, 175, 55, 0.05)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                }}
              >
                {/* Timestamp */}
                <span
                  style={{
                    flexShrink: 0,
                    fontFamily: WC3.fontMono,
                    fontSize: '10px',
                    color: WC3.gold,
                    lineHeight: '18px',
                    minWidth: '64px',
                  }}
                >
                  {formatTime(event.timestamp)}
                </span>

                {/* Event content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Source / type label */}
                  {(event.source || event.type) && (
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '9px',
                        fontFamily: WC3.fontMono,
                        color: WC3.goldDark,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '2px',
                      }}
                    >
                      {event.source || event.type}
                    </span>
                  )}
                  <p
                    style={{
                      margin: 0,
                      fontSize: '12px',
                      fontFamily: WC3.fontMono,
                      color: severityColor(event.severity),
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                    }}
                  >
                    {event.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Footer link */}
      {isExpanded && (
        <div
          style={{
            padding: '8px 14px',
            borderTop: `1px solid rgba(212, 175, 55, 0.15)`,
            textAlign: 'right',
          }}
        >
          <a
            href="https://blazecraft.app"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '10px',
              fontFamily: WC3.fontDisplay,
              color: WC3.goldDark,
              textDecoration: 'none',
              letterSpacing: '0.5px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = WC3.gold;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = WC3.goldDark;
            }}
          >
            blazecraft.app &rarr;
          </a>
        </div>
      )}
    </div>
  );
}

export default WC3EventFeed;
