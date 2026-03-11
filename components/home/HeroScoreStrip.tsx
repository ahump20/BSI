'use client';

import Link from 'next/link';
import { useSportData } from '@/lib/hooks/useSportData';
import { withAlpha } from '@/lib/utils/color';

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

function statusColor(label: string): string {
  if (label === 'Live') return '#22c55e';
  if (label === 'Final') return 'var(--bsi-dust)';
  return 'var(--bsi-primary)';
}

function GameCard({ game, label, accent }: { game: HeroGame; label: string; accent: string }) {
  const abbr = (t: { name: string; abbreviation: string }) => t.abbreviation || t.name.slice(0, 3).toUpperCase();

  return (
    <Link
      href="/scores"
      className="heritage-card group block min-w-0 p-3 sm:p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="heritage-stamp"
          style={{ padding: '1px 6px', fontSize: '9px', borderColor: withAlpha(accent, 0.4), color: accent }}
        >
          {label}
        </span>
        <span className="text-[10px] uppercase tracking-wider truncate" style={{ color: 'var(--bsi-dust)' }}>
          {game.sport}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs sm:text-sm font-medium truncate" style={{ color: 'var(--bsi-bone)' }}>
            {abbr(game.away)}
          </span>
          <span className="text-xs sm:text-sm font-bold tabular-nums" style={{ color: 'var(--bsi-primary)' }}>
            {game.away.score}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs sm:text-sm font-medium truncate" style={{ color: 'var(--bsi-bone)' }}>
            {abbr(game.home)}
          </span>
          <span className="text-xs sm:text-sm font-bold tabular-nums" style={{ color: 'var(--bsi-primary)' }}>
            {game.home.score}
          </span>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        {label === 'Live' && (
          <span aria-hidden="true" className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
          </span>
        )}
        <span className="text-[10px]" style={{ color: statusColor(label) }}>
          {game.detail || game.status}
        </span>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="heritage-card p-3 sm:p-4 flex-1 min-w-0">
      <div className="h-3 skeleton w-16 mb-3" />
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <div className="h-3 skeleton w-12" />
          <div className="h-3 skeleton w-6" />
        </div>
        <div className="flex justify-between">
          <div className="h-3 skeleton w-12" />
          <div className="h-3 skeleton w-6" />
        </div>
      </div>
      <div className="h-2 skeleton w-20 mt-2" />
    </div>
  );
}

/**
 * HeroScoreStrip — compact 3-card strip proving the site has live data.
 * Fetches /api/hero-scores, auto-refreshes every 30s, returns null if no games.
 */
export function HeroScoreStrip() {
  const url = '/api/hero-scores';
  const { data, loading } = useSportData<HeroScoresData>(url, { refreshInterval: 30_000 });

  if (!loading && (!data || data.empty)) return null;

  const cards: Array<{ game: HeroGame; label: string; accent: string }> = [];
  if (data?.liveNow) cards.push({ game: data.liveNow, label: 'Live', accent: '#22c55e' });
  if (data?.nextUp) cards.push({ game: data.nextUp, label: 'Next Up', accent: '#BF5700' });
  if (data?.recentFinal) cards.push({ game: data.recentFinal, label: 'Final', accent: '#6b7280' });

  return (
    <div className="opacity-0 motion-reduce:opacity-100 motion-safe:animate-[bsi-slide-up_0.7s_ease-out_0.6s_forwards]">
      <div className="grid gap-3 md:grid-cols-3">
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
        <p className="mt-3 text-center text-[10px]" style={{ color: 'var(--bsi-dust)' }}>
          Live proof updated {new Date(data.meta.fetched_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'America/Chicago',
          })} CT · Source: {data.meta.source}
        </p>
      )}
    </div>
  );
}
