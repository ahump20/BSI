'use client';

/**
 * BSI Homepage — Monument / Brand-Forward
 *
 * Broadcast opening sequence: fire dachshund shield at monument scale,
 * tagline as declaration, live score ticker, standout players, leaderboards,
 * navigation grid. Heritage Design System v2.1 throughout.
 */

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSportData } from '@/lib/hooks/useSportData';
import { ScrollReveal } from '@/components/cinematic';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { DataTransition } from '@/components/motion/DataTransition';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { fmt3, fmt2 } from '@/lib/analytics/viz';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LeaderboardEntry {
  player_id?: string;
  player_name: string;
  team: string;
  conference?: string;
  pa?: number;
  ip?: number;
  woba?: number;
  wrc_plus?: number;
  avg?: number;
  obp?: number;
  slg?: number;
  iso?: number;
  k_pct?: number;
  bb_pct?: number;
  fip?: number;
  era?: number;
  whip?: number;
  k_9?: number;
  bb_9?: number;
  [key: string]: unknown;
}

interface LeaderboardResponse {
  data: LeaderboardEntry[];
  meta: { source: string; fetched_at: string; timezone: string };
}

interface ScoreGame {
  id?: string;
  away_team?: string;
  home_team?: string;
  away_score?: number;
  home_score?: number;
  status?: string;
  start_time?: string;
  [key: string]: unknown;
}

interface ScoresResponse {
  games?: ScoreGame[];
  data?: ScoreGame[];
  meta?: { source: string; fetched_at: string; timezone: string };
}

// ---------------------------------------------------------------------------
// Navigation items — product entry points
// ---------------------------------------------------------------------------

const NAV_ITEMS: readonly { title: string; href: string; desc: string; accent?: boolean }[] = [
  { title: 'Savant', href: '/college-baseball/savant/', desc: 'Advanced leaderboards', accent: true },
  { title: 'Live Scores', href: '/scores/', desc: 'Real-time games', accent: true },
  { title: 'Players', href: '/college-baseball/players/', desc: 'Search all D1 players', accent: true },
  { title: 'Rankings', href: '/college-baseball/rankings/', desc: 'National poll' },
  { title: 'Standings', href: '/college-baseball/standings/', desc: 'Conference tables' },
  { title: 'Compare', href: '/college-baseball/compare/', desc: 'Head-to-head analysis' },
  { title: 'Bubble', href: '/college-baseball/savant/bubble/', desc: 'Tournament projections' },
  { title: 'Ask BSI', href: '/ask/', desc: 'AI-powered analysis' },
];

// ---------------------------------------------------------------------------
// Score Ticker
// ---------------------------------------------------------------------------

function ScoreTicker({ games }: { games: ScoreGame[] }) {
  if (!games.length) return null;

  // Duplicate the list so the marquee loops seamlessly
  const doubled = [...games, ...games];

  return (
    <div
      className="relative overflow-hidden"
      style={{
        borderTop: '2px solid var(--bsi-primary)',
        background: 'var(--surface-dugout)',
      }}
      aria-label="Live scores ticker"
    >
      <div className="ticker-track flex items-center whitespace-nowrap py-2.5">
        {doubled.map((g, i) => {
          const isLive = g.status?.toLowerCase().includes('live') ||
                         g.status?.toLowerCase().includes('in progress') ||
                         g.status?.toLowerCase().includes('top') ||
                         g.status?.toLowerCase().includes('bot');
          return (
            <span key={`${g.id ?? i}-${i}`} className="inline-flex items-center shrink-0">
              {i > 0 && (
                <span
                  className="mx-4 text-xs"
                  style={{ color: 'var(--bsi-primary)', opacity: 0.75 }}
                  aria-hidden="true"
                >
                  &#9670;
                </span>
              )}
              <Link
                href={g.id ? `/college-baseball/game/${g.id}/` : '/scores/'}
                className="inline-flex items-center gap-2 text-xs transition-colors hover:text-[var(--bsi-primary)]"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--bsi-bone)' }}
              >
                <span style={{ color: 'var(--bsi-dust)' }}>{g.away_team ?? 'Away'}</span>
                <span className="font-bold tabular-nums">{g.away_score ?? '-'}</span>
                <span style={{ color: 'rgba(196,184,165,0.7)' }}>@</span>
                <span style={{ color: 'var(--bsi-dust)' }}>{g.home_team ?? 'Home'}</span>
                <span className="font-bold tabular-nums">{g.home_score ?? '-'}</span>
                {isLive && (
                  <span className="flex items-center gap-1 ml-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: '#10B981' }}>
                      Live
                    </span>
                  </span>
                )}
                {!isLive && g.status && (
                  <span className="text-[10px] uppercase tracking-wider ml-1" style={{ color: 'rgba(196,184,165,0.7)' }}>
                    {g.status}
                  </span>
                )}
              </Link>
            </span>
          );
        })}
      </div>

      {/* Fade edges for seamless infinite scroll */}
      <div
        className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, var(--surface-dugout), transparent)' }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, var(--surface-dugout), transparent)' }}
      />

      {/* Animation defined in globals.css: .ticker-track / @keyframes ticker-scroll */}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Standout Player Card
// ---------------------------------------------------------------------------

function StandoutCard({
  label,
  accentColor,
  player,
  statLabel,
  statValue,
  supportingStats,
  href,
}: {
  label: string;
  accentColor: string;
  player: { name: string; team: string };
  statLabel: string;
  statValue: string;
  supportingStats: { label: string; value: string }[];
  href: string;
}) {
  return (
    <Link href={href} className="block group heritage-card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: accentColor }}
        />
        <span
          className="text-[10px] uppercase tracking-[0.15em] font-semibold"
          style={{ fontFamily: 'var(--font-oswald)', color: 'var(--bsi-dust)' }}
        >
          {label}
        </span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p
            className="text-base sm:text-lg font-bold truncate group-hover:text-[var(--bsi-primary)] transition-colors"
            style={{ fontFamily: 'var(--font-oswald)', color: 'var(--bsi-bone)' }}
          >
            {player.name}
          </p>
          <p
            className="text-[11px] mt-0.5"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--bsi-dust)' }}
          >
            {player.team}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p
            className="text-2xl sm:text-[28px] font-bold tabular-nums leading-none"
            style={{ fontFamily: 'var(--font-mono)', color: accentColor }}
          >
            {statValue}
          </p>
          <p
            className="text-[9px] uppercase tracking-wider mt-1"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--bsi-dust)' }}
          >
            {statLabel}
          </p>
        </div>
      </div>

      <div
        className="flex gap-4 mt-3 pt-3 border-t"
        style={{ borderColor: 'rgba(196,184,165,0.08)' }}
      >
        {supportingStats.map((s) => (
          <span
            key={s.label}
            className="text-[10px] tabular-nums"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--bsi-dust)' }}
          >
            {s.value} <span className="text-[var(--bsi-dust)]">{s.label}</span>
          </span>
        ))}
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Leaderboard Table
// ---------------------------------------------------------------------------

function LeaderboardTable({
  title,
  href,
  data,
  meta,
  columns,
}: {
  title: string;
  href: string;
  data: LeaderboardEntry[];
  meta?: { source: string; fetched_at: string };
  columns: { key: string; label: string; format: (v: number) => string; accent?: boolean }[];
}) {
  return (
    <div>
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{
          background: 'var(--surface-press-box)',
          borderBottom: '2px solid var(--bsi-primary)',
        }}
      >
        <h2
          className="text-xs uppercase tracking-[0.15em] font-bold"
          style={{ fontFamily: 'var(--font-oswald)', color: 'var(--bsi-primary)' }}
        >
          {title}
        </h2>
        <Link
          href={href}
          className="text-[10px] uppercase tracking-wider transition-colors hover:text-[var(--bsi-primary)]"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--bsi-dust)' }}
        >
          Full board &rarr;
        </Link>
      </div>

      {/* Table */}
      <div
        className="border border-t-0 overflow-x-auto"
        style={{ borderColor: 'var(--border-vintage)', borderRadius: '0 0 2px 2px' }}
      >
        <table className="w-full text-[11px]" style={{ fontFamily: 'var(--font-mono)' }}>
          <thead>
            <tr style={{ background: 'rgba(17,17,17,0.5)' }}>
              <th
                className="text-left pl-4 pr-1 py-2 font-semibold"
                style={{ color: 'var(--bsi-dust)', fontSize: '9px', fontFamily: 'var(--font-oswald)' }}
              >
                #
              </th>
              <th
                className="text-left px-1 py-2 font-semibold"
                style={{ color: 'var(--bsi-dust)', fontSize: '9px', fontFamily: 'var(--font-oswald)' }}
              >
                PLAYER
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-right px-2 py-2 font-semibold"
                  style={{
                    color: col.accent ? 'var(--bsi-primary)' : 'var(--bsi-dust)',
                    fontSize: '9px',
                    fontFamily: 'var(--font-oswald)',
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 10).map((row, idx) => (
              <tr
                key={row.player_id ?? idx}
                className="border-t transition-colors duration-100"
                style={{
                  borderColor: 'rgba(196,184,165,0.06)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(191,87,0,0.04)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td className="pl-4 pr-1 py-2 tabular-nums" style={{ color: 'var(--bsi-dust)' }}>
                  {idx + 1}
                </td>
                <td className="px-1 py-2 max-w-[180px]">
                  <Link
                    href={row.player_id ? `/college-baseball/savant/player/${row.player_id}/` : '#'}
                    className="transition-colors duration-100 hover:text-[var(--bsi-primary)]"
                    style={{ color: 'var(--bsi-bone)' }}
                  >
                    {row.player_name}
                  </Link>
                  <span
                    className="block text-[9px] mt-px truncate"
                    style={{ color: 'rgba(196,184,165,0.7)' }}
                  >
                    {row.team}
                  </span>
                </td>
                {columns.map((col) => {
                  const val = row[col.key];
                  return (
                    <td
                      key={col.key}
                      className="text-right px-2 py-2 tabular-nums"
                      style={{ color: col.accent ? 'var(--bsi-bone)' : 'var(--bsi-dust)' }}
                    >
                      {typeof val === 'number' ? col.format(val) : '--'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Trust cue */}
      {meta && (
        <div
          className="flex items-center justify-between px-4 py-1.5 text-[9px]"
          style={{ fontFamily: 'var(--font-mono)', color: 'rgba(196,184,165,0.35)' }}
        >
          <span>Source: {meta.source}</span>
          <span>
            {meta.fetched_at
              ? new Date(meta.fetched_at).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZone: 'America/Chicago',
                })
              : ''}
            {meta.fetched_at ? ' CT' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Table Skeleton
// ---------------------------------------------------------------------------

function TableSkeleton() {
  return (
    <div>
      <div
        className="h-10"
        style={{ background: 'var(--surface-press-box)', borderBottom: '2px solid rgba(191,87,0,0.3)' }}
      />
      <div className="border border-t-0 overflow-hidden animate-pulse" style={{ borderColor: 'var(--border-vintage)' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-4 py-2.5 border-t"
            style={{ borderColor: 'rgba(196,184,165,0.06)' }}
          >
            <div className="h-3 w-4 rounded-sm" style={{ background: 'rgba(196,184,165,0.08)' }} />
            <div className="h-3 flex-1 rounded-sm" style={{ background: 'rgba(196,184,165,0.1)' }} />
            <div className="h-3 w-10 rounded-sm" style={{ background: 'rgba(196,184,165,0.08)' }} />
            <div className="h-3 w-10 rounded-sm" style={{ background: 'rgba(196,184,165,0.06)' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Standout Skeleton
// ---------------------------------------------------------------------------

function StandoutSkeleton() {
  return (
    <div className="heritage-card p-5 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(196,184,165,0.15)' }} />
        <div className="h-2.5 w-16 rounded-sm" style={{ background: 'rgba(196,184,165,0.1)' }} />
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="h-5 w-32 rounded-sm mb-1" style={{ background: 'rgba(196,184,165,0.12)' }} />
          <div className="h-3 w-20 rounded-sm" style={{ background: 'rgba(196,184,165,0.08)' }} />
        </div>
        <div className="h-8 w-16 rounded-sm" style={{ background: 'rgba(196,184,165,0.1)' }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Empty / Error States
// ---------------------------------------------------------------------------

function LeaderboardEmpty({ title, error, onRetry }: { title: string; error?: string | null; onRetry?: () => void }) {
  return (
    <div>
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: 'var(--surface-press-box)', borderBottom: '2px solid rgba(191,87,0,0.3)' }}
      >
        <h2
          className="text-xs uppercase tracking-[0.15em] font-bold"
          style={{ fontFamily: 'var(--font-oswald)', color: 'var(--bsi-primary)' }}
        >{title}</h2>
      </div>
      <div className="border border-t-0 px-4 py-8 text-center" style={{ borderColor: 'var(--border-vintage)' }}>
        <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--bsi-dust)' }}>
          {error ? 'Data temporarily unavailable' : 'No leaderboard data available'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 text-[10px] uppercase tracking-wider px-3 py-1.5 border rounded-sm transition-colors hover:bg-[rgba(191,87,0,0.08)] hover:border-[var(--bsi-primary)]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--bsi-primary)', borderColor: 'rgba(191,87,0,0.3)' }}
          >Retry</button>
        )}
      </div>
    </div>
  );
}

function StandoutEmpty() {
  return (
    <div className="heritage-card p-5 flex items-center justify-center" style={{ minHeight: '120px' }}>
      <p className="text-[10px] uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)', color: 'rgba(196,184,165,0.35)' }}>
        Updating player data...
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export function HomePageClient() {
  // Data fetches
  const { data: battingRes, loading: battingLoading, error: battingError, retry: retryBatting } =
    useSportData<LeaderboardResponse>('/api/savant/batting/leaderboard?limit=50', { refreshInterval: 300_000 });
  const { data: pitchingRes, loading: pitchingLoading, error: pitchingError, retry: retryPitching } =
    useSportData<LeaderboardResponse>('/api/savant/pitching/leaderboard?limit=50', { refreshInterval: 300_000 });
  const { data: scoresRes } =
    useSportData<ScoresResponse>('/api/college-baseball/scores', { refreshInterval: 30_000 });

  const batters = battingRes?.data ?? [];
  const pitchers = pitchingRes?.data ?? [];
  const games: ScoreGame[] = scoresRes?.games ?? scoresRes?.data ?? [];

  // Derived: standout players
  const topHitter = useMemo(() => {
    return [...batters]
      .filter((b) => b.wrc_plus != null && (b.pa ?? 0) >= 30)
      .sort((a, b) => (b.wrc_plus ?? 0) - (a.wrc_plus ?? 0))[0] ?? null;
  }, [batters]);

  const topPitcher = useMemo(() => {
    return [...pitchers]
      .filter((p) => p.fip != null && (p.ip ?? 0) >= 10)
      .sort((a, b) => (a.fip ?? 99) - (b.fip ?? 99))[0] ?? null;
  }, [pitchers]);

  // Derived: live game count
  const liveCount = useMemo(() => {
    return games.filter((g) => {
      const s = (g.status ?? '').toLowerCase();
      return s.includes('live') || s.includes('in progress') || s.includes('top') || s.includes('bot');
    }).length;
  }, [games]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-scoreboard)' }}>

      {/* ================================================================= */}
      {/* HERO — Monument shield, tagline, live badge                        */}
      {/* ================================================================= */}
      <section
        className="relative overflow-hidden corner-marks"
        style={{ background: 'var(--surface-scoreboard)' }}
      >
        {/* R2 stadium photograph — pushed harder, the venue IS the brand */}
        <img
          src="/api/assets/images/blaze-stadium-hero.png"
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
          style={{ opacity: 0.38 }}
        />

        {/* Gradient overlay — breathes in the center, locks down at edges for text */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(
              to bottom,
              rgba(10,10,10,0.6) 0%,
              rgba(10,10,10,0.2) 25%,
              rgba(10,10,10,0.15) 45%,
              rgba(10,10,10,0.3) 70%,
              var(--surface-scoreboard) 95%
            )`,
          }}
        />

        {/* Burnt-orange radial warmth — wider, centered on the shield */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 70% at 50% 42%, rgba(191,87,0,0.18) 0%, transparent 75%)',
          }}
        />

        {/* BSI shield watermark — faint brand echo in bottom-right */}
        <img
          src="/api/assets/brand/bsi-logo-seal-400.png"
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          className="absolute pointer-events-none hidden lg:block"
          style={{
            width: '280px',
            height: '280px',
            right: '6%',
            bottom: '12%',
            opacity: 0.04,
          }}
        />

        {/* Cinematic vignette — heavier at edges, draws eye to center content */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 85% 80% at 50% 45%, transparent 35%, rgba(0,0,0,0.65) 100%)',
          }}
        />

        {/* Grain texture */}
        <div className="absolute inset-0 pointer-events-none grain-overlay" style={{ opacity: 0.35 }} />

        <div className="relative z-10 flex flex-col items-center text-center px-4 pt-12 pb-8 sm:pt-16 sm:pb-10 md:pt-20 md:pb-12">

          {/* Shield logo — monument scale */}
          <ScrollReveal direction="scale" delay={0} className="mb-6">
            <Image
              src="/images/brand/bsi-logo-primary.webp"
              alt="Blaze Sports Intel — fire dachshund shield"
              width={400}
              height={400}
              className="w-[240px] sm:w-[300px] md:w-[360px] lg:w-[400px] h-auto drop-shadow-[0_0_60px_rgba(191,87,0,0.25)]"
              priority
            />
          </ScrollReveal>

          {/* Tagline */}
          <ScrollReveal delay={150}>
            <p
              className="text-lg sm:text-xl md:text-2xl italic tracking-wide"
              style={{
                fontFamily: 'var(--font-cormorant)',
                color: 'var(--bsi-primary)',
              }}
            >
              Born to Blaze the Path Beaten Less
            </p>
          </ScrollReveal>

          {/* Subtitle */}
          <ScrollReveal delay={300}>
            <p
              className="mt-3 text-[11px] sm:text-xs uppercase tracking-[0.2em]"
              style={{
                fontFamily: 'var(--font-oswald)',
                color: 'var(--bsi-dust)',
              }}
            >
              Park-adjusted analytics for 330 D1 programs
            </p>
          </ScrollReveal>

          {/* Live badge */}
          {liveCount > 0 && (
            <ScrollReveal delay={450}>
              <Link
                href="/scores/"
                className="mt-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-sm border transition-all
                           hover:bg-[rgba(16,185,129,0.08)] hover:border-[rgba(16,185,129,0.3)]"
                style={{
                  borderColor: 'rgba(16,185,129,0.2)',
                  background: 'rgba(16,185,129,0.04)',
                }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <DataTransition value={liveCount} mode="flip">
                  <span
                    className="text-[10px] uppercase tracking-wider font-semibold"
                    style={{ fontFamily: 'var(--font-mono)', color: '#10B981' }}
                  >
                    {liveCount} {liveCount === 1 ? 'game' : 'games'} live
                  </span>
                </DataTransition>
              </Link>
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* ================================================================= */}
      {/* SCORE TICKER                                                       */}
      {/* ================================================================= */}
      <DataErrorBoundary name="ScoreTicker" compact>
        <ScoreTicker games={games} />
      </DataErrorBoundary>

      {/* Newcomer orientation */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <p
          className="text-sm italic hidden lg:block"
          style={{ fontFamily: 'var(--font-cormorant, serif)', color: 'var(--bsi-dust)' }}
        >
          Real-time scores, advanced sabermetrics, and scouting intel across five sports — updated continuously.
        </p>
      </div>

      {/* ================================================================= */}
      {/* STANDOUT PLAYERS                                                   */}
      {/* ================================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10">
        <Stagger speed="normal" className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <StaggerItem>
            <DataErrorBoundary name="TopHitter" compact>
              {battingLoading ? (
                <StandoutSkeleton />
              ) : topHitter ? (
                <StandoutCard
                  label="Top Hitter"
                  accentColor="#10B981"
                  player={{ name: topHitter.player_name, team: topHitter.team }}
                  statLabel="wRC+"
                  statValue={String(Math.round(topHitter.wrc_plus ?? 0))}
                  supportingStats={[
                    { label: 'wOBA', value: fmt3(topHitter.woba ?? 0) },
                    { label: 'AVG', value: fmt3(topHitter.avg ?? 0) },
                    { label: 'ISO', value: fmt3(topHitter.iso ?? 0) },
                  ]}
                  href={topHitter.player_id ? `/college-baseball/savant/player/${topHitter.player_id}/` : '/college-baseball/savant/'}
                />
              ) : (
                <StandoutEmpty />
              )}
            </DataErrorBoundary>
          </StaggerItem>
          <StaggerItem>
            <DataErrorBoundary name="TopPitcher" compact>
              {pitchingLoading ? (
                <StandoutSkeleton />
              ) : topPitcher ? (
                <StandoutCard
                  label="Top Pitcher"
                  accentColor="#4B9CD3"
                  player={{ name: topPitcher.player_name, team: topPitcher.team }}
                  statLabel="FIP"
                  statValue={fmt2(topPitcher.fip ?? 0)}
                  supportingStats={[
                    { label: 'ERA', value: fmt2(topPitcher.era ?? 0) },
                    { label: 'K/9', value: fmt2(topPitcher.k_9 ?? 0) },
                    { label: 'WHIP', value: fmt2(topPitcher.whip ?? 0) },
                  ]}
                  href={topPitcher.player_id ? `/college-baseball/savant/player/${topPitcher.player_id}/` : '/college-baseball/savant/'}
                />
              ) : (
                <StandoutEmpty />
              )}
            </DataErrorBoundary>
          </StaggerItem>
        </Stagger>
      </section>

      {/* ================================================================= */}
      {/* LEADERBOARDS                                                       */}
      {/* ================================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          <ScrollReveal delay={0}>
            <DataErrorBoundary name="BattingLeaderboard" compact>
              {battingLoading ? (
                <TableSkeleton />
              ) : batters.length > 0 ? (
                <LeaderboardTable
                  title="Batting Leaders"
                  href="/college-baseball/savant/"
                  data={batters}
                  meta={battingRes?.meta ? { source: battingRes.meta.source, fetched_at: battingRes.meta.fetched_at } : undefined}
                  columns={[
                    { key: 'woba', label: 'wOBA', format: fmt3, accent: true },
                    { key: 'wrc_plus', label: 'wRC+', format: (v) => String(Math.round(v)) },
                    { key: 'avg', label: 'AVG', format: fmt3 },
                    { key: 'slg', label: 'SLG', format: fmt3 },
                  ]}
                />
              ) : (
                <LeaderboardEmpty title="Batting Leaders" error={battingError} onRetry={retryBatting} />
              )}
            </DataErrorBoundary>
          </ScrollReveal>

          {/* Section rule between batting and pitching */}
          <div
            className="col-span-full my-2 border-t lg:hidden"
            style={{ borderColor: 'var(--border-vintage)' }}
          />

          <ScrollReveal delay={100}>
            <DataErrorBoundary name="PitchingLeaderboard" compact>
              {pitchingLoading ? (
                <TableSkeleton />
              ) : pitchers.length > 0 ? (
                <LeaderboardTable
                  title="Pitching Leaders"
                  href="/college-baseball/savant/"
                  data={pitchers}
                  meta={pitchingRes?.meta ? { source: pitchingRes.meta.source, fetched_at: pitchingRes.meta.fetched_at } : undefined}
                  columns={[
                    { key: 'fip', label: 'FIP', format: fmt2, accent: true },
                    { key: 'era', label: 'ERA', format: fmt2 },
                    { key: 'k_9', label: 'K/9', format: fmt2 },
                    { key: 'whip', label: 'WHIP', format: fmt2 },
                  ]}
                />
              ) : (
                <LeaderboardEmpty title="Pitching Leaders" error={pitchingError} onRetry={retryPitching} />
              )}
            </DataErrorBoundary>
          </ScrollReveal>
        </div>
      </section>

      {/* ================================================================= */}
      {/* NAVIGATION GRID                                                    */}
      {/* ================================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-12">
        <ScrollReveal>
          <h2
            className="text-xs uppercase tracking-[0.15em] font-bold mb-4"
            style={{ fontFamily: 'var(--font-oswald)', color: 'var(--bsi-primary)' }}
          >
            Explore
          </h2>
        </ScrollReveal>
        <Stagger speed="fast" as="div" className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {NAV_ITEMS.map((item) => (
            <StaggerItem key={item.href}>
              <Link
                href={item.href}
                className="group heritage-card px-4 py-3.5 transition-all block h-full"
              >
                <p
                  className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.12em] mb-1 transition-colors"
                  style={{
                    fontFamily: 'var(--font-oswald)',
                    color: item.accent ? 'var(--bsi-primary)' : 'var(--bsi-bone)',
                  }}
                >
                  <span className="group-hover:text-[var(--bsi-primary)]">{item.title}</span>
                </p>
                <p
                  className="text-[9px] sm:text-[10px]"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--bsi-dust)' }}
                >
                  {item.desc}
                </p>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ================================================================= */}
      {/* BRAND FOOTER STRIP                                                 */}
      {/* ================================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-14 sm:pb-12">
        <ScrollReveal>
          <div
            className="flex items-center justify-center gap-4 py-5 border-t"
            style={{ borderColor: 'rgba(196,184,165,0.08)' }}
          >
            <Image
              src="/brand/blaze-roundel.png"
              alt="Blaze Intelligence roundel"
              width={44}
              height={44}
              className="w-10 h-10 sm:w-11 sm:h-11 opacity-75"
            />
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.2em] font-semibold"
                style={{ fontFamily: 'var(--font-oswald)', color: 'var(--bsi-dust)' }}
              >
                Blaze Intelligence
              </p>
              <p
                className="text-[9px] mt-0.5"
                style={{ fontFamily: 'var(--font-mono)', color: 'rgba(196,184,165,0.35)' }}
              >
                330 programs &middot; updated every 6 hours
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
