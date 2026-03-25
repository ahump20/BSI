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
}

interface HeroScoresData {
  liveNow: HeroGame | null;
  nextUp: HeroGame | null;
  recentFinal: HeroGame | null;
  empty: boolean;
  meta?: { source: string; fetched_at: string; timezone: string };
}

function statusColor(label: string): string {
  if (label === 'Live') return 'var(--bsi-success)';
  if (label === 'Final') return 'var(--bsi-dust)';
  return 'var(--bsi-primary)';
}

function GameLine({ game, label, accent }: { game: HeroGame; label: string; accent: string }) {
  const abbr = (team: { name: string; abbreviation: string }) =>
    team.abbreviation || team.name.slice(0, 3).toUpperCase();

  return (
    <Link
      href="/scores"
      className="group min-w-0 rounded-sm border border-transparent px-4 py-3 transition-all duration-300 hover:border-[rgba(191,87,0,0.25)] hover:bg-[rgba(255,255,255,0.02)]"
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className="heritage-stamp"
          style={{ padding: '1px 6px', fontSize: '9px', borderColor: withAlpha(accent, 0.35), color: accent }}
        >
          {label}
        </span>
        <span className="truncate text-[10px] uppercase tracking-wider" style={{ color: 'var(--bsi-dust)' }}>
          {game.sport}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <span
            className="truncate text-sm font-semibold uppercase tracking-[0.12em]"
            style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-bone)' }}
          >
            {abbr(game.away)}
          </span>
          <span className="led-stat text-xl font-bold tabular-nums">{game.away.score}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span
            className="truncate text-sm font-semibold uppercase tracking-[0.12em]"
            style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-bone)' }}
          >
            {abbr(game.home)}
          </span>
          <span className="led-stat text-xl font-bold tabular-nums">{game.home.score}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        {label === 'Live' && (
          <span aria-hidden="true" className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--bsi-primary)] opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--bsi-primary)]" />
          </span>
        )}
        <span className="text-[10px]" style={{ color: statusColor(label) }}>
          {game.detail || game.status}
        </span>
      </div>
    </Link>
  );
}

function StaticProofLine({ label, body }: { label: string; body: string }) {
  return (
    <div className="px-4 py-3">
      <div
        className="mb-2 text-[10px] uppercase tracking-[0.18em]"
        style={{ color: 'var(--bsi-primary)', fontFamily: 'var(--bsi-font-data)' }}
      >
        {label}
      </div>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--bsi-bone)' }}>
        {body}
      </p>
    </div>
  );
}

export function HeroScoreStrip() {
  const { data, loading } = useSportData<HeroScoresData>('/api/hero-scores', {
    refreshInterval: 30_000,
  });

  const cards: Array<{ game: HeroGame; label: string; accent: string }> = [];
  if (data?.liveNow) cards.push({ game: data.liveNow, label: 'Live', accent: 'var(--bsi-success)' });
  if (data?.nextUp) cards.push({ game: data.nextUp, label: 'Next Up', accent: 'var(--bsi-primary)' });
  if (data?.recentFinal) cards.push({ game: data.recentFinal, label: 'Final', accent: 'var(--bsi-dust)' });

  return (
    <div
      data-home-live-proof
      className="overflow-hidden rounded-sm border border-[rgba(245,242,235,0.1)] bg-[rgba(10,10,10,0.88)] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl"
    >
      <div className="border-b border-[rgba(245,242,235,0.08)] px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="heritage-stamp" style={{ padding: '2px 8px', fontSize: '9px' }}>
              Live Proof
            </span>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--bsi-dust)' }}>
              Source-tagged boards with live cadence visible.
            </p>
          </div>
          <Link
            href="/scores"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors"
            style={{ color: 'var(--bsi-bone)' }}
          >
            All Scores
            <span style={{ color: 'var(--bsi-primary)' }}>&rarr;</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-y-3 divide-y divide-[rgba(245,242,235,0.08)] px-2 py-2 md:grid-cols-3 md:divide-x md:divide-y-0">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="px-4 py-3">
              <div className="mb-2 h-3 w-16 rounded-sm bg-[rgba(255,255,255,0.06)]" />
              <div className="space-y-2">
                <div className="h-5 w-full rounded-sm bg-[rgba(255,255,255,0.08)]" />
                <div className="h-5 w-5/6 rounded-sm bg-[rgba(255,255,255,0.06)]" />
              </div>
            </div>
          ))}
        </div>
      ) : cards.length > 0 ? (
        <div className="grid gap-y-3 divide-y divide-[rgba(245,242,235,0.08)] px-2 py-2 md:grid-cols-3 md:divide-x md:divide-y-0">
          {cards.map((card) => (
            <GameLine key={card.label} game={card.game} label={card.label} accent={card.accent} />
          ))}
        </div>
      ) : (
        <div className="grid gap-y-3 divide-y divide-[rgba(245,242,235,0.08)] px-2 py-2 md:grid-cols-3 md:divide-x md:divide-y-0">
          <StaticProofLine
            label="Coverage"
            body="Every D1 program gets the same attention the prestige platforms save for the coasts."
          />
          <StaticProofLine
            label="Cadence"
            body="Live boards refresh during games. Analytics recompute every six hours. Editorial shows up every weekend."
          />
          <StaticProofLine
            label="Source"
            body="Every board carries source and timestamp so the numbers can stand on their own."
          />
        </div>
      )}

      {data?.meta && (
        <p
          className="border-t border-[rgba(245,242,235,0.08)] px-4 py-3 text-[10px] sm:px-6"
          style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}
        >
          Source: {data.meta.source} · Updated{' '}
          {new Date(data.meta.fetched_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'America/Chicago',
          })}{' '}
          CT
        </p>
      )}
    </div>
  );
}
