'use client';

import { useState, useEffect, useRef } from 'react';

interface FreshnessBadgeProps {
  /** ISO timestamp of when data was last fetched */
  fetchedAt?: string;
  /** Whether the game/section is currently live */
  isLive?: boolean;
  className?: string;
}

type FreshnessLevel = 'fresh' | 'degraded' | 'stale';

function getAgeMinutes(fetchedAt: string): number {
  const fetched = new Date(fetchedAt);
  if (isNaN(fetched.getTime())) return 999;
  return Math.floor((Date.now() - fetched.getTime()) / 60_000);
}

function getFreshnessLevel(ageMinutes: number): FreshnessLevel {
  if (ageMinutes < 2) return 'fresh';
  if (ageMinutes < 5) return 'degraded';
  return 'stale';
}

function getCompactAge(ageMinutes: number): string {
  if (ageMinutes < 1) return '';
  if (ageMinutes < 60) return `${ageMinutes}m ago`;
  const hours = Math.floor(ageMinutes / 60);
  return `${hours}h ago`;
}

const levelStyles: Record<FreshnessLevel, { dot: string; text: string; label: string; pulse: boolean }> = {
  fresh: {
    dot: 'bg-green-400',
    text: 'text-green-400',
    label: 'LIVE',
    pulse: true,
  },
  degraded: {
    dot: 'bg-yellow-400',
    text: 'text-yellow-400',
    label: 'LIVE',
    pulse: true,
  },
  stale: {
    dot: 'bg-orange-400',
    text: 'text-orange-400',
    label: 'STALE',
    pulse: false,
  },
};

/**
 * Honest freshness badge — replaces static LiveBadge.
 *
 * - isLive && data < 2min → green pulse + "LIVE"
 * - isLive && data 2-5min → yellow pulse + "LIVE · 3m ago"
 * - isLive && data > 5min → orange dot + "STALE · 7m ago"
 * - !isLive → renders nothing
 *
 * Ticks every 10s to update relative time.
 */
export function FreshnessBadge({ fetchedAt, isLive = false, className = '' }: FreshnessBadgeProps) {
  const fallbackTime = useRef(new Date().toISOString());
  const effectiveFetchedAt = fetchedAt || fallbackTime.current;

  // SSR-safe: start with 'fresh' and compute real value in useEffect
  const [level, setLevel] = useState<FreshnessLevel>('fresh');
  const [compactAge, setCompactAge] = useState('');

  useEffect(() => {
    const update = () => {
      const mins = getAgeMinutes(effectiveFetchedAt);
      setLevel(getFreshnessLevel(mins));
      setCompactAge(getCompactAge(mins));
    };

    update();
    const interval = setInterval(update, 10_000);
    return () => clearInterval(interval);
  }, [effectiveFetchedAt]);

  // Only render for live content
  if (!isLive) return null;

  const style = levelStyles[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
        level === 'fresh'
          ? 'bg-success/20 border-success/30'
          : level === 'degraded'
            ? 'bg-warning/20 border-warning/30'
            : 'bg-orange-400/20 border-orange-400/30'
      } ${className}`}
    >
      <span
        className={`w-2 h-2 rounded-full ${style.dot} ${style.pulse ? 'animate-pulse' : ''}`}
      />
      <span className={style.text}>
        {style.label}
        {compactAge && ` · ${compactAge}`}
      </span>
    </span>
  );
}
