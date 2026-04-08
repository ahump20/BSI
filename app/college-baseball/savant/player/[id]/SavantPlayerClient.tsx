'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { PercentileBar } from '@/components/analytics/PercentileBar';
import { MetricGate } from '@/components/analytics/MetricGate';
import { PlayerScoutingComposite } from '@/components/college-baseball/PlayerScoutingComposite';
import { ScrollReveal } from '@/components/cinematic';
import { fmt1, fmt2, fmtPct, fmtInt, fmt3 } from '@/lib/utils/format';
import { teamMetadata, getLogoUrl } from '@/lib/data/team-metadata';
import type { TeamMeta } from '@/lib/data/team-metadata';

// ---------------------------------------------------------------------------
// Types — matched to worker /api/savant/player/:id response shape
// ---------------------------------------------------------------------------

interface BattingStats {
  player_id: string;
  player_name: string;
  team: string;
  conference: string;
  position: string;
  class_year?: string;
  season: number;
  g: number;
  ab: number;
  pa: number;
  h: number;
  hr: number;
  bb: number;
  so: number;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
  k_pct: number;
  bb_pct: number;
  iso: number;
  babip: number;
  woba: number | null;
  wrc_plus: number | null;
  ops_plus: number | null;
  e_ba: number | null;
  e_slg: number | null;
  e_woba: number | null;
  _tier_gated?: boolean;
}

interface PitchingStats {
  player_id: string;
  player_name: string;
  team: string;
  conference: string;
  position: string;
  class_year?: string;
  season: number;
  g: number;
  gs: number;
  w: number;
  l: number;
  sv: number;
  ip: number;
  h: number;
  er: number;
  bb: number;
  hbp: number;
  so: number;
  era: number;
  whip: number;
  k_9: number;
  bb_9: number;
  hr_9: number;
  fip: number | null;
  x_fip: number | null;
  era_minus: number | null;
  k_bb: number | null;
  lob_pct: number | null;
  babip: number;
  _tier_gated?: boolean;
}

interface PercentileData {
  batting: Record<string, number> | null;
  pitching: Record<string, number> | null;
}

interface SavantPlayerPayload {
  player_id: string;
  batting: BattingStats | null;
  pitching: PitchingStats | null;
  type: 'hitter' | 'pitcher' | 'two-way';
  percentiles: PercentileData;
  headshot: string | null;
}

interface SavantPlayerResponse {
  player: SavantPlayerPayload;
  meta: { source: string; fetched_at: string; timezone: string };
}

// ---------------------------------------------------------------------------
// Team identity resolution — matches D1 team name to teamMetadata
// ---------------------------------------------------------------------------

const teamNameIndex = new Map<string, TeamMeta>();

function buildTeamIndex() {
  if (teamNameIndex.size > 0) return;
  for (const [, meta] of Object.entries(teamMetadata)) {
    teamNameIndex.set(meta.name.toLowerCase(), meta);
    teamNameIndex.set(meta.shortName.toLowerCase(), meta);
    teamNameIndex.set(meta.abbreviation.toLowerCase(), meta);
  }
}

function resolveTeamMeta(teamName: string): TeamMeta | null {
  buildTeamIndex();
  const lower = teamName.toLowerCase().trim();
  const exact = teamNameIndex.get(lower);
  if (exact) return exact;
  for (const [, meta] of Object.entries(teamMetadata)) {
    if (
      lower.includes(meta.shortName.toLowerCase()) ||
      meta.name.toLowerCase().includes(lower)
    ) {
      return meta;
    }
  }
  return null;
}

function resolveTeamLogoUrl(teamName: string): string {
  const meta = resolveTeamMeta(teamName);
  if (!meta) return '';
  return getLogoUrl(meta.espnId, meta.logoId, meta.localLogo);
}

function resolveTeamColors(teamName: string): { primary: string; secondary: string } {
  const meta = resolveTeamMeta(teamName);
  return meta?.colors ?? { primary: 'var(--bsi-primary)', secondary: '#FFFFFF' };
}

// ---------------------------------------------------------------------------
// Scouting grade conversion
// ---------------------------------------------------------------------------

/** Convert a 0-100 percentile to the 20-80 scouting scale (5-point increments) */
function toScoutingGrade(percentile: number): number {
  const raw = 20 + (percentile / 100) * 60;
  return Math.round(raw / 5) * 5;
}

function gradeLabel(grade: number): string {
  if (grade >= 70) return 'Plus-Plus';
  if (grade >= 60) return 'Plus';
  if (grade >= 55) return 'Above Avg';
  if (grade >= 45) return 'Average';
  if (grade >= 40) return 'Below Avg';
  if (grade >= 30) return 'Fringe';
  return 'Well Below';
}

function gradeColor(grade: number): string {
  if (grade >= 70) return '#ef4444';
  if (grade >= 60) return '#f97316';
  if (grade >= 55) return '#eab308';
  if (grade >= 45) return '#8890a4';
  if (grade >= 40) return '#3b82f6';
  return '#6366f1';
}

// ---------------------------------------------------------------------------
// Position icon SVG paths — baseball silhouettes instead of cheap initials
// ---------------------------------------------------------------------------

function PositionIcon({ position, color }: { position: string; color: string }) {
  const pos = position?.toUpperCase() || '';
  const isPitcherPos = ['P', 'SP', 'RP', 'LHP', 'RHP', 'LHSP', 'RHSP', 'LHRP', 'RHRP'].includes(pos);

  if (isPitcherPos) {
    // Pitcher in wind-up silhouette
    return (
      <svg viewBox="0 0 120 120" className="w-full h-full" aria-hidden="true">
        <defs>
          <linearGradient id="pitcher-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {/* Head */}
        <circle cx="55" cy="22" r="10" fill="url(#pitcher-grad)" />
        {/* Torso — rotated for wind-up */}
        <path d="M55 32 L50 58 L60 58 Z" fill="url(#pitcher-grad)" />
        {/* Front leg (drive leg) — extended */}
        <path d="M50 58 L30 90 L35 92 L52 62" fill="url(#pitcher-grad)" />
        {/* Back leg (pivot) — bent */}
        <path d="M60 58 L72 78 L68 88 L74 90 L78 80 L66 58" fill="url(#pitcher-grad)" />
        {/* Throwing arm — extended back */}
        <path d="M55 36 L82 28 L86 32 L58 40" fill="url(#pitcher-grad)" />
        {/* Glove arm — out front */}
        <path d="M55 38 L34 44 L30 40 L32 36 L54 34" fill="url(#pitcher-grad)" />
        {/* Ball */}
        <circle cx="86" cy="29" r="4" fill={color} opacity="0.7" />
      </svg>
    );
  }

  // Batter in swing silhouette
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="batter-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {/* Head with helmet */}
      <circle cx="60" cy="22" r="10" fill="url(#batter-grad)" />
      <path d="M52 18 L50 14 L56 12 L62 12 L64 16" fill="url(#batter-grad)" />
      {/* Torso — slight rotation for batting stance */}
      <path d="M56 32 L52 60 L68 60 L64 32 Z" fill="url(#batter-grad)" />
      {/* Front leg — striding */}
      <path d="M52 60 L40 90 L46 92 L54 64" fill="url(#batter-grad)" />
      {/* Back leg — loading */}
      <path d="M68 60 L76 88 L70 90 L64 64" fill="url(#batter-grad)" />
      {/* Arms + bat — mid-swing */}
      <path d="M60 36 L78 30 L82 34 L62 40" fill="url(#batter-grad)" />
      {/* Bat */}
      <line x1="80" y1="28" x2="42" y2="8" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Metric display config
// ---------------------------------------------------------------------------

interface MetricConfig {
  key: string;
  label: string;
  format: (v: number) => string;
  higherIsBetter: boolean;
  pro?: boolean;
}

const BATTING_METRICS: MetricConfig[] = [
  { key: 'avg', label: 'AVG', format: fmt3, higherIsBetter: true },
  { key: 'obp', label: 'OBP', format: fmt3, higherIsBetter: true },
  { key: 'slg', label: 'SLG', format: fmt3, higherIsBetter: true },
  { key: 'ops', label: 'OPS', format: fmt3, higherIsBetter: true },
  { key: 'k_pct', label: 'K%', format: fmtPct, higherIsBetter: false },
  { key: 'bb_pct', label: 'BB%', format: fmtPct, higherIsBetter: true },
  { key: 'iso', label: 'ISO', format: fmt3, higherIsBetter: true },
  { key: 'babip', label: 'BABIP', format: fmt3, higherIsBetter: true },
  { key: 'woba', label: 'wOBA', format: fmt3, higherIsBetter: true, pro: true },
  { key: 'wrc_plus', label: 'wRC+', format: fmtInt, higherIsBetter: true, pro: true },
  { key: 'ops_plus', label: 'OPS+', format: fmtInt, higherIsBetter: true, pro: true },
];

const PITCHING_METRICS: MetricConfig[] = [
  { key: 'era', label: 'ERA', format: fmt2, higherIsBetter: false },
  { key: 'whip', label: 'WHIP', format: fmt2, higherIsBetter: false },
  { key: 'k_9', label: 'K/9', format: fmt1, higherIsBetter: true },
  { key: 'bb_9', label: 'BB/9', format: fmt1, higherIsBetter: false },
  { key: 'hr_9', label: 'HR/9', format: fmt1, higherIsBetter: false },
  { key: 'babip', label: 'BABIP', format: fmt3, higherIsBetter: false },
  { key: 'fip', label: 'FIP', format: fmt2, higherIsBetter: false, pro: true },
  { key: 'x_fip', label: 'xFIP', format: fmt2, higherIsBetter: false, pro: true },
  { key: 'era_minus', label: 'ERA-', format: fmtInt, higherIsBetter: false, pro: true },
  { key: 'k_bb', label: 'K/BB', format: fmt2, higherIsBetter: true, pro: true },
  { key: 'lob_pct', label: 'LOB%', format: fmtPct, higherIsBetter: true, pro: true },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SavantPlayerClient() {
  // Read player ID from the browser URL, not useParams().
  // With static export + placeholder fallback, useParams() returns 'placeholder'
  // because the page was generated with that param. The real ID is in window.location.
  const [playerId, setPlayerId] = useState<string>('');
  useEffect(() => {
    const segments = window.location.pathname.split('/').filter(Boolean);
    // URL: /college-baseball/savant/player/{id}
    const idx = segments.indexOf('player');
    const id = idx >= 0 && segments[idx + 1] ? segments[idx + 1] : '';
    setPlayerId(id);
  }, []);
  const [playerData, setPlayerData] = useState<SavantPlayerPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/savant/player/${playerId}`);
        if (!res.ok) throw new Error('Not found');
        const json = (await res.json()) as SavantPlayerResponse;
        setPlayerData(json.player);
      } catch {
        setPlayerData(null);
        setError('Unable to load Savant player data.');
      } finally {
        setLoading(false);
      }
    }
    if (playerId && playerId !== 'placeholder') {
      load();
    } else {
      setLoading(false);
    }
  }, [playerId]);

  // Free-tier: first 10 unique player profile views are fully unlocked (no signup).
  // After that, pro stats are gated behind the upgrade prompt.
  const FREE_PROFILE_LIMIT = 10;
  const isPro = useMemo(() => {
    if (!playerData || !playerId) return false;
    // If the API says it's already pro (authenticated user), use that
    const sample = (playerData.batting || playerData.pitching) as (BattingStats | PitchingStats | null);
    if (sample && !sample._tier_gated) return true;
    // Otherwise check free-tier allowance via localStorage
    if (typeof window === 'undefined') return false;
    try {
      const storageKey = 'bsi_savant_free_views';
      const raw = localStorage.getItem(storageKey);
      const viewed: string[] = raw ? JSON.parse(raw) : [];
      // If this player was already viewed, it's still free
      if (viewed.includes(playerId)) return true;
      // If under the limit, add this player and grant access
      if (viewed.length < FREE_PROFILE_LIMIT) {
        viewed.push(playerId);
        localStorage.setItem(storageKey, JSON.stringify(viewed));
        return true;
      }
      // Over limit — gated
      return false;
    } catch {
      return false;
    }
  }, [playerData, playerId]);

  if (loading) {
    return (
      <div className="pt-6">
        <Section padding="lg">
          <Container>
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin" />
            </div>
          </Container>
        </Section>
      </div>
    );
  }

  if (!playerData || (!playerData.batting && !playerData.pitching)) {
    return (
      <>
        <div className="pt-6">
          <Section padding="lg">
            <Container>
              <Card padding="lg" className="text-center">
                <h2 className="text-xl font-bold text-text-primary mb-2">
                  {error ? 'Temporarily Unavailable' : 'Player not found'}
                </h2>
                <p className="text-text-muted mb-4 text-sm">
                  {error || 'Advanced metrics may not be available for this player yet.'}
                </p>
                <Link
                  href="/college-baseball/savant"
                  className="text-burnt-orange hover:text-ember transition-colors"
                >
                  Back to Savant
                </Link>
              </Card>
            </Container>
          </Section>
        </div>
      </>
    );
  }

  const { batting, pitching, percentiles, headshot } = playerData;
  const playerName = batting?.player_name ?? pitching?.player_name ?? '';
  const team = batting?.team ?? pitching?.team ?? '';
  const conference = batting?.conference ?? pitching?.conference ?? '';

  // Update page title with real player name
  if (typeof document !== 'undefined' && playerName) {
    document.title = `${playerName} | BSI Savant | Blaze Sports Intel`;
  }
  const position = batting?.position ?? pitching?.position ?? '';
  const classYear = batting?.class_year ?? pitching?.class_year ?? '';
  const season = batting?.season ?? pitching?.season ?? 2026;
  const isBatter = batting !== null;
  const isPitcher = pitching !== null;
  const isTwoWay = isBatter && isPitcher;

  // Resolve correct team identity from teamMetadata (not raw team_id)
  const teamLogoUrl = resolveTeamLogoUrl(team);
  const teamColors = resolveTeamColors(team);

  // YouTube highlight search
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${playerName} ${team} baseball highlights ${season}`)}`;

  // Headline stats for scouting card
  const headlineStat = isBatter
    ? {
        label: batting?.woba != null ? 'wOBA' : 'AVG',
        value: batting?.woba != null ? fmt3(batting.woba) : batting ? fmt3(batting.avg) : '',
      }
    : {
        label: pitching?.fip != null ? 'FIP' : 'ERA',
        value: pitching?.fip != null ? fmt2(pitching.fip) : pitching ? fmt2(pitching.era) : '',
      };
  const secondaryStat = isBatter
    ? batting ? { label: 'OPS', value: fmt3(batting.ops) } : null
    : pitching ? { label: 'K/9', value: fmt1(pitching.k_9) } : null;

  // Third headline stat
  const thirdStat = isBatter
    ? batting ? { label: 'HR', value: String(batting.hr) } : null
    : isPitcher && pitching ? { label: 'SO', value: String(pitching.so) } : null;

  // Player initials for avatar fallback
  const nameParts = playerName.split(' ');
  const initials = nameParts.length >= 2
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
    : playerName.slice(0, 2);

  // Split name for dramatic display
  const firstName = nameParts.length >= 2 ? nameParts.slice(0, -1).join(' ') : '';
  const lastName = nameParts.length >= 2 ? nameParts[nameParts.length - 1] : playerName;

  return (
    <>
      <div>
        {/* ================================================================ */}
        {/*  SCOUTING DOSSIER HERO                                           */}
        {/* ================================================================ */}
        <section
          className="relative overflow-hidden grain-overlay bg-surface-scoreboard"
        >
          {/* Team color edge accent — left vertical bar */}
          <div
            className="absolute left-0 top-0 bottom-0 w-[3px]"
            style={{ background: teamColors.primary }}
            aria-hidden="true"
          />

          {/* Diagonal team color wash — top-right corner bleed */}
          <div
            className="absolute top-0 right-0 w-[60%] h-full pointer-events-none"
            style={{
              background: `linear-gradient(135deg, transparent 40%, ${teamColors.primary}08 70%, ${teamColors.primary}12 100%)`,
            }}
            aria-hidden="true"
          />

          {/* Large watermark logo — bleeds behind everything */}
          {teamLogoUrl && (
            <div
              className="absolute right-[-40px] sm:right-[2%] top-[50%] -translate-y-1/2 w-[280px] sm:w-[380px] md:w-[440px] pointer-events-none select-none"
              aria-hidden="true"
            >
              <img
                src={teamLogoUrl}
                alt=""
                className="w-full opacity-[0.04]"
                loading="eager"
                draggable="false"
              />
            </div>
          )}

          {/* Scanline texture overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.015]"
            aria-hidden="true"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(140,98,57,0.04) 2px, rgba(140,98,57,0.04) 4px)',
            }}
          />

          <Container size="lg">
            <div style={{ padding: 'clamp(1.25rem, 3vw, 2rem) 0 clamp(1.5rem, 3vw, 2.5rem)' }}>
              {/* Breadcrumb */}
              <nav
                className="flex items-center gap-2 text-xs mb-6 font-mono text-bsi-dust"
                aria-label="Breadcrumb"
              >
                <Link href="/" className="transition-colors hover:text-bsi-bone">Home</Link>
                <span aria-hidden="true">/</span>
                <Link href="/college-baseball" className="transition-colors hover:text-bsi-bone">College Baseball</Link>
                <span aria-hidden="true">/</span>
                <Link href="/college-baseball/savant" className="transition-colors hover:text-bsi-bone">Savant</Link>
                <span aria-hidden="true">/</span>
                <span className="text-bsi-primary">{playerName}</span>
              </nav>

              <ScrollReveal direction="up" delay={50}>
                {/* ── The Scouting Card ── */}
                <div
                  className="relative corner-marks overflow-hidden"
                  style={{
                    background: 'var(--surface-dugout, #161616)',
                    border: '1px solid var(--border-vintage, rgba(140,98,57,0.3))',
                    borderTop: `2px solid ${teamColors.primary}`,
                  }}
                >
                  {/* Card interior layout */}
                  <div className="flex flex-col md:flex-row">
                    {/* ── LEFT: Player identity column ── */}
                    <div
                      className="relative flex flex-col items-center justify-center p-6 md:p-8 md:w-[240px] lg:w-[280px] flex-shrink-0"
                      style={{
                        background: `linear-gradient(180deg, ${teamColors.primary}0A 0%, transparent 50%, ${teamColors.primary}06 100%)`,
                        borderRight: '1px solid var(--border-vintage, rgba(140,98,57,0.3))',
                      }}
                    >
                      {/* Player headshot or position silhouette fallback */}
                      <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 mb-4 relative rounded-sm overflow-hidden" style={{ border: `2px solid ${teamColors.primary}44`, background: 'var(--surface-press-box, #111111)' }}>
                        <PositionIcon position={position} color={teamColors.primary} />
                      </div>

                      {/* Team logo — real, prominent */}
                      {teamLogoUrl && (
                        <div className="w-14 h-14 mb-3">
                          <img
                            src={teamLogoUrl}
                            alt={`${team} logo`}
                            className="w-full h-full object-contain"
                            loading="eager"
                          />
                        </div>
                      )}

                      {/* Position badge */}
                      {position && position !== 'UN' && (
                        <span
                          className="heritage-stamp text-center"
                          style={{
                            color: teamColors.primary,
                            borderColor: `${teamColors.primary}44`,
                            fontSize: '0.8rem',
                            letterSpacing: '0.15em',
                          }}
                        >
                          {position}
                        </span>
                      )}

                      {/* Class year tag */}
                      {classYear && (
                        <span
                          className="text-[10px] uppercase tracking-[0.2em] mt-2"
                          style={{
                            fontFamily: 'var(--bsi-font-data)',
                            color: 'var(--bsi-dust)',
                          }}
                        >
                          {classYear}
                        </span>
                      )}
                    </div>

                    {/* ── RIGHT: Name + Headline Stats ── */}
                    <div className="flex-1 min-w-0 p-5 sm:p-6 md:p-8 flex flex-col justify-between">
                      {/* Top: Team & Conference label */}
                      <div>
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <span
                            className="text-xs font-semibold uppercase tracking-[0.15em]"
                            style={{
                              fontFamily: 'var(--bsi-font-display)',
                              color: teamColors.primary,
                            }}
                          >
                            {team}
                          </span>
                          {conference && (
                            <>
                              <span
                                className="w-1 h-1 rounded-full bg-bsi-dust"
                                aria-hidden="true"
                              />
                              <span
                                className="text-[11px] uppercase tracking-wider"
                                style={{
                                  fontFamily: 'var(--bsi-font-display)',
                                  color: 'var(--bsi-dust)',
                                }}
                              >
                                {conference}
                              </span>
                            </>
                          )}
                          {isTwoWay && (
                            <span
                              className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5"
                              style={{
                                background: `${teamColors.primary}15`,
                                color: teamColors.primary,
                                border: `1px solid ${teamColors.primary}33`,
                              }}
                            >
                              Two-Way
                            </span>
                          )}
                        </div>

                        {/* Player name — dramatic two-line treatment */}
                        <div className="mb-1">
                          {firstName && (
                            <span
                              className="block uppercase tracking-wider leading-none"
                              style={{
                                fontFamily: 'var(--bsi-font-display)',
                                fontSize: 'clamp(0.875rem, 2vw, 1.125rem)',
                                color: 'var(--bsi-dust)',
                                letterSpacing: '0.2em',
                              }}
                            >
                              {firstName}
                            </span>
                          )}
                          <h1
                            className="uppercase leading-[0.9] tracking-tight"
                            style={{
                              fontFamily: 'var(--bsi-font-display-hero, var(--font-bebas, "Bebas Neue"))',
                              fontSize: 'clamp(2.5rem, 7vw, 5rem)',
                              color: 'var(--bsi-bone)',
                            }}
                          >
                            {lastName}
                          </h1>
                        </div>

                        <div className="flex items-center gap-2 mb-5">
                          <span
                            className="text-xs"
                            style={{
                              fontFamily: 'var(--bsi-font-data)',
                              color: 'var(--bsi-dust)',
                            }}
                          >
                            {season} Season
                          </span>
                          {isPitcher && pitching && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-bsi-dust" aria-hidden="true" />
                              <span
                                className="text-xs font-mono text-bsi-dust"
                              >
                                {pitching.w}-{pitching.l}{pitching.sv > 0 ? `, ${pitching.sv} SV` : ''} &middot; {fmt1(pitching.ip)} IP
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* ── Headline stat blocks — the signature scouting card row ── */}
                      <div className="flex items-stretch gap-0 flex-wrap">
                        {headlineStat.value && (
                          <HeadlineStat
                            label={headlineStat.label}
                            value={headlineStat.value}
                            accent={teamColors.primary}
                            isPrimary
                          />
                        )}
                        {secondaryStat && (
                          <HeadlineStat
                            label={secondaryStat.label}
                            value={secondaryStat.value}
                          />
                        )}
                        {thirdStat && (
                          <HeadlineStat
                            label={thirdStat.label}
                            value={thirdStat.value}
                          />
                        )}
                        {isBatter && batting && (
                          <HeadlineStat
                            label="PA"
                            value={String(batting.pa)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </Container>

          {/* Bottom edge gradient line */}
          <div
            className="h-px"
            style={{ background: `linear-gradient(to right, ${teamColors.primary}, ${teamColors.primary}44, transparent)` }}
          />
        </section>

        {/* ================================================================ */}
        {/*  VIDEO HIGHLIGHTS — visual card, not a text row                   */}
        {/* ================================================================ */}
        <section style={{ padding: 'clamp(0.75rem, 2vw, 1.25rem) 0' }}>
          <Container size="lg">
            <ScrollReveal direction="up" delay={80}>
              <a
                href={youtubeSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-5 px-5 py-4 overflow-hidden heritage-card transition-all duration-200"
                style={{ borderLeft: `3px solid ${teamColors.primary}` }}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: `linear-gradient(90deg, ${teamColors.primary}08, transparent)` }}
                  aria-hidden="true"
                />

                {/* Play icon */}
                <div
                  className="relative flex-shrink-0 w-14 h-14 flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                  style={{
                    background: `${teamColors.primary}12`,
                    border: `1px solid ${teamColors.primary}30`,
                  }}
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 ml-0.5" fill={teamColors.primary}>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>

                <div className="relative flex-1 min-w-0">
                  <span
                    className="text-sm font-semibold block group-hover:text-bsi-primary transition-colors"
                    style={{
                      fontFamily: 'var(--bsi-font-display)',
                      color: 'var(--bsi-bone)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Watch {playerName} Highlights
                  </span>
                  <span
                    className="text-xs mt-0.5 block"
                    style={{
                      fontFamily: 'var(--bsi-font-body, "Cormorant Garamond")',
                      color: 'var(--bsi-dust)',
                    }}
                  >
                    Search YouTube for {season} game footage, at-bats, and scouting clips
                  </span>
                </div>

                <svg
                  viewBox="0 0 20 20"
                  className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                  fill="var(--bsi-dust)"
                >
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </a>
            </ScrollReveal>
          </Container>
        </section>

        {/* ================================================================ */}
        {/*  ANALYTICS BODY                                                   */}
        {/* ================================================================ */}
        <section style={{ padding: 'clamp(0.5rem, 2vw, 1rem) 0 clamp(1rem, 3vw, 2rem)' }}>
          <Container size="lg">
            {/* ── Percentile sections ── */}
            {isBatter && (
              <ScrollReveal direction="up" delay={100}>
                <PercentileSection
                  title="Batting Percentiles"
                  stats={batting as unknown as Record<string, unknown>}
                  metrics={BATTING_METRICS}
                  percentileData={percentiles.batting}
                  isPro={isPro}
                  accentColor={teamColors.primary}
                />
              </ScrollReveal>
            )}

            {isPitcher && (
              <ScrollReveal direction="up" delay={isBatter ? 150 : 100}>
                <PercentileSection
                  title="Pitching Percentiles"
                  stats={pitching as unknown as Record<string, unknown>}
                  metrics={PITCHING_METRICS}
                  percentileData={percentiles.pitching}
                  isPro={isPro}
                  accentColor={teamColors.primary}
                />
              </ScrollReveal>
            )}

            {/* ── Scouting Grades ── */}
            <ScrollReveal direction="up" delay={200}>
              <ScoutingGrades
                batting={percentiles.batting}
                pitching={percentiles.pitching}
                isBatter={isBatter}
                isPitcher={isPitcher}
                isPro={isPro}
                accentColor={teamColors.primary}
              />
            </ScrollReveal>

            {/* ── Composite radar chart ── */}
            <PlayerScoutingComposite
              playerId={playerId}
              position={isBatter && !isPitcher ? 'hitter' : 'pitcher'}
              className="mb-6"
            />

            {/* ── Raw stat lines ── */}
            {isBatter && (
              <ScrollReveal direction="up" delay={250}>
                <RawStatLine title="Batting Line" stats={batting} type="batting" isPro={isPro} accentColor={teamColors.primary} />
              </ScrollReveal>
            )}
            {isPitcher && (
              <ScrollReveal direction="up" delay={isBatter ? 300 : 250}>
                <RawStatLine title="Pitching Line" stats={pitching} type="pitching" isPro={isPro} accentColor={teamColors.primary} />
              </ScrollReveal>
            )}

            {/* Free-tier view counter */}
            {isPro && (() => {
              try {
                const raw = localStorage.getItem('bsi_savant_free_views');
                const viewed: string[] = raw ? JSON.parse(raw) : [];
                const remaining = FREE_PROFILE_LIMIT - viewed.length;
                if (remaining > 0 && remaining < FREE_PROFILE_LIMIT) {
                  return (
                    <div
                      className="mt-6 mb-2 px-4 py-3 flex items-center justify-between"
                      style={{
                        background: 'var(--surface-press-box, #111111)',
                        border: '1px solid var(--border-vintage, rgba(140,98,57,0.3))',
                      }}
                    >
                      <p className="text-xs text-bsi-dust font-mono">
                        {remaining} free profile{remaining === 1 ? '' : 's'} remaining
                      </p>
                      <Link
                        href="/pricing"
                        className="text-xs uppercase tracking-wider transition-colors hover:text-bsi-bone font-display text-bsi-primary"
                      >
                        Go Pro
                      </Link>
                    </div>
                  );
                }
              } catch { /* localStorage unavailable */ }
              return null;
            })()}

            {/* ── Navigation links ── */}
            <div
              className="flex items-center gap-6 mt-8 mb-4 pt-6"
              style={{ borderTop: '1px solid var(--border-vintage, rgba(140,98,57,0.3))' }}
            >
              <Link
                href={`/college-baseball/players/${playerId}`}
                className="text-xs uppercase tracking-widest transition-colors hover:text-bsi-primary text-bsi-dust font-display"
              >
                Full Player Profile &rarr;
              </Link>
              <Link
                href="/college-baseball/savant"
                className="text-xs uppercase tracking-widest transition-colors hover:text-bsi-primary text-bsi-dust font-display"
              >
                Savant Leaderboard &rarr;
              </Link>
            </div>
          </Container>
        </section>
      </div>

    </>
  );
}

// ---------------------------------------------------------------------------
// Headline stat — large display stat with label above, used in the hero card
// ---------------------------------------------------------------------------

function HeadlineStat({
  label,
  value,
  accent,
  isPrimary = false,
}: {
  label: string;
  value: string;
  accent?: string;
  isPrimary?: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center px-5 py-3 min-w-[85px]"
      style={{
        background: isPrimary ? `${accent}08` : 'transparent',
        borderRight: '1px solid var(--border-vintage, rgba(140,98,57,0.3))',
        borderBottom: isPrimary && accent ? `2px solid ${accent}` : '2px solid transparent',
      }}
    >
      <span
        className="text-[10px] uppercase tracking-[0.2em] mb-1"
        style={{
          fontFamily: 'var(--bsi-font-display)',
          color: isPrimary && accent ? accent : 'var(--bsi-dust)',
        }}
      >
        {label}
      </span>
      <span
        className="font-mono font-bold tabular-nums leading-none stat-led-glow"
        style={{
          fontSize: 'clamp(1.5rem, 3vw, 2rem)',
          color: 'var(--bsi-bone)',
          fontFamily: 'var(--bsi-font-data)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Percentile section — uses real D1-computed percentiles from the API
// ---------------------------------------------------------------------------

function PercentileSection({
  title,
  stats,
  metrics,
  percentileData,
  isPro,
  accentColor,
}: {
  title: string;
  stats: Record<string, unknown>;
  metrics: MetricConfig[];
  percentileData: Record<string, number> | null;
  isPro: boolean;
  accentColor: string;
}) {
  const freeMetrics = metrics.filter(m => !m.pro);
  const proMetrics = metrics.filter(m => m.pro);

  return (
    <div
      className="mb-6 overflow-hidden corner-marks"
      style={{
        background: 'var(--surface-dugout, #161616)',
        border: '1px solid var(--border-vintage, rgba(140,98,57,0.3))',
        borderTop: `2px solid ${accentColor}`,
      }}
    >
      <div
        className="px-5 py-3 flex items-center justify-between border-b border-border-vintage"
      >
        <h2
          className="text-sm uppercase tracking-wider font-display text-bsi-bone"
        >
          {title}
        </h2>
        <span
          className="heritage-stamp"
          style={{ fontSize: '0.55rem', letterSpacing: '0.15em' }}
        >
          D1 Rank
        </span>
      </div>

      {/* Free-tier metrics */}
      <div className="px-5 py-4 space-y-3">
        {freeMetrics.map(metric => {
          const val = stats[metric.key];
          if (val == null || typeof val !== 'number') return null;
          const pctl = percentileData?.[metric.key] ?? 50;
          return (
            <PercentileBar
              key={metric.key}
              value={pctl}
              label={metric.label}
              statValue={metric.format(val)}
              higherIsBetter={metric.higherIsBetter}
            />
          );
        })}
      </div>

      {/* Pro-tier metrics */}
      {proMetrics.length > 0 && (
        <MetricGate
          isPro={isPro}
          metricName={proMetrics.map(m => m.label).join(', ')}
          className="border-t"
        >
          <div className="px-5 py-4 space-y-3">
            {proMetrics.map(metric => {
              const val = stats[metric.key];
              if (val == null || typeof val !== 'number') return null;
              const pctl = percentileData?.[metric.key] ?? 50;
              return (
                <PercentileBar
                  key={metric.key}
                  value={pctl}
                  label={metric.label}
                  statValue={metric.format(val)}
                  higherIsBetter={metric.higherIsBetter}
                />
              );
            })}
          </div>
        </MetricGate>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scouting Grades — 20-80 scale derived from real percentiles
// ---------------------------------------------------------------------------

function ScoutingGrades({
  batting,
  pitching,
  isBatter,
  isPitcher,
  isPro,
  accentColor,
}: {
  batting: Record<string, number> | null;
  pitching: Record<string, number> | null;
  isBatter: boolean;
  isPitcher: boolean;
  isPro: boolean;
  accentColor: string;
}) {
  const battingGrades = useMemo(() => {
    if (!batting) return [];
    const keys = [
      { key: 'avg', label: 'Hit' },
      { key: 'iso', label: 'Power' },
      { key: 'bb_pct', label: 'Eye' },
      { key: 'k_pct', label: 'Contact' },
      { key: 'obp', label: 'On-Base' },
    ];
    return keys
      .filter(k => batting[k.key] != null)
      .map(k => ({ label: k.label, grade: toScoutingGrade(batting[k.key]) }));
  }, [batting]);

  const pitchingGrades = useMemo(() => {
    if (!pitching) return [];
    const keys = [
      { key: 'k_9', label: 'Stuff' },
      { key: 'bb_9', label: 'Command' },
      { key: 'hr_9', label: 'HR Suppression' },
    ];
    return keys
      .filter(k => pitching[k.key] != null)
      .map(k => ({ label: k.label, grade: toScoutingGrade(pitching[k.key]) }));
  }, [pitching]);

  const proGrades = useMemo(() => {
    const grades: { label: string; grade: number }[] = [];
    if (batting) {
      if (batting.woba != null) grades.push({ label: 'wOBA Grade', grade: toScoutingGrade(batting.woba) });
      if (batting.wrc_plus != null) grades.push({ label: 'wRC+ Grade', grade: toScoutingGrade(batting.wrc_plus) });
    }
    if (pitching) {
      if (pitching.fip != null) grades.push({ label: 'FIP Grade', grade: toScoutingGrade(pitching.fip) });
      if (pitching.era_minus != null) grades.push({ label: 'ERA- Grade', grade: toScoutingGrade(pitching.era_minus) });
    }
    return grades;
  }, [batting, pitching]);

  const hasAnyGrades = battingGrades.length > 0 || pitchingGrades.length > 0;
  if (!hasAnyGrades) return null;

  return (
    <div
      className="mb-6 overflow-hidden corner-marks"
      style={{
        background: 'var(--surface-dugout, #161616)',
        border: '1px solid var(--border-vintage, rgba(140,98,57,0.3))',
        borderTop: `2px solid ${accentColor}`,
      }}
    >
      <div
        className="px-5 py-3 border-b flex items-center justify-between border-border-vintage"
      >
        <div>
          <h2
            className="text-sm uppercase tracking-wider font-display text-bsi-bone"
          >
            Scouting Grades
          </h2>
          <p className="text-[10px] mt-0.5 text-bsi-dust">
            20-80 scale from D1 percentile rank
          </p>
        </div>
        <span
          className="heritage-stamp"
          style={{ fontSize: '0.55rem', letterSpacing: '0.15em' }}
        >
          20-80
        </span>
      </div>

      <div className="px-5 py-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {isBatter && battingGrades.map(g => (
            <GradeCard key={g.label} label={g.label} grade={g.grade} />
          ))}
          {isPitcher && pitchingGrades.map(g => (
            <GradeCard key={g.label} label={g.label} grade={g.grade} />
          ))}
        </div>

        {proGrades.length > 0 && (
          <MetricGate isPro={isPro} metricName="pro scouting grades" className="mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {proGrades.map(g => (
                <GradeCard key={g.label} label={g.label} grade={g.grade} />
              ))}
            </div>
          </MetricGate>
        )}
      </div>
    </div>
  );
}

function GradeCard({ label, grade }: { label: string; grade: number }) {
  const color = gradeColor(grade);
  return (
    <div
      className="relative text-center p-4 overflow-hidden"
      style={{
        background: 'var(--surface-press-box, #111111)',
        border: '1px solid var(--border-vintage, rgba(140,98,57,0.3))',
      }}
    >
      {/* Grade color bar at top */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: color }}
      />
      <span
        className="text-[10px] uppercase tracking-[0.15em] block mb-2 font-display text-bsi-dust"
      >
        {label}
      </span>
      <span
        className="text-3xl font-bold tabular-nums block leading-none font-mono"
        style={{ color }}
      >
        {grade}
      </span>
      <span
        className="text-[9px] font-mono block mt-1.5 uppercase tracking-wider"
       
      >
        {gradeLabel(grade)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Raw stat line
// ---------------------------------------------------------------------------

function RawStatLine({
  title,
  stats,
  type,
  isPro,
  accentColor,
}: {
  title: string;
  stats: BattingStats | PitchingStats;
  type: 'batting' | 'pitching';
  isPro: boolean;
  accentColor: string;
}) {
  const battingTraditional = type === 'batting' ? [
    { label: 'G', value: String((stats as BattingStats).g) },
    { label: 'AB', value: String((stats as BattingStats).ab) },
    { label: 'PA', value: String((stats as BattingStats).pa) },
    { label: 'H', value: String((stats as BattingStats).h) },
    { label: 'HR', value: String((stats as BattingStats).hr) },
    { label: 'BB', value: String((stats as BattingStats).bb) },
    { label: 'SO', value: String((stats as BattingStats).so) },
    { label: 'AVG', value: fmt3((stats as BattingStats).avg) },
    { label: 'OBP', value: fmt3((stats as BattingStats).obp) },
    { label: 'SLG', value: fmt3((stats as BattingStats).slg) },
    { label: 'OPS', value: fmt3((stats as BattingStats).ops) },
  ] : [];

  const pitchingTraditional = type === 'pitching' ? [
    { label: 'G', value: String((stats as PitchingStats).g) },
    { label: 'GS', value: String((stats as PitchingStats).gs) },
    { label: 'W', value: String((stats as PitchingStats).w) },
    { label: 'L', value: String((stats as PitchingStats).l) },
    { label: 'SV', value: String((stats as PitchingStats).sv) },
    { label: 'IP', value: fmt1((stats as PitchingStats).ip) },
    { label: 'SO', value: String((stats as PitchingStats).so) },
    { label: 'BB', value: String((stats as PitchingStats).bb) },
    { label: 'ERA', value: fmt2((stats as PitchingStats).era) },
    { label: 'WHIP', value: fmt2((stats as PitchingStats).whip) },
  ] : [];

  const traditional = type === 'batting' ? battingTraditional : pitchingTraditional;

  const battingAdvanced = type === 'batting' ? [
    { label: 'K%', value: fmtPct((stats as BattingStats).k_pct) },
    { label: 'BB%', value: fmtPct((stats as BattingStats).bb_pct) },
    { label: 'ISO', value: fmt3((stats as BattingStats).iso) },
    { label: 'BABIP', value: fmt3((stats as BattingStats).babip) },
  ] : [];

  const pitchingAdvanced = type === 'pitching' ? [
    { label: 'K/9', value: fmt1((stats as PitchingStats).k_9) },
    { label: 'BB/9', value: fmt1((stats as PitchingStats).bb_9) },
    { label: 'HR/9', value: fmt1((stats as PitchingStats).hr_9) },
    { label: 'BABIP', value: fmt3((stats as PitchingStats).babip) },
  ] : [];

  const advanced = type === 'batting' ? battingAdvanced : pitchingAdvanced;

  const battingPro = type === 'batting' ? [
    { label: 'wOBA', value: (stats as BattingStats).woba != null ? fmt3((stats as BattingStats).woba!) : null },
    { label: 'wRC+', value: (stats as BattingStats).wrc_plus != null ? fmtInt((stats as BattingStats).wrc_plus!) : null },
    { label: 'OPS+', value: (stats as BattingStats).ops_plus != null ? fmtInt((stats as BattingStats).ops_plus!) : null },
    { label: 'eBA', value: (stats as BattingStats).e_ba != null ? fmt3((stats as BattingStats).e_ba!) : null },
    { label: 'eSLG', value: (stats as BattingStats).e_slg != null ? fmt3((stats as BattingStats).e_slg!) : null },
    { label: 'ewOBA', value: (stats as BattingStats).e_woba != null ? fmt3((stats as BattingStats).e_woba!) : null },
  ].filter(s => s.value !== null) as { label: string; value: string }[] : [];

  const pitchingPro = type === 'pitching' ? [
    { label: 'FIP', value: (stats as PitchingStats).fip != null ? fmt2((stats as PitchingStats).fip!) : null },
    { label: 'xFIP', value: (stats as PitchingStats).x_fip != null ? fmt2((stats as PitchingStats).x_fip!) : null },
    { label: 'ERA-', value: (stats as PitchingStats).era_minus != null ? fmtInt((stats as PitchingStats).era_minus!) : null },
    { label: 'K/BB', value: (stats as PitchingStats).k_bb != null ? fmt2((stats as PitchingStats).k_bb!) : null },
    { label: 'LOB%', value: (stats as PitchingStats).lob_pct != null ? fmtPct((stats as PitchingStats).lob_pct!) : null },
  ].filter(s => s.value !== null) as { label: string; value: string }[] : [];

  const proStats = type === 'batting' ? battingPro : pitchingPro;

  return (
    <div
      className="mb-6 overflow-hidden"
      style={{
        background: 'var(--surface-dugout, #161616)',
        border: '1px solid var(--border-vintage, rgba(140,98,57,0.3))',
        borderTop: `2px solid ${accentColor}`,
      }}
    >
      <div
        className="px-5 py-3 border-b border-border-vintage"
      >
        <h2
          className="text-sm uppercase tracking-wider font-display text-bsi-bone"
        >
          {title}
        </h2>
      </div>

      <div className="px-5 py-4">
        {/* Traditional */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-11 gap-3 mb-4">
          {traditional.map(s => (
            <StatCell key={s.label} label={s.label} value={s.value} />
          ))}
        </div>

        {/* Free Advanced */}
        <div
          className="pt-3 border-t mb-3 border-heritage-bronze/15"
        >
          <span
            className="heritage-stamp mb-2 block"
            style={{ fontSize: '0.5rem' }}
          >
            Advanced
          </span>
          <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
            {advanced.map(s => (
              <StatCell key={s.label} label={s.label} value={s.value} />
            ))}
          </div>
        </div>

        {/* Pro stats */}
        {proStats.length > 0 && (
          <MetricGate
            isPro={isPro}
            metricName={type === 'batting' ? 'wOBA, wRC+, OPS+' : 'FIP, xFIP, ERA-'}
          >
            <div
              className="pt-3 border-t border-heritage-bronze/15"
            >
              <span
                className="heritage-stamp mb-2 block"
                style={{ fontSize: '0.5rem', color: 'var(--bsi-primary)' }}
              >
                Pro
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {proStats.map(s => (
                  <StatCell key={s.label} label={s.label} value={s.value} />
                ))}
              </div>
            </div>
          </MetricGate>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat cell
// ---------------------------------------------------------------------------

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span
        className="text-[10px] uppercase tracking-widest block font-display text-bsi-dust"
      >
        {label}
      </span>
      <span
        className="text-sm font-bold tabular-nums text-bsi-bone font-mono"
      >
        {value}
      </span>
    </div>
  );
}
