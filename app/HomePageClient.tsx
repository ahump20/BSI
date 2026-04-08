'use client';

/**
 * BSI Homepage — Multi-Sport Intelligence Landing
 *
 * Structure: Hero → Score Ticker → Sport Pulse (live game counts) →
 * Value Proposition (multi-sport pitch) → Sport Navigation →
 * Savant Proof (standouts + leaderboards) → Multi-sport News →
 * Closing CTA → Brand Strip
 *
 * Heritage Design System v2.1 throughout. All data wired to live APIs.
 */

import { useMemo, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSportData } from '@/lib/hooks/useSportData';
import { DataTransition } from '@/components/motion/DataTransition';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { ScrollReveal } from '@/components/cinematic';
import { fmt3, fmt2 } from '@/lib/analytics/viz';
import { GamePreviewModal } from '@/components/ui/GamePreviewModal';

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

interface TickerGame extends ScoreGame {
  sport: string;
  sportShort: string;
}

interface ScoresResponse {
  games?: ScoreGame[];
  data?: ScoreGame[];
  meta?: { source: string; fetched_at: string; timezone: string };
}

interface NewsArticle {
  headline?: string;
  description?: string;
  link?: string;
  published?: string;
  images?: { url: string; caption?: string }[];
}

interface NewsBucket {
  sport: string;
  data: { articles: NewsArticle[] };
}

interface SportPulseData {
  live: number;
  total: number;
}

// ---------------------------------------------------------------------------
// Sport navigation — organized by sport, not by feature
// ---------------------------------------------------------------------------

const SPORT_NAV = [
  {
    key: 'college-baseball',
    name: 'College Baseball',
    href: '/college-baseball/',
    desc: 'Savant leaderboards, scouting grades, and advanced stats for 330 D1 programs',
    flagship: true,
    accent: 'var(--bsi-primary)',
    badge: 'Deepest Analytics',
  },
  {
    key: 'mlb',
    name: 'MLB',
    href: '/mlb/',
    desc: 'Scores, standings, and player tracking across both leagues',
    flagship: false,
    accent: 'var(--heritage-columbia-blue)',
    badge: null,
  },
  {
    key: 'nfl',
    name: 'NFL',
    href: '/nfl/',
    desc: 'Game scores, player stats, and weekly matchups',
    flagship: false,
    accent: '#10B981',
    badge: null,
  },
  {
    key: 'nba',
    name: 'NBA',
    href: '/nba/',
    desc: 'Live scores, standings, and player performance',
    flagship: false,
    accent: '#F59E0B',
    badge: null,
  },
  {
    key: 'cfb',
    name: 'College Football',
    href: '/cfb/',
    desc: 'Rankings, scores, and conference breakdowns',
    flagship: false,
    accent: '#8B5CF6',
    badge: null,
  },
] as const;

// Helper: count live/total games from a scores response
function countGames(res: ScoresResponse | null): SportPulseData {
  const g = res?.games ?? res?.data ?? [];
  const live = g.filter((game) => {
    const raw = game.status;
    const s = (typeof raw === 'string' ? raw : typeof raw === 'object' && raw !== null ? String((raw as Record<string, unknown>).detailedState ?? (raw as Record<string, unknown>).state ?? '') : '').toLowerCase();
    return s.includes('live') || s.includes('in progress') || s.includes('top') || s.includes('bot');
  }).length;
  return { live, total: g.length };
}

// Sport labels for news
const SPORT_LABELS: Record<string, string> = {
  nfl: 'NFL',
  nba: 'NBA',
  mlb: 'MLB',
  ncaafb: 'CFB',
  cbb: 'CBB',
  d1bb: 'College Baseball',
};

// ---------------------------------------------------------------------------
// Ticker game normalizer — extracts team names + scores from any API shape
// ---------------------------------------------------------------------------

function normalizeTickerGame(g: ScoreGame): ScoreGame {
  // Already has flat fields? Return as-is.
  if (g.away_team && g.home_team) return g;

  let away_team: string | undefined;
  let home_team: string | undefined;
  let away_score: number | string | undefined;
  let home_score: number | string | undefined;
  let id = g.id;

  const raw = g as Record<string, unknown>;

  // Shape 1: Highlightly raw — homeTeam.name, awayTeam.name, state.score.current
  const hlHome = raw.homeTeam as Record<string, unknown> | undefined;
  const hlAway = raw.awayTeam as Record<string, unknown> | undefined;
  if (hlHome || hlAway) {
    home_team = (hlHome?.displayName ?? hlHome?.name ?? hlHome?.shortName) as string | undefined;
    away_team = (hlAway?.displayName ?? hlAway?.name ?? hlAway?.shortName) as string | undefined;
    // Highlightly scores: try top-level first, fall back to state.score.current ("X - Y")
    home_score = raw.homeScore as number | undefined;
    away_score = raw.awayScore as number | undefined;
    if (home_score == null && raw.state) {
      const stateObj = raw.state as Record<string, unknown>;
      const scoreObj = stateObj.score as Record<string, unknown> | undefined;
      const current = scoreObj?.current as string | undefined;
      if (current?.includes(' - ')) {
        const [a, h] = current.split(' - ').map((s) => parseInt(s.trim(), 10));
        if (!isNaN(a)) away_score = a;
        if (!isNaN(h)) home_score = h;
      }
    }
    if (!id) id = String(raw.id ?? '');
  }

  // Shape 2: Transformed — teams.away.name, teams.home.name (object with named keys, NOT array)
  if (!away_team && raw.teams && !Array.isArray(raw.teams)) {
    const teams = raw.teams as Record<string, Record<string, unknown>>;
    away_team = (teams.away?.name ?? teams.away?.displayName ?? teams.away?.abbreviation) as string | undefined;
    home_team = (teams.home?.name ?? teams.home?.displayName ?? teams.home?.abbreviation) as string | undefined;
    away_score = teams.away?.score as number | string | undefined;
    home_score = teams.home?.score as number | string | undefined;
  }

  // Shape 3: MLB/NBA/NFL/CFB — home.name, away.name, home.score, away.score
  const nestedHome = raw.home as Record<string, unknown> | undefined;
  const nestedAway = raw.away as Record<string, unknown> | undefined;
  if (!away_team && (nestedHome || nestedAway)) {
    home_team = (nestedHome?.name ?? nestedHome?.displayName ?? nestedHome?.abbreviation) as string | undefined;
    away_team = (nestedAway?.name ?? nestedAway?.displayName ?? nestedAway?.abbreviation) as string | undefined;
    home_score = nestedHome?.score as number | string | undefined;
    away_score = nestedAway?.score as number | string | undefined;
  }

  // Shape 4: ESPN competitions — competitors array
  const competitions = raw.competitions as Array<Record<string, unknown>> | undefined;
  if (!away_team && competitions?.[0]) {
    const competitors = (competitions[0].competitors ?? []) as Array<Record<string, unknown>>;
    const homeComp = competitors.find((c) => c.homeAway === 'home');
    const awayComp = competitors.find((c) => c.homeAway === 'away');
    const homeTeam = homeComp?.team as Record<string, unknown> | undefined;
    const awayTeam = awayComp?.team as Record<string, unknown> | undefined;
    home_team = (homeTeam?.displayName ?? homeTeam?.name ?? homeTeam?.abbreviation) as string | undefined;
    away_team = (awayTeam?.displayName ?? awayTeam?.name ?? awayTeam?.abbreviation) as string | undefined;
    home_score = homeComp?.score as number | string | undefined;
    away_score = awayComp?.score as number | string | undefined;
    if (!id) id = String(raw.id ?? '');
  }

  // Shape 5: ESPN flat teams array — teams[].team.displayName, teams[].score, teams[].homeAway
  // Used by MLB, NBA, NFL, CFB score endpoints
  if (!away_team && Array.isArray(raw.teams)) {
    const teamsArr = raw.teams as Array<Record<string, unknown>>;
    const homeEntry = teamsArr.find((t) => t.homeAway === 'home');
    const awayEntry = teamsArr.find((t) => t.homeAway === 'away');
    const homeTeamObj = homeEntry?.team as Record<string, unknown> | undefined;
    const awayTeamObj = awayEntry?.team as Record<string, unknown> | undefined;
    home_team = (homeTeamObj?.displayName ?? homeTeamObj?.shortDisplayName ?? homeTeamObj?.abbreviation) as string | undefined;
    away_team = (awayTeamObj?.displayName ?? awayTeamObj?.shortDisplayName ?? awayTeamObj?.abbreviation) as string | undefined;
    home_score = homeEntry?.score as number | string | undefined;
    away_score = awayEntry?.score as number | string | undefined;
    if (!id) id = String(raw.id ?? '');
  }

  // Normalize status → flat string for ticker display
  // ESPN: status.type.detail ("Bottom 6th"), status.type.state ("in"/"post"/"pre")
  // Highlightly: state.description ("Scheduled"/"In Progress"/"Completed"), state.report ("Wed, April 8th at 7:00 PM EDT")
  let normalizedStatus = g.status;
  if (typeof raw.status === 'object' && raw.status !== null) {
    const statusObj = raw.status as Record<string, unknown>;
    const statusType = statusObj.type as Record<string, unknown> | undefined;
    if (statusType?.detail) {
      normalizedStatus = String(statusType.detail);
    } else if (statusType?.state) {
      normalizedStatus = String(statusType.state);
    } else if (statusObj.detailedState) {
      normalizedStatus = String(statusObj.detailedState);
    }
  }
  // Highlightly: status lives in state.description, not status
  if (!normalizedStatus && raw.state && typeof raw.state === 'object') {
    const stateObj = raw.state as Record<string, unknown>;
    const desc = stateObj.description as string | undefined;
    if (desc) normalizedStatus = desc;
  }

  const finalAwayScore = away_score != null ? Number(away_score) : g.away_score;
  const finalHomeScore = home_score != null ? Number(home_score) : g.home_score;
  return { ...g, id, away_team, home_team, away_score: isNaN(finalAwayScore as number) ? undefined : finalAwayScore, home_score: isNaN(finalHomeScore as number) ? undefined : finalHomeScore, status: normalizedStatus };
}

// Sport pulse config — maps API keys to display
const PULSE_SPORTS = [
  { key: 'college-baseball', apiPath: '/api/college-baseball/scores', label: 'College Baseball', short: 'CBB' },
  { key: 'mlb', apiPath: '/api/mlb/scores', label: 'MLB', short: 'MLB' },
  { key: 'nfl', apiPath: '/api/nfl/scores', label: 'NFL', short: 'NFL' },
  { key: 'nba', apiPath: '/api/nba/scores', label: 'NBA', short: 'NBA' },
  { key: 'cfb', apiPath: '/api/cfb/scores', label: 'CFB', short: 'CFB' },
] as const;

// ---------------------------------------------------------------------------
// Score Ticker
// ---------------------------------------------------------------------------

function ScoreTicker({
  games,
  onGameClick,
}: {
  games: TickerGame[];
  onGameClick?: (sport: string, gameId: string) => void;
}) {
  if (!games.length) return null;

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
      <div className="ticker-track flex items-center whitespace-nowrap py-3">
        {doubled.map((g, i) => {
          const rawStatus = g.status;
          const statusStr = (typeof rawStatus === 'string' ? rawStatus : typeof rawStatus === 'object' && rawStatus !== null ? String((rawStatus as Record<string, unknown>).detailedState ?? (rawStatus as Record<string, unknown>).state ?? '') : '').toLowerCase();
          const isLive = statusStr.includes('live') ||
                         statusStr.includes('in progress') ||
                         statusStr.includes('top') ||
                         statusStr.includes('bot') ||
                         statusStr === 'in';
          const isFinal = statusStr.includes('final') || statusStr === 'post';
          const displayStatus = typeof g.status === 'string' ? g.status : statusStr;
          const canClick = !!g.id && !!onGameClick;

          // Use abbreviation if available for tighter ticker display
          const awayName = g.away_team ?? 'TBD';
          const homeName = g.home_team ?? 'TBD';
          const awayScore = g.away_score ?? '-';
          const homeScore = g.home_score ?? '-';

          const scoreContent = (
            <>
              <span
                className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 mr-1.5"
                style={{
                  fontFamily: 'var(--font-oswald)',
                  color: 'var(--bsi-bone)',
                  background: 'rgba(191,87,0,0.3)',
                  borderRadius: '2px',
                }}
              >
                {g.sportShort}
              </span>
              <span className="font-medium text-bsi-dust">{awayName}</span>
              <span className="font-bold tabular-nums mx-0.5" style={{ color: 'var(--bsi-bone)', letterSpacing: '0.02em' }}>{awayScore}</span>
              <span className="mx-0.5 text-bsi-dust/50">@</span>
              <span className="font-medium text-bsi-dust">{homeName}</span>
              <span className="font-bold tabular-nums mx-0.5" style={{ color: 'var(--bsi-bone)', letterSpacing: '0.02em' }}>{homeScore}</span>
              {isLive && (
                <span className="inline-flex items-center gap-1 ml-1.5 px-1.5 py-0.5 rounded-sm" style={{ background: 'rgba(16,185,129,0.1)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color: '#10B981' }}>
                    Live
                  </span>
                </span>
              )}
              {isFinal && (
                <span className="text-[9px] uppercase tracking-wider ml-1.5 font-semibold text-bsi-dust/50">
                  Final
                </span>
              )}
              {!isLive && !isFinal && displayStatus && (
                <span className="text-[9px] uppercase tracking-wider ml-1.5 text-bsi-dust/50">
                  {displayStatus}
                </span>
              )}
            </>
          );

          return (
            <span key={`${g.id ?? i}-${i}`} className="inline-flex items-center shrink-0">
              {i > 0 && (
                <span
                  className="mx-5 text-[10px] text-bsi-primary opacity-60"
                  aria-hidden="true"
                >
                  &#9670;
                </span>
              )}
              {canClick ? (
                <button
                  type="button"
                  onClick={() => onGameClick(g.sport, g.id!)}
                  className="inline-flex items-center gap-1.5 text-[13px] transition-colors hover:text-bsi-primary cursor-pointer font-mono text-bsi-bone" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {scoreContent}
                </button>
              ) : (
                <Link
                  href={`/${g.sport}/`}
                  className="inline-flex items-center gap-1.5 text-[13px] transition-colors hover:text-bsi-primary font-mono text-bsi-bone" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {scoreContent}
                </Link>
              )}
            </span>
          );
        })}
      </div>

      <div
        className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, var(--surface-dugout), transparent)' }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, var(--surface-dugout), transparent)' }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sport Pulse Strip — live game counts across all 5 sports
// ---------------------------------------------------------------------------

function SportPulseStrip({ pulse }: { pulse: Record<string, SportPulseData> }) {
  const hasSomeData = Object.values(pulse).some((p) => p.total > 0);

  if (!hasSomeData) return null;

  return (
    <div
      className="relative"
      style={{
        background: 'var(--surface-press-box)',
        borderBottom: '1px solid var(--border-vintage)',
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div
          className="flex items-center overflow-x-auto no-scrollbar"
          style={{ gap: 0 }}
          role="status"
          aria-label="Live game counts across sports"
        >
          {PULSE_SPORTS.map((sport, idx) => {
            const data = pulse[sport.key];
            const live = data?.live ?? 0;
            const total = data?.total ?? 0;
            const hasGames = total > 0;

            return (
              <Link
                key={sport.key}
                href={`/${sport.key === 'college-baseball' ? 'college-baseball' : sport.key}/`}
                className="flex items-center gap-2.5 py-2.5 shrink-0 transition-colors group"
                style={{
                  paddingLeft: idx === 0 ? 0 : '1rem',
                  paddingRight: '1rem',
                  borderRight: idx < PULSE_SPORTS.length - 1 ? '1px solid rgba(140,98,57,0.15)' : 'none',
                }}
              >
                <span
                  className="text-[10px] uppercase tracking-[0.12em] font-bold whitespace-nowrap transition-colors group-hover:text-bsi-primary"
                  style={{
                    fontFamily: 'var(--font-oswald)',
                    color: hasGames ? 'var(--bsi-bone)' : 'var(--bsi-dust)',
                  }}
                >
                  <span className="hidden sm:inline">{sport.label}</span>
                  <span className="sm:hidden">{sport.short}</span>
                </span>

                {live > 0 ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                    </span>
                    <span
                      className="text-[10px] font-bold tabular-nums font-mono text-success"
                    >
                      {live}
                    </span>
                  </span>
                ) : hasGames ? (
                  <span
                    className="text-[10px] tabular-nums font-mono text-bsi-dust"
                  >
                    {total}
                  </span>
                ) : (
                  <span
                    className="text-[9px] font-mono text-bsi-dust/40"
                  >
                    --
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
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
    <Link href={href} className="block group heritage-card p-5 sm:p-6" style={{ borderLeft: `3px solid ${accentColor}` }}>
      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: accentColor }}
        />
        <span
          className="text-[10px] uppercase tracking-[0.15em] font-semibold font-display text-bsi-dust"
        >
          {label}
        </span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p
            className="text-base sm:text-lg font-bold truncate group-hover:text-bsi-primary transition-colors font-display text-bsi-bone"
          >
            {player.name}
          </p>
          <p
            className="text-[11px] mt-0.5 font-mono text-bsi-dust"
          >
            {player.team}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p
            className="text-3xl sm:text-[36px] font-bold tabular-nums leading-none font-mono"
            style={{ color: accentColor }}
          >
            {statValue}
          </p>
          <p
            className="text-[9px] uppercase tracking-wider mt-1 font-mono text-bsi-dust"
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
            className="text-[10px] tabular-nums font-mono text-bsi-dust"
          >
            {s.value} <span className="text-bsi-dust">{s.label}</span>
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
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{
          background: 'var(--surface-press-box)',
          borderBottom: '2px solid var(--bsi-primary)',
        }}
      >
        <h2
          className="text-xs uppercase tracking-[0.15em] font-bold font-display text-bsi-primary"
        >
          {title}
        </h2>
        <Link
          href={href}
          className="text-[10px] uppercase tracking-wider transition-colors hover:text-bsi-primary font-mono text-bsi-dust"
        >
          Full board &rarr;
        </Link>
      </div>

      <div
        className="border border-t-0 overflow-x-auto"
        style={{ borderColor: 'var(--border-vintage)', borderRadius: '0 0 2px 2px' }}
      >
        <table className="w-full text-[11px] font-mono">
          <thead>
            <tr style={{ background: 'rgba(17,17,17,0.5)' }}>
              <th
                className="text-left pl-4 pr-1 py-2 font-semibold font-display"
                style={{ color: 'var(--bsi-dust)', fontSize: '9px' }}
              >
                #
              </th>
              <th
                className="text-left px-1 py-2 font-semibold font-display"
                style={{ color: 'var(--bsi-dust)', fontSize: '9px' }}
              >
                PLAYER
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-right px-2 py-2 font-semibold"
                  style={{
                    color: col.accent ? 'var(--bsi-primary-light)' : 'var(--bsi-dust)',
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
            {data.slice(0, 5).map((row, idx) => (
              <tr
                key={row.player_id ?? idx}
                className="border-t transition-colors duration-100"
                style={{
                  borderColor: 'rgba(196,184,165,0.06)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(191,87,0,0.04)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td className="pl-4 pr-1 py-2 tabular-nums text-bsi-dust">
                  {idx + 1}
                </td>
                <td className="px-1 py-2 max-w-[180px]">
                  <Link
                    href={row.player_id ? `/college-baseball/savant/player/${row.player_id}/` : '#'}
                    className="transition-colors duration-100 hover:text-bsi-primary text-bsi-bone"
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

      {meta && (
        <div
          className="flex items-center justify-between px-4 py-1.5 text-[9px] font-mono text-bsi-dust"
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
// Skeletons
// ---------------------------------------------------------------------------

function TableSkeleton() {
  return (
    <div>
      <div
        className="h-10 bg-surface-press-box"
        style={{ borderBottom: '2px solid rgba(191,87,0,0.3)' }}
      />
      <div className="border border-t-0 overflow-hidden animate-pulse border-border-vintage">
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
// Empty / Error States
// ---------------------------------------------------------------------------

function LeaderboardEmpty({ title, error, onRetry }: { title: string; error?: string | null; onRetry?: () => void }) {
  return (
    <div>
      <div
        className="flex items-center justify-between px-4 py-2.5 bg-surface-press-box"
        style={{ borderBottom: '2px solid rgba(191,87,0,0.3)' }}
      >
        <h2
          className="text-xs uppercase tracking-[0.15em] font-bold font-display text-bsi-primary"
        >{title}</h2>
      </div>
      <div className="border border-t-0 px-4 py-8 text-center border-border-vintage">
        <p className="text-xs font-mono text-bsi-dust">
          {error ? 'Data temporarily unavailable' : 'No leaderboard data available'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 text-[10px] uppercase tracking-wider px-3 py-1.5 border rounded-sm transition-colors hover:bg-[rgba(191,87,0,0.08)] hover:border-bsi-primary font-mono"
            style={{ color: 'var(--bsi-primary)', borderColor: 'rgba(191,87,0,0.3)' }}
          >Retry</button>
        )}
      </div>
    </div>
  );
}

function StandoutEmpty() {
  return (
    <div className="heritage-card p-5 flex items-center justify-center" style={{ minHeight: '120px' }}>
      <p className="text-[10px] uppercase tracking-wider font-mono text-bsi-dust">
        Updating player data...
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// News Card
// ---------------------------------------------------------------------------

function NewsCard({ article, sport }: { article: NewsArticle; sport: string }) {
  const sportLabel = SPORT_LABELS[sport] ?? sport.toUpperCase();
  const imgUrl = article.images?.[0]?.url;

  return (
    <a
      href={article.link ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="group heritage-card overflow-hidden flex flex-col"
    >
      {imgUrl && (
        <div
          className="relative h-32 sm:h-36 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(191,87,0,0.12) 0%, var(--surface-dugout) 100%)' }}
        >
          <img
            src={imgUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            style={{ filter: 'brightness(0.8) saturate(0.9)' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(22,22,22,0.9) 0%, transparent 60%)' }}
          />
          <span
            className="absolute bottom-2 left-3 text-[9px] uppercase tracking-[0.15em] font-bold px-1.5 py-0.5"
            style={{
              fontFamily: 'var(--font-oswald)',
              color: 'var(--bsi-bone)',
              background: 'var(--bsi-primary)',
            }}
          >
            {sportLabel}
          </span>
        </div>
      )}
      {!imgUrl && (
        <div className="px-3 pt-3">
          <span
            className="text-[9px] uppercase tracking-[0.15em] font-bold px-1.5 py-0.5 inline-block mb-2"
            style={{
              fontFamily: 'var(--font-oswald)',
              color: 'var(--bsi-bone)',
              background: 'var(--bsi-primary)',
            }}
          >
            {sportLabel}
          </span>
        </div>
      )}
      <div className="px-3 pb-3 pt-2 flex-1">
        <p
          className="text-xs sm:text-sm font-semibold leading-snug line-clamp-2 group-hover:text-bsi-primary transition-colors font-display text-bsi-bone"
        >
          {article.headline}
        </p>
      </div>
    </a>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export function HomePageClient() {
  // Core data fetches — Savant leaderboards + college baseball scores (ticker)
  const { data: battingRes, loading: battingLoading, error: battingError, retry: retryBatting } =
    useSportData<LeaderboardResponse>('/api/savant/batting/leaderboard?limit=50', { refreshInterval: 300_000 });
  const { data: pitchingRes, loading: pitchingLoading, error: pitchingError, retry: retryPitching } =
    useSportData<LeaderboardResponse>('/api/savant/pitching/leaderboard?limit=50', { refreshInterval: 300_000 });
  const { data: scoresRes } =
    useSportData<ScoresResponse>('/api/college-baseball/scores', { refreshInterval: 30_000 });
  const { data: newsRes } =
    useSportData<NewsBucket[]>('/api/intel/news', { refreshInterval: 600_000 });

  // Multi-sport score fetches for pulse strip
  const { data: mlbScoresRes } =
    useSportData<ScoresResponse>('/api/mlb/scores', { refreshInterval: 60_000 });
  const { data: nflScoresRes } =
    useSportData<ScoresResponse>('/api/nfl/scores', { refreshInterval: 60_000 });
  const { data: nbaScoresRes } =
    useSportData<ScoresResponse>('/api/nba/scores', { refreshInterval: 60_000 });
  const { data: cfbScoresRes } =
    useSportData<ScoresResponse>('/api/cfb/scores', { refreshInterval: 60_000 });

  const batters = battingRes?.data ?? [];
  const pitchers = pitchingRes?.data ?? [];
  const games: ScoreGame[] = scoresRes?.games ?? scoresRes?.data ?? [];

  // Derived: multi-sport ticker games — interleaved round-robin, live games first
  const tickerGames = useMemo<TickerGame[]>(() => {
    const tag = (res: ScoresResponse | null, sport: string, short: string): TickerGame[] =>
      (res?.games ?? res?.data ?? []).map((g) => ({ ...normalizeTickerGame(g), sport, sportShort: short }));

    const buckets = [
      tag(scoresRes, 'college-baseball', 'CBB'),
      tag(mlbScoresRes, 'mlb', 'MLB'),
      tag(nflScoresRes, 'nfl', 'NFL'),
      tag(nbaScoresRes, 'nba', 'NBA'),
      tag(cfbScoresRes, 'cfb', 'CFB'),
    ].filter((b) => b.length > 0);

    // Sort each bucket: live games first
    const isLive = (g: TickerGame) => {
      const raw = g.status;
      const s = (typeof raw === 'string' ? raw : typeof raw === 'object' && raw !== null ? String((raw as Record<string, unknown>).detailedState ?? (raw as Record<string, unknown>).state ?? '') : '').toLowerCase();
      return s.includes('live') || s.includes('in progress') || s.includes('top') || s.includes('bot');
    };
    for (const bucket of buckets) {
      bucket.sort((a, b) => (isLive(b) ? 1 : 0) - (isLive(a) ? 1 : 0));
    }

    // Round-robin interleave
    const result: TickerGame[] = [];
    const maxLen = Math.max(...buckets.map((b) => b.length), 0);
    for (let i = 0; i < maxLen; i++) {
      for (const bucket of buckets) {
        if (i < bucket.length) result.push(bucket[i]);
      }
    }
    return result;
  }, [scoresRes, mlbScoresRes, nflScoresRes, nbaScoresRes, cfbScoresRes]);

  // Derived: sport pulse — aggregated live/total counts per sport
  const sportPulse = useMemo<Record<string, SportPulseData>>(() => ({
    'college-baseball': countGames(scoresRes),
    mlb: countGames(mlbScoresRes),
    nfl: countGames(nflScoresRes),
    nba: countGames(nbaScoresRes),
    cfb: countGames(cfbScoresRes),
  }), [scoresRes, mlbScoresRes, nflScoresRes, nbaScoresRes, cfbScoresRes]);

  // Derived: total live count across all sports (for hero badge)
  const totalLiveCount = useMemo(() => {
    return Object.values(sportPulse).reduce((sum, p) => sum + p.live, 0);
  }, [sportPulse]);

  // Derived: news articles — pick top 2 per sport, max 6 total
  // Normalize links: ESPN returns nested links.web.href, not flat link field
  const newsArticles = useMemo(() => {
    if (!Array.isArray(newsRes)) return [];
    const articles: { article: NewsArticle; sport: string }[] = [];
    for (const bucket of newsRes) {
      const sport = bucket.sport;
      const items = bucket.data?.articles ?? [];
      for (const a of items.slice(0, 2)) {
        if (a.headline) {
          const raw = a as Record<string, unknown>;
          const link =
            (typeof raw.link === 'string' && raw.link) ||
            (((raw.links as Record<string, unknown>)?.web as Record<string, unknown>)?.href as string) ||
            undefined;
          articles.push({ article: { ...a, link }, sport });
        }
      }
    }
    return articles.slice(0, 6);
  }, [newsRes]);

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

  // Game preview modal state
  const [previewTarget, setPreviewTarget] = useState<{ sport: string; gameId: string } | null>(null);
  const handleGameClick = useCallback((sport: string, gameId: string) => {
    setPreviewTarget({ sport, gameId });
  }, []);

  return (
    <div className="min-h-screen bg-surface-scoreboard">

      {/* ================================================================= */}
      {/* MODE: LANDING PAGE — Selling zone. Hero + pitch + proof points.   */}
      {/* Everything above the threshold answers "What is this?"            */}
      {/* ================================================================= */}

      {/* HERO — Full-viewport poster with cinematic Ken Burns zoom.       */}
      <section
        className="relative overflow-hidden flex items-center"
        style={{
          background: 'var(--surface-scoreboard)',
          minHeight: '80vh',
        }}
      >
        {/* Hero backdrop — Ken Burns slow zoom for cinematic depth */}
        <img
          src="/images/brand/bsi-hero-backdrop.webp"
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none hero-ken-burns"
          style={{ opacity: 0.35 }}
        />

        {/* Atmospheric overlays — warm glow centered on headline area */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(191,87,0,0.12) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(
              to bottom,
              rgba(10,10,10,0.3) 0%,
              rgba(10,10,10,0.05) 30%,
              rgba(10,10,10,0.25) 65%,
              var(--surface-scoreboard) 100%
            )`,
          }}
        />
        <div className="absolute inset-0 pointer-events-none grain-overlay" style={{ opacity: 0.2 }} />

        {/* Hero content — centered, poster-grade, cinematic stagger */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-24 md:py-32 text-center">
          {/* Shield logo */}
          <div className="hero-entrance flex justify-center mb-8" style={{ animationDelay: '0ms' }}>
            <Image
              src="/images/brand/bsi-logo-primary.webp"
              alt="Blaze Sports Intel"
              width={160}
              height={160}
              className="w-[80px] sm:w-[100px] md:w-[120px] h-auto drop-shadow-[0_0_80px_rgba(191,87,0,0.3)]"
              priority
            />
          </div>

          {/* Headline — poster scale */}
          <div className="hero-entrance" style={{ animationDelay: '200ms' }}>
            <h1
              className="font-bold uppercase leading-[0.92] tracking-wide"
              style={{
                fontFamily: 'var(--font-bebas)',
                color: 'var(--bsi-bone)',
                fontSize: 'clamp(2.5rem, 8vw, 5.5rem)',
              }}
            >
              Sports Intelligence,{' '}
              <span className="text-bsi-primary">Put Simply</span>
            </h1>
          </div>

          {/* Tagline */}
          <div className="hero-entrance" style={{ animationDelay: '400ms' }}>
            <p
              className="mt-4 sm:mt-5 text-base sm:text-lg md:text-xl italic tracking-wide"
              style={{
                fontFamily: 'var(--font-cormorant)',
                color: 'var(--bsi-primary)',
              }}
            >
              Born to Blaze the Path Beaten Less
            </p>
          </div>

          {/* Supporting line */}
          <div className="hero-entrance" style={{ animationDelay: '600ms' }}>
            <p
              className="mt-5 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto font-serif text-bsi-dust leading-[1.7]"
            >
              The numbers behind what your eyes already tell you — translated
              across college baseball, MLB, NFL, NBA, and college football.
            </p>
          </div>

          {/* Action row — centered */}
          <div className="hero-entrance flex flex-wrap items-center justify-center gap-4 mt-10" style={{ animationDelay: '800ms' }}>
            <Link
              href="/scores/"
              className="btn-heritage-fill text-xs sm:text-sm uppercase tracking-wider px-7 py-3 font-display"
            >
              Live Scores
            </Link>
            <Link
              href="/college-baseball/savant/"
              className="btn-heritage text-xs sm:text-sm uppercase tracking-wider px-7 py-3 font-display"
            >
              BSI Savant
            </Link>

            {/* Live badge */}
            {totalLiveCount > 0 && (
              <span
                className="inline-flex items-center gap-2 px-3 py-2 rounded-sm border"
                style={{
                  borderColor: 'rgba(16,185,129,0.3)',
                  background: 'rgba(16,185,129,0.06)',
                }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <DataTransition value={totalLiveCount} mode="flip">
                  <span
                    className="text-[10px] uppercase tracking-wider font-semibold font-mono text-success"
                  >
                    {totalLiveCount} live
                  </span>
                </DataTransition>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* SCORE TICKER */}
      <DataErrorBoundary name="ScoreTicker" compact>
        <ScoreTicker games={tickerGames} onGameClick={handleGameClick} />
      </DataErrorBoundary>

      {/* SPORT PULSE — Live game counts across all 5 sports */}
      <DataErrorBoundary name="SportPulse" compact>
        <SportPulseStrip pulse={sportPulse} />
      </DataErrorBoundary>

      {/* VALUE PROPOSITION — Full-width pitch. Multi-sport, not CBB-only.   */}
      <section
        className="relative"
        style={{
          borderTop: '1px solid var(--border-vintage)',
          background: 'linear-gradient(180deg, var(--surface-press-box) 0%, var(--surface-scoreboard) 100%)',
        }}
      >
        <ScrollReveal as="div" className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-28">
          <div
            className="section-rule-thick mb-8"
            style={{ width: '3.5rem' }}
          />
          <h2
            className="text-2xl sm:text-3xl md:text-[2.75rem] font-bold uppercase leading-tight font-display text-bsi-bone tracking-[0.02em]"
          >
            Five Sports. One Language.{' '}
            <span className="text-bsi-primary">Yours.</span>
          </h2>
          <p
            className="mt-6 text-base sm:text-lg md:text-xl leading-relaxed font-serif text-bsi-dust leading-[1.8]"
          >
            College baseball, MLB, NFL, NBA, and college football — with the analytical
            depth that mainstream sports media skip. The numbers behind what your eyes already
            tell you, recalculated every six hours and translated so you don&apos;t need a statistics degree.
          </p>

          {/* Proof points — inline, not cards */}
          <div
            className="mt-10 pt-8 border-t flex flex-wrap gap-x-12 gap-y-6"
            style={{ borderColor: 'rgba(140,98,57,0.2)' }}
          >
            {[
              { stat: '5', label: 'Sports Covered' },
              { stat: '330', label: 'D1 Programs' },
              { stat: '6hr', label: 'Recompute Cycle' },
              { stat: '1,900+', label: 'Players Tracked' },
            ].map((p, idx) => (
              <div key={p.label} className="hero-entrance" style={{ animationDelay: `${idx * 100}ms` }}>
                <span
                  className="text-2xl sm:text-3xl md:text-4xl font-bold tabular-nums font-mono text-bsi-primary"
                >
                  {p.stat}
                </span>
                <span
                  className="block text-[10px] sm:text-[11px] uppercase tracking-[0.15em] mt-1.5 font-display text-bsi-dust"
                >
                  {p.label}
                </span>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* SPORT NAVIGATION — Organized by sport, not by feature              */}
      <section
        className="relative"
        style={{ borderTop: '1px solid var(--border-vintage)' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
          <ScrollReveal stagger>
            {/* Flagship sport — College Baseball gets hero treatment */}
            <Link
              href={SPORT_NAV[0].href}
              className="group block heritage-card overflow-hidden mb-5 transition-all duration-300 hover:border-bsi-primary"
              style={{ borderLeft: `3px solid ${SPORT_NAV[0].accent}` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 sm:p-7">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3
                      className="text-lg sm:text-xl font-bold uppercase tracking-[0.04em] transition-colors group-hover:text-bsi-primary font-display text-bsi-bone"
                    >
                      {SPORT_NAV[0].name}
                    </h3>
                    {SPORT_NAV[0].badge && (
                      <span
                        className="text-[8px] uppercase tracking-[0.15em] font-bold px-2 py-0.5 shrink-0"
                        style={{
                          fontFamily: 'var(--font-oswald)',
                          color: 'var(--bsi-bone)',
                          background: 'var(--bsi-primary)',
                        }}
                      >
                        {SPORT_NAV[0].badge}
                      </span>
                    )}
                  </div>
                  <p
                    className="text-sm leading-relaxed font-serif text-bsi-dust leading-[1.6]"
                  >
                    {SPORT_NAV[0].desc}
                  </p>
                </div>

                {/* Live indicator for flagship */}
                <div className="flex items-center gap-4 shrink-0">
                  {sportPulse['college-baseball']?.live > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                      </span>
                      <span
                        className="text-[10px] font-bold tabular-nums font-mono text-success"
                      >
                        {sportPulse['college-baseball'].live} live
                      </span>
                    </span>
                  )}
                  <span
                    className="text-[10px] uppercase tracking-wider transition-colors group-hover:text-bsi-primary font-mono text-bsi-dust"
                  >
                    Explore &rarr;
                  </span>
                </div>
              </div>
            </Link>

            {/* Other 4 sports — compact row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {SPORT_NAV.slice(1).map((sport) => {
                const pulseData = sportPulse[sport.key];
                return (
                  <Link
                    key={sport.key}
                    href={sport.href}
                    className="group block heritage-card p-4 sm:p-5 transition-all duration-300"
                    style={{ borderTop: `2px solid ${sport.accent}`, willChange: 'transform' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3
                        className="text-sm font-bold uppercase tracking-[0.06em] transition-colors"
                        style={{
                          fontFamily: 'var(--font-oswald)',
                          color: 'var(--bsi-bone)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = sport.accent)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--bsi-bone)')}
                      >
                        {sport.name}
                      </h3>
                      {pulseData?.live > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span
                            className="text-[9px] font-bold tabular-nums font-mono text-success"
                          >
                            {pulseData.live}
                          </span>
                        </span>
                      )}
                    </div>
                    <p
                      className="text-[11px] leading-snug line-clamp-2 font-serif text-bsi-dust leading-[1.5]"
                    >
                      {sport.desc}
                    </p>
                  </Link>
                );
              })}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ================================================================= */}
      {/* MODE THRESHOLD — Deliberate visual break between sell and serve    */}
      {/* ================================================================= */}
      <div
        className="relative"
        style={{
          height: '3px',
          background: 'linear-gradient(90deg, transparent 5%, var(--bsi-primary) 20%, var(--bsi-primary) 80%, transparent 95%)',
        }}
        aria-hidden="true"
      />

      {/* ================================================================= */}
      {/* MODE: DASHBOARD PROOF — Serving zone. Data proves the pitch.      */}
      {/* Components here are previews, not product.                         */}
      {/* ================================================================= */}

      {/* SAVANT PROOF — Standout players + capped leaderboards prove depth  */}
      <section
        className="relative"
        style={{
          background: 'var(--surface-scoreboard)',
          borderBottom: '1px solid var(--border-vintage)',
        }}
      >
        <ScrollReveal as="div" className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2
                className="text-xl sm:text-2xl md:text-3xl font-bold uppercase font-display text-bsi-bone tracking-[0.02em]"
              >
                The BSI Savant Standard
              </h2>
              <p
                className="text-xs sm:text-sm mt-1.5 font-serif text-bsi-dust"
              >
                What analytical depth actually looks like — live from the leaderboard
              </p>
            </div>
            <Link
              href="/college-baseball/savant/"
              className="btn-heritage text-[10px] uppercase tracking-wider px-4 py-2 shrink-0 font-display"
            >
              Full leaderboard &rarr;
            </Link>
          </div>

          {/* Standout cards — top hitter + top pitcher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
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
            <DataErrorBoundary name="TopPitcher" compact>
              {pitchingLoading ? (
                <StandoutSkeleton />
              ) : topPitcher ? (
                <StandoutCard
                  label="Top Pitcher"
                  accentColor="var(--heritage-columbia-blue)"
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
          </div>

          {/* Capped leaderboard preview — 5 rows, not 10 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
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

            <div
              className="col-span-full my-1 border-t lg:hidden border-border-vintage"
            />

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
          </div>
        </ScrollReveal>
      </section>

      {/* Quick links — key BSI tools below the leaderboard proof */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { title: 'Live Scores', href: '/scores/', desc: 'All sports, real-time' },
            { title: 'Player Search', href: '/college-baseball/players/', desc: 'Find any D1 player' },
            { title: 'Compare', href: '/college-baseball/compare/', desc: 'Head-to-head analysis' },
            { title: 'Ask BSI', href: '/ask/', desc: 'AI-powered analysis' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group heritage-card px-4 py-3.5 transition-all duration-200 block hover:bg-[rgba(191,87,0,0.04)]"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0 transition-colors group-hover:bg-bsi-primary"
                  style={{ background: 'rgba(191,87,0,0.4)' }}
                />
                <p
                  className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.1em] transition-colors group-hover:text-bsi-primary font-display text-bsi-dust"
                >
                  {item.title}
                </p>
              </div>
              <p
                className="text-[9px] sm:text-[10px] mt-1 ml-3.5 font-mono text-bsi-dust/50"
              >
                {item.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ================================================================= */}
      {/* MULTI-SPORT NEWS                                                   */}
      {/* ================================================================= */}
      {newsArticles.length > 0 && (
        <section
          className="relative"
          style={{ borderTop: '1px solid var(--border-vintage)' }}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
            <div className="flex items-center justify-between mb-5">
              <h2
                className="text-xs uppercase tracking-[0.15em] font-bold font-display text-bsi-primary"
              >
                Across the Wire
              </h2>
              <Link
                href="/intel/"
                className="text-[10px] uppercase tracking-wider transition-colors hover:text-bsi-primary font-mono text-bsi-dust"
              >
                All intel &rarr;
              </Link>
            </div>
            <ScrollReveal stagger>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {newsArticles.map(({ article, sport }, idx) => (
                  <NewsCard key={`${sport}-${idx}`} article={article} sport={sport} />
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ================================================================= */}
      {/* CLOSING CTA                                                        */}
      {/* ================================================================= */}
      <section
        className="relative"
        style={{
          borderTop: '1px solid var(--border-vintage)',
          background: 'var(--surface-press-box)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 90% at 50% 40%, rgba(191,87,0,0.06) 0%, transparent 70%)' }}
        />
        <div className="absolute inset-0 pointer-events-none grain-overlay" style={{ opacity: 0.15 }} />
        <ScrollReveal as="div" direction="fade" className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 md:py-28 text-center">
          <h2
            className="text-xl sm:text-2xl md:text-[2.25rem] font-bold uppercase font-display text-bsi-bone tracking-[0.02em]"
          >
            The Numbers Behind What You Already Know.
          </h2>
          <p
            className="mt-2 text-sm sm:text-base uppercase tracking-[0.12em] font-display text-bsi-primary"
          >
            No paywall.
          </p>
          <p
            className="mt-4 text-sm sm:text-base max-w-lg mx-auto font-serif text-bsi-dust leading-[1.7]"
          >
            Live scores, advanced analytics, and scouting intel across college baseball,
            MLB, NFL, NBA, and college football — updating now.
          </p>
          <div className="flex items-center justify-center gap-4 mt-10">
            <Link
              href="/scores/"
              className="btn-heritage-fill text-xs sm:text-sm uppercase tracking-wider px-7 py-3.5 font-display"
            >
              Live Scores
            </Link>
            <Link
              href="/college-baseball/savant/"
              className="btn-heritage text-xs sm:text-sm uppercase tracking-wider px-7 py-3.5 font-display"
            >
              BSI Savant
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* BRAND FOOTER STRIP */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div
          className="flex items-center justify-center gap-5 py-5 border-t"
          style={{ borderColor: 'rgba(196,184,165,0.1)' }}
        >
          <Image
            src="/brand/blaze-roundel.png"
            alt="Blaze Intelligence roundel"
            width={44}
            height={44}
            className="w-10 h-10 sm:w-11 sm:h-11 opacity-75 object-contain"
          />
          <div>
            <p
              className="text-[10px] uppercase tracking-[0.2em] font-semibold font-display text-bsi-dust"
            >
              Blaze Intelligence
            </p>
            <p
              className="text-[9px] mt-0.5 font-mono text-bsi-dust"
            >
              5 sports &middot; 330 programs &middot; recalculated every 6 hours
            </p>
          </div>
        </div>
      </section>

      {/* GAME PREVIEW MODAL */}
      {previewTarget && (
        <GamePreviewModal
          sport={previewTarget.sport}
          gameId={previewTarget.gameId}
          onClose={() => setPreviewTarget(null)}
        />
      )}
    </div>
  );
}
