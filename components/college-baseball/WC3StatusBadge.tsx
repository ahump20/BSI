'use client';

import { useState, useEffect, useCallback } from 'react';

interface HubWidgetData {
  status?: 'online' | 'degraded' | 'offline';
  agents?: number;
  dataFreshness?: string;
  cacheHitRate?: number;
  lastUpdated?: string;
  uptime?: string;
}

/**
 * WC3StatusBadge — small inline component with Warcraft 3-styled gold shield/dot.
 *
 * Fetches hub status from the BlazeCraft events worker and displays:
 * - Pulsing green dot indicating operational status
 * - "BlazeCraft" label text
 * - Tooltip with data freshness, agent count, and cache info
 * - Links to blazecraft.app on click
 *
 * Styled with WC3 gold/stone aesthetic (Cinzel font, gold borders).
 */
export function WC3StatusBadge() {
  const [hubData, setHubData] = useState<HubWidgetData | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(
        'https://blazecraft-events.blazesportsintel.workers.dev/hub/widget-data',
        { signal: AbortSignal.timeout(5000) }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as HubWidgetData;
      setHubData(data);
      setIsOnline(data.status !== 'offline');
    } catch {
      setIsOnline(false);
      setHubData(null);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const statusColor = !isOnline
    ? '#888'
    : hubData?.status === 'degraded'
      ? '#FFD700'
      : '#22C55E';

  const tooltipContent = hubData
    ? [
        hubData.dataFreshness && `Data: ${hubData.dataFreshness}`,
        hubData.agents != null && `Agents: ${hubData.agents}`,
        hubData.cacheHitRate != null && `Cache: ${hubData.cacheHitRate}%`,
        hubData.uptime && `Uptime: ${hubData.uptime}`,
        hubData.lastUpdated && `Updated: ${new Date(hubData.lastUpdated).toLocaleTimeString()}`,
      ]
        .filter(Boolean)
        .join('\n')
    : 'BlazeCraft Hub — Status unavailable';

  return (
    <a
      href="https://blazecraft.app"
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 14px',
        background: 'linear-gradient(135deg, #2D2926 0%, #1A1714 100%)',
        border: '1px solid #D4AF37',
        borderRadius: '6px',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: '0 0 8px rgba(212, 175, 55, 0.15)',
        fontFamily: "'Cinzel', 'Cormorant Garamond', serif",
      }}
      aria-label={`BlazeCraft Hub Status: ${isOnline ? 'Online' : 'Offline'}`}
    >
      {/* Gold shield icon */}
      <span
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '18px',
          height: '20px',
        }}
      >
        <svg
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          style={{ position: 'absolute' }}
        >
          <path
            d="M9 1L1 5v6c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V5L9 1z"
            fill="#D4AF37"
            fillOpacity="0.2"
            stroke="#D4AF37"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        {/* Status dot centered in shield */}
        <span
          style={{
            position: 'relative',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: statusColor,
            boxShadow: isOnline ? `0 0 6px ${statusColor}` : 'none',
            animation: isOnline ? 'wc3-pulse 2s ease-in-out infinite' : 'none',
            zIndex: 1,
          }}
        />
      </span>

      {/* Label */}
      <span
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: '#D4AF37',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          lineHeight: 1,
        }}
      >
        BlazeCraft
      </span>

      {/* Tooltip */}
      {showTooltip && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #2D2926 0%, #0D0D0D 100%)',
            border: '1px solid #D4AF37',
            borderRadius: '6px',
            padding: '10px 14px',
            whiteSpace: 'pre-line',
            fontSize: '11px',
            color: '#E8D5A3',
            fontFamily: "'JetBrains Mono', monospace",
            lineHeight: 1.6,
            minWidth: '180px',
            zIndex: 50,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6), 0 0 12px rgba(212, 175, 55, 0.15)',
            pointerEvents: 'none',
          }}
        >
          {tooltipContent}
          {/* Tooltip arrow */}
          <span
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #D4AF37',
            }}
          />
        </span>
      )}

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes wc3-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </a>
  );
}

export default WC3StatusBadge;
