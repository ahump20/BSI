'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface HeroGame {
  sport: string;
  away: { name: string; abbreviation: string; score: number };
  home: { name: string; abbreviation: string; score: number };
  status: string;
  detail?: string;
  startTime?: string;
}

interface HeroScoresData {
  liveNow: HeroGame | null;
  nextUp: HeroGame | null;
  recentFinal: HeroGame | null;
  empty: boolean;
  meta?: { source: string; fetched_at: string; timezone: string };
}

function GameCard({ game, label, accent }: { game: HeroGame; label: string; accent: string }) {
  const abbr = (t: { name: string; abbreviation: string }) => t.abbreviation || t.name.slice(0, 3).toUpperCase();

  return (
    <Link
      href="/scores"
      className="glass-default rounded-xl p-3 sm:p-4 border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 flex-1 min-w-0 group"
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded tracking-wider"
          style={{ backgroundColor: `${accent}20`, color: accent }}
        >
          {label}
        </span>
        <span className="text-[10px] text-white/30 uppercase tracking-wider truncate">
          {game.sport}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs sm:text-sm text-white/80 font-medium truncate">
            {abbr(game.away)}
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#BF5700] tabular-nums">
            {game.away.score}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs sm:text-sm text-white/80 font-medium truncate">
            {abbr(game.home)}
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#BF5700] tabular-nums">
            {game.home.score}
          </span>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        {label === 'Live' && (
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
          </span>
        )}
        <span className={`text-[10px] ${
          label === 'Live' ? 'text-green-400'
            : label === 'Final' ? 'text-white/30'
            : 'text-[#BF5700]'
        }`}>
          {game.detail || game.status}
        </span>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-default rounded-xl p-3 sm:p-4 border border-white/[0.06] flex-1 min-w-0 animate-pulse">
      <div className="h-3 bg-white/5 rounded w-16 mb-3" />
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <div className="h-3 bg-white/5 rounded w-12" />
          <div className="h-3 bg-white/5 rounded w-6" />
        </div>
        <div className="flex justify-between">
          <div className="h-3 bg-white/5 rounded w-12" />
          <div className="h-3 bg-white/5 rounded w-6" />
        </div>
      </div>
      <div className="h-2 bg-white/5 rounded w-20 mt-2" />
    </div>
  );
}

/**
 * HeroScoreStrip — compact 3-card strip proving the site has live data.
 * Fetches /api/hero-scores, auto-refreshes every 30s, returns null if no games.
 */
export function HeroScoreStrip() {
  const [data, setData] = useState<HeroScoresData | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchHeroScores() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/hero-scores`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json() as HeroScoresData;
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    fetchHeroScores();
    intervalRef.current = setInterval(fetchHeroScores, 30_000);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Don't render if no games available
  if (!loading && (!data || data.empty)) return null;

  const cards: Array<{ game: HeroGame; label: string; accent: string }> = [];
  if (data?.liveNow) cards.push({ game: data.liveNow, label: 'Live', accent: '#22c55e' });
  if (data?.nextUp) cards.push({ game: data.nextUp, label: 'Next Up', accent: '#BF5700' });
  if (data?.recentFinal) cards.push({ game: data.recentFinal, label: 'Final', accent: '#6b7280' });

  return (
    <div className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.7s_ease-out_0.6s_forwards] mt-8">
      <div className="flex gap-3 sm:gap-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          cards.map((c) => (
            <GameCard key={c.label} game={c.game} label={c.label} accent={c.accent} />
          ))
        )}
      </div>

      {data?.meta && (
        <p className="text-[10px] text-white/20 text-center mt-3">
          Updated {new Date(data.meta.fetched_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'America/Chicago',
          })} CT · {data.meta.source}
        </p>
      )}
    </div>
  );
}
