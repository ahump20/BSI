'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { DataAttribution } from '@/components/ui/DataAttribution';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { ScrollReveal } from '@/components/cinematic';
import type { DataMeta } from '@/lib/types/data-meta';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PowerRanking {
  rank: number;
  team: string;
  abbreviation: string;
  id: string;
  logo: string;
  league: 'AL' | 'NL' | string;
  division: string;
  wins: number;
  losses: number;
  winPct: number;
  runsScored: number;
  runsAllowed: number;
  runDiff: number;
  runDiffPerGame: number;
  pythagoreanWinPct: number;
  compositeScore: number;
  streak: string;
  last10: string;
}

interface PowerRankingsResponse {
  rankings?: PowerRanking[];
  computedAt?: string;
  season?: number;
  methodology?: string;
  totalTeams?: number;
  emptyReason?: string;
  meta?: DataMeta;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPct(pct: number): string {
  return pct.toFixed(3).replace(/^0/, '');
}

function formatSigned(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

function compositeColor(score: number): string {
  // Map composite score (0-100) to a color temperature.
  // Elite (70+): burnt-orange, Strong (55-70): bone, Average (45-55): dust, Weak (<45): muted
  if (score >= 70) return 'var(--bsi-primary)';
  if (score >= 55) return 'var(--bsi-bone)';
  if (score >= 45) return 'var(--bsi-dust)';
  return 'rgba(196, 184, 165, 0.5)';
}

function streakColor(streak: string): string {
  if (!streak) return 'var(--bsi-dust)';
  if (streak.startsWith('W')) return 'var(--heritage-columbia-blue)';
  if (streak.startsWith('L')) return '#ef4444';
  return 'var(--bsi-dust)';
}

// ---------------------------------------------------------------------------
// Team Row
// ---------------------------------------------------------------------------

/**
 * Luck dash — tiny horizontal gauge showing actual win% vs pythagorean.
 * Above the zero line (burnt-orange) = outrunning run diff (due for regression).
 * Below the zero line (columbia blue) = unlucky (positive regression coming).
 * Magnitude is capped at ±0.15 for visual range.
 */
function LuckDash({ actual, pythag }: { actual: number; pythag: number }) {
  const delta = actual - pythag;
  const CAP = 0.15;
  const clamped = Math.max(-CAP, Math.min(CAP, delta));
  // Map clamped delta to [-50%, +50%] offset from center (0%)
  const offsetPct = (clamped / CAP) * 50;
  const color =
    delta > 0.02
      ? 'var(--bsi-primary)'
      : delta < -0.02
        ? 'var(--heritage-columbia-blue)'
        : 'var(--bsi-dust)';
  const label = `Luck ${delta > 0 ? '+' : ''}${(delta * 1000).toFixed(0)} — ${
    delta > 0.02 ? 'outrunning run diff' : delta < -0.02 ? 'unlucky' : 'neutral'
  }`;

  return (
    <div
      className="relative h-4 w-full"
      title={label}
      aria-label={label}
    >
      {/* Zero line */}
      <div
        className="absolute left-1/2 top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2"
        style={{ backgroundColor: 'var(--border-vintage)' }}
      />
      {/* Dash */}
      <div
        className="absolute top-1/2 h-0.5 w-2 -translate-y-1/2 transition-all duration-500"
        style={{
          left: `calc(50% + ${offsetPct}%)`,
          transform: `translate(-50%, -50%)`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}

/**
 * Power bar — horizontal fill proportional to composite ÷ 100.
 * The number floats at the fill tip. Bar IS the viz — row order
 * and magnitude read simultaneously.
 */
function PowerBar({ score }: { score: number }) {
  const widthPct = Math.max(0, Math.min(100, score));
  const color = compositeColor(score);
  return (
    <div
      className="relative h-5 w-full overflow-hidden rounded-sm"
      style={{ backgroundColor: 'var(--surface-press-box)' }}
    >
      <div
        className="absolute left-0 top-0 h-full transition-all duration-700"
        style={{
          width: `${widthPct}%`,
          backgroundColor: color,
          opacity: 0.35,
        }}
      />
      <div
        className="absolute left-0 top-0 flex h-full w-full items-center justify-end px-2"
      >
        <span
          className="font-mono text-[11px] font-bold tabular-nums sm:text-xs"
          style={{ color }}
        >
          {score.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

function TeamRow({ team }: { team: PowerRanking }) {
  const isTop5 = team.rank <= 5;
  const isBottom5 = team.rank >= 26;
  const runDiffText = formatSigned(team.runDiff);

  return (
    <div
      className={`group grid items-center gap-2 px-3 py-2.5 transition-colors duration-200 sm:gap-3 ${
        isTop5 ? 'ring-1 ring-inset ring-[var(--bsi-primary)]/25' : ''
      }`}
      style={{
        backgroundColor: isTop5
          ? 'rgba(191, 87, 0, 0.06)'
          : isBottom5
            ? 'rgba(22, 22, 22, 0.6)'
            : 'var(--surface-dugout)',
        gridTemplateColumns:
          '2rem minmax(140px,1fr) 3rem 3.5rem 3.5rem 4rem minmax(120px,1fr)',
      }}
    >
      {/* Rank */}
      <div
        className="flex h-7 w-7 items-center justify-center rounded-sm font-mono text-xs font-bold tabular-nums sm:h-8 sm:w-8 sm:text-sm"
        style={{
          backgroundColor: isTop5 ? 'var(--bsi-primary)' : 'var(--surface-press-box)',
          color: isTop5 ? 'var(--surface-scoreboard)' : 'var(--bsi-bone)',
        }}
      >
        {team.rank}
      </div>

      {/* Team name + logo */}
      <div className="flex min-w-0 items-center gap-2">
        {team.logo ? (
          <Image
            src={team.logo}
            alt=""
            width={20}
            height={20}
            className="shrink-0 rounded-sm sm:h-6 sm:w-6"
            unoptimized
          />
        ) : (
          <div className="h-5 w-5 shrink-0 rounded-sm bg-surface-press-box sm:h-6 sm:w-6" />
        )}
        <span className="min-w-0 truncate text-xs font-medium sm:text-sm text-bsi-bone">
          {team.team}
          <span className="ml-2 hidden shrink-0 text-[9px] font-mono uppercase text-bsi-dust sm:inline">
            {team.division}
          </span>
        </span>
      </div>

      {/* W-L */}
      <div className="text-right font-mono text-[11px] tabular-nums sm:text-xs text-bsi-dust">
        {team.wins}-{team.losses}
      </div>

      {/* Win Pct */}
      <div className="hidden text-right font-mono text-[11px] tabular-nums md:block text-bsi-dust">
        {formatPct(team.winPct)}
      </div>

      {/* Run differential */}
      <div
        className="text-right font-mono text-[11px] font-semibold tabular-nums sm:text-xs"
        style={{
          color:
            team.runDiff > 0
              ? 'var(--heritage-columbia-blue)'
              : team.runDiff < 0
                ? '#ef4444'
                : 'var(--bsi-dust)',
        }}
      >
        {runDiffText}
      </div>

      {/* Luck dash — replaces the redundant pythag column */}
      <div className="hidden px-1 lg:block">
        <LuckDash actual={team.winPct} pythag={team.pythagoreanWinPct} />
      </div>

      {/* Power bar — the viz anchor */}
      <PowerBar score={team.compositeScore} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Column Header
// ---------------------------------------------------------------------------

function ColumnHeader() {
  return (
    <div
      className="grid items-center gap-2 px-3 py-2 text-[9px] font-bold uppercase tracking-widest sm:gap-3 sm:text-[10px]"
      style={{
        backgroundColor: 'var(--surface-press-box)',
        color: 'var(--bsi-dust)',
        gridTemplateColumns:
          '2rem minmax(140px,1fr) 3rem 3.5rem 3.5rem 4rem minmax(120px,1fr)',
      }}
    >
      <span className="text-center">#</span>
      <span>Team</span>
      <span className="text-right">W-L</span>
      <span className="hidden text-right md:block">Pct</span>
      <span className="text-right">Diff</span>
      <span
        className="hidden text-center lg:block"
        title="Actual win% minus pythagorean — above line means outrunning run diff"
      >
        Luck
      </span>
      <span className="text-right" title="Composite power index, 50/30/20 weights">
        Power
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Methodology Card
// ---------------------------------------------------------------------------

function MethodologyCard({ methodology }: { methodology?: string }) {
  return (
    <div
      className="rounded-sm border-l-2 px-4 py-3"
      style={{
        borderLeftColor: 'var(--bsi-primary)',
        backgroundColor: 'var(--surface-dugout)',
      }}
    >
      <div className="heritage-stamp mb-2" style={{ fontSize: '0.6rem' }}>
        How It Is Computed
      </div>
      <p className="font-body text-[11px] leading-relaxed text-bsi-dust sm:text-xs">
        {methodology ??
          'Composite score blends three signals: 50% actual win percentage, 30% pythagorean expected win percentage (exponent 1.83), and 20% normalized run differential per game. Pythagorean expectation smooths out sequencing luck, so teams that have been lucky or unlucky in close games show up accurately.'}
      </p>
      <p className="mt-2 font-body text-[10px] leading-relaxed text-bsi-dust">
        Early-season samples are noisy. A team with ten games played can move
        dramatically on a single weekend. The ranking will stabilize as the
        season progresses.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top 5 / Bottom 5 Headlines
// ---------------------------------------------------------------------------

function Headlines({ rankings }: { rankings: PowerRanking[] }) {
  if (rankings.length < 5) return null;
  const top5 = rankings.slice(0, 5);
  const bottom5 = rankings.slice(-5).reverse();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Top 5 */}
      <div
        className="rounded-sm border-l-2 p-4"
        style={{
          borderLeftColor: 'var(--bsi-primary)',
          backgroundColor: 'var(--surface-dugout)',
        }}
      >
        <div className="heritage-stamp mb-3" style={{ fontSize: '0.6rem' }}>
          Early Class of the League
        </div>
        <div className="space-y-1.5">
          {top5.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2 text-xs"
            >
              <span
                className="w-4 shrink-0 font-mono text-[11px] font-bold text-bsi-primary"
              >
                {t.rank}
              </span>
              {t.logo && (
                <Image
                  src={t.logo}
                  alt=""
                  width={14}
                  height={14}
                  className="shrink-0"
                  unoptimized
                />
              )}
              <span className="flex-1 truncate text-bsi-bone">{t.team}</span>
              <span className="font-mono text-[10px] tabular-nums text-bsi-dust">
                {t.wins}-{t.losses}
              </span>
              <span
                className="font-mono text-[11px] font-bold tabular-nums"
                style={{ color: compositeColor(t.compositeScore) }}
              >
                {t.compositeScore.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom 5 */}
      <div
        className="rounded-sm border-l-2 p-4"
        style={{
          borderLeftColor: 'rgba(140,98,57,0.35)',
          backgroundColor: 'var(--surface-dugout)',
        }}
      >
        <div className="heritage-stamp mb-3" style={{ fontSize: '0.6rem' }}>
          Early Holes to Dig Out Of
        </div>
        <div className="space-y-1.5">
          {bottom5.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2 text-xs"
            >
              <span
                className="w-4 shrink-0 font-mono text-[11px] font-bold text-bsi-dust"
              >
                {t.rank}
              </span>
              {t.logo && (
                <Image
                  src={t.logo}
                  alt=""
                  width={14}
                  height={14}
                  className="shrink-0 opacity-70"
                  unoptimized
                />
              )}
              <span className="flex-1 truncate text-bsi-dust">{t.team}</span>
              <span className="font-mono text-[10px] tabular-nums text-bsi-dust">
                {t.wins}-{t.losses}
              </span>
              <span
                className="font-mono text-[11px] font-bold tabular-nums"
                style={{ color: compositeColor(t.compositeScore) }}
              >
                {t.compositeScore.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function RankingsLoadingSkeleton() {
  return (
    <div className="space-y-1">
      <Skeleton className="h-10 w-full" height={40} />
      <Skeleton className="h-8 w-full" height={32} />
      {Array.from({ length: 30 }, (_, i) => (
        <Skeleton key={i} className="h-11 w-full" height={44} shimmer />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Client
// ---------------------------------------------------------------------------

export default function PowerRankingsClient() {
  const [data, setData] = useState<PowerRankingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    async function fetchRankings() {
      try {
        const res = await fetch('/api/mlb/power-rankings', {
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = (await res.json()) as PowerRankingsResponse;
        setData(json);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError('Unable to load MLB power rankings.');
        }
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    }

    fetchRankings();
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, []);

  const rankings = useMemo(() => data?.rankings ?? [], [data]);
  const meta = data?.meta ?? null;
  const isEmpty = !loading && rankings.length === 0;

  return (
    <>
      {/* Hero */}
      <Section className="relative overflow-hidden pt-6 pb-0 sm:pt-8">
        <Container>
          {/* Breadcrumb */}
          <nav
            className="mb-3 flex items-center gap-1.5 text-xs sm:mb-4 text-bsi-dust"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="transition-colors hover:underline text-bsi-dust">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/mlb" className="transition-colors hover:underline text-bsi-dust">
              MLB
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-bsi-bone">Power Index</span>
          </nav>

          {/* Title row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-1.5 flex items-center gap-3">
                <Badge variant="primary" size="sm">2026</Badge>
                <Badge variant="outline" size="sm">
                  {rankings.length > 0 ? `${rankings.length} Teams` : 'Loading...'}
                </Badge>
              </div>
              <h1 className="font-heading text-3xl uppercase tracking-tight sm:text-4xl md:text-5xl text-bsi-bone">
                MLB Power Index
              </h1>
              <p className="mt-1 max-w-lg text-xs leading-relaxed sm:text-sm text-bsi-dust">
                Composite ranking for all 30 teams. Computed from actual
                results, pythagorean expectation, and run differential. Not
                borrowed. Earned.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <DataAttribution meta={meta} source="ESPN via BSI" />
            </div>
          </div>
        </Container>
      </Section>

      {/* Methodology + Headlines */}
      <Section className="pt-5 pb-0 sm:pt-6">
        <Container>
          {!loading && rankings.length >= 5 && (
            <div className="mb-4 grid gap-4 sm:mb-5 lg:grid-cols-[1fr_2fr]">
              <MethodologyCard methodology={data?.methodology} />
              <Headlines rankings={rankings} />
            </div>
          )}
        </Container>
      </Section>

      {/* Rankings table */}
      <DataErrorBoundary name="MLB Power Rankings">
        <Section className="pt-5 pb-8 sm:pt-6">
          <Container>
            {loading ? (
              <RankingsLoadingSkeleton />
            ) : error ? (
              <div className="heritage-card flex flex-col items-center justify-center p-8 text-center">
                <p className="text-sm text-bsi-dust">
                  Unable to load MLB power rankings. The upstream standings
                  source may be unavailable.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-heritage mt-3 text-xs"
                >
                  Retry
                </button>
              </div>
            ) : isEmpty ? (
              <div className="heritage-card flex flex-col items-center justify-center p-8 text-center">
                <p className="text-sm text-bsi-dust">
                  {data?.emptyReason ??
                    'No MLB power rankings available yet. Rankings compute after teams play games.'}
                </p>
              </div>
            ) : (
              <div>
                <ColumnHeader />
                <div className="space-y-px">
                  {rankings.map((team) => (
                    <TeamRow key={team.id} team={team} />
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="mt-6 flex flex-wrap gap-2" aria-label="Related pages">
              <Link href="/mlb/standings" className="btn-heritage text-xs">
                Full Standings
              </Link>
              <Link href="/mlb/scores" className="btn-heritage text-xs">
                Today&#39;s Scores
              </Link>
              <Link href="/mlb" className="btn-heritage text-xs">
                MLB Hub
              </Link>
            </nav>
          </Container>
        </Section>
      </DataErrorBoundary>
    </>
  );
}
