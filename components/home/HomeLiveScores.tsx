'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSportData } from '@/lib/hooks/useSportData';
import { LiveBadge } from '@/components/ui/Badge';
import { SkeletonScoreCard } from '@/components/ui/Skeleton';
import { getDateOffset } from '@/lib/utils/timezone';

// Same Game interface used by the scores page
interface Game {
  id: string;
  date: string;
  time: string;
  status: 'scheduled' | 'live' | 'final' | 'postponed' | 'canceled';
  inning?: number;
  homeTeam: {
    id: string;
    name: string;
    shortName: string;
    conference: string;
    score: number | null;
    record: { wins: number; losses: number };
  };
  awayTeam: {
    id: string;
    name: string;
    shortName: string;
    conference: string;
    score: number | null;
    record: { wins: number; losses: number };
  };
  venue: string;
  tv?: string;
  situation?: string;
}

interface ScoresApiResponse {
  success?: boolean;
  data?: Game[];
  games?: Game[];
  live?: boolean;
  meta?: { dataSource: string; lastUpdated: string; timezone: string };
  message?: string;
  timestamp?: string;
}

function CompactGameCard({ game }: { game: Game }) {
  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';
  const awayWon = isFinal && (game.awayTeam.score ?? 0) > (game.homeTeam.score ?? 0);
  const homeWon = isFinal && (game.homeTeam.score ?? 0) > (game.awayTeam.score ?? 0);

  const gameHref = isLive
    ? `/college-baseball/game/${game.id}/live`
    : isFinal
      ? `/college-baseball/game/${game.id}/box-score`
      : `/college-baseball/game/${game.id}`;

  return (
    <Link
      href={gameHref}
      className="group flex-shrink-0 w-48 sm:w-56 rounded-xl border border-white/10 bg-white/[0.03] hover:border-[#BF5700]/40 hover:bg-white/[0.06] transition-all duration-300 overflow-hidden"
    >
      {/* Status bar */}
      <div
        className={`px-3 py-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider ${
          isLive
            ? 'bg-green-500/15 text-green-400'
            : isFinal
              ? 'bg-white/5 text-white/40'
              : 'bg-[#BF5700]/10 text-[#BF5700]'
        }`}
      >
        {isLive ? (
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
            {game.inning ? `INN ${game.inning}` : 'LIVE'}
          </span>
        ) : isFinal ? (
          'Final'
        ) : (
          game.time
        )}
      </div>

      {/* Teams */}
      <div className="p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium truncate ${awayWon ? 'text-white' : 'text-white/70'}`}>
            {game.awayTeam.shortName || game.awayTeam.name}
          </span>
          <span className={`text-sm font-bold font-mono tabular-nums ${
            isLive ? 'text-white' : awayWon ? 'text-white' : 'text-white/50'
          }`}>
            {game.awayTeam.score !== null ? game.awayTeam.score : '-'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium truncate ${homeWon ? 'text-white' : 'text-white/70'}`}>
            {game.homeTeam.shortName || game.homeTeam.name}
          </span>
          <span className={`text-sm font-bold font-mono tabular-nums ${
            isLive ? 'text-white' : homeWon ? 'text-white' : 'text-white/50'
          }`}>
            {game.homeTeam.score !== null ? game.homeTeam.score : '-'}
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * HomeLiveScores — compact horizontal score strip for the homepage.
 * Fetches today's college baseball games, auto-refreshes when live games exist.
 * The credibility moment: real data moving on page load.
 */
export function HomeLiveScores() {
  const [today, setToday] = useState('');
  useEffect(() => { setToday(getDateOffset(0)); }, []);

  const { data: rawData, loading, error } = useSportData<ScoresApiResponse>(
    today ? `/api/college-baseball/schedule?date=${today}` : null,
    { refreshInterval: 30000, refreshWhen: true, timeout: 10000 }
  );

  const games = useMemo(() => {
    const all = rawData?.data || rawData?.games || [];
    // Prioritize live games, then scheduled, then final — show max 5
    const live = all.filter((g) => g.status === 'live');
    const scheduled = all.filter((g) => g.status === 'scheduled');
    const final_ = all.filter((g) => g.status === 'final');
    return [...live, ...scheduled, ...final_].slice(0, 5);
  }, [rawData]);

  const hasLiveGames = games.some((g) => g.status === 'live');

  // Don't render the section at all if there are no games and no loading state
  if (!loading && !error && games.length === 0) return null;

  return (
    <section className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/60">
              Today&apos;s Games
            </h2>
            {hasLiveGames && <LiveBadge />}
          </div>
          <Link
            href="/college-baseball/scores"
            className="text-xs font-semibold text-[#BF5700] hover:text-[#FF6B35] transition-colors flex items-center gap-1"
          >
            See all scores
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Score cards — horizontal scroll on mobile */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-shrink-0 w-48 sm:w-56">
                  <SkeletonScoreCard />
                </div>
              ))}
            </>
          ) : error ? (
            <div className="text-sm text-white/40 py-4">
              Scores unavailable — check back during the season.
            </div>
          ) : (
            games.map((game) => <CompactGameCard key={game.id} game={game} />)
          )}
        </div>

        {hasLiveGames && (
          <p className="text-[10px] text-white/20 mt-2">
            Auto-refreshing every 30 seconds
          </p>
        )}
      </div>
    </section>
  );
}
