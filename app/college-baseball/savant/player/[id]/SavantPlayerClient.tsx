'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Footer } from '@/components/layout-ds/Footer';
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
  return meta?.colors ?? { primary: '#BF5700', secondary: '#FFFFFF' };
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
        <Footer />
      </>
    );
  }

  const { batting, pitching, percentiles } = playerData;
  const playerName = batting?.player_name ?? pitching?.player_name ?? '';
  const team = batting?.team ?? pitching?.team ?? '';
  const conference = batting?.conference ?? pitching?.conference ?? '';
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

  // Player initials for avatar
  const nameParts = playerName.split(' ');
  const initials = nameParts.length >= 2
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
    : playerName.slice(0, 2);

  return (
    <>
      <div>
        {/* ── SCOUTING CARD HERO ── */}
        <section className="relative overflow-hidden">
          {/* Team color top bar */}
          <div className="absolute inset-x-0 top-0 h-1" style={{ background: teamColors.primary }} />

          {/* Large watermark logo */}
          {teamLogoUrl && (
            <div className="absolute right-[-60px] sm:right-[-20px] top-1/2 -translate-y-1/2 w-[300px] sm:w-[420px] pointer-events-none" aria-hidden="true">
              <img src={teamLogoUrl} alt="" className="w-full opacity-[0.035]" loading="eager" />
            </div>
          )}

          {/* Subtle diagonal grain */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.02]" aria-hidden="true" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)' }} />

          <Container size="lg">
            <div style={{ padding: 'clamp(1.5rem, 4vw, 3rem) 0 clamp(1rem, 3vw, 2rem)' }}>
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-xs mb-8" style={{ fontFamily: 'var(--bsi-font-data)', color: 'var(--bsi-dust)' }}>
                <Link href="/" className="transition-colors hover:text-[var(--bsi-bone)]">Home</Link>
                <span>/</span>
                <Link href="/college-baseball" className="transition-colors hover:text-[var(--bsi-bone)]">College Baseball</Link>
                <span>/</span>
                <Link href="/college-baseball/savant" className="transition-colors hover:text-[var(--bsi-bone)]">Savant</Link>
                <span>/</span>
                <span style={{ color: 'var(--bsi-primary)' }}>{playerName}</span>
              </nav>

              <ScrollReveal direction="up" delay={50}>
                <div className="flex items-start gap-5 sm:gap-8">
                  {/* ── Player avatar / team logo column ── */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-3">
                    {/* Player avatar with team color ring */}
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-sm overflow-hidden" style={{ border: `3px solid ${teamColors.primary}`, background: 'var(--surface-press-box, #111111)' }}>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <svg viewBox="0 0 80 80" className="w-full h-full absolute inset-0" style={{ opacity: 0.08 }}>
                          <circle cx="40" cy="28" r="14" fill={teamColors.primary} />
                          <ellipse cx="40" cy="68" rx="22" ry="16" fill={teamColors.primary} />
                        </svg>
                        <span className="relative z-10 text-2xl sm:text-3xl font-bold uppercase tracking-tighter" style={{ fontFamily: 'var(--font-syne, var(--bsi-font-display-hero))', color: teamColors.primary, opacity: 0.6 }}>
                          {initials}
                        </span>
                      </div>
                      {position && position !== 'UN' && (
                        <span className="absolute bottom-0 right-0 text-[10px] font-mono font-bold uppercase px-2 py-1" style={{ background: teamColors.primary, color: '#fff' }}>
                          {position}
                        </span>
                      )}
                    </div>

                    {/* Team logo — small, below avatar */}
                    {teamLogoUrl && (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-sm border overflow-hidden flex items-center justify-center p-1" style={{ background: 'var(--surface-press-box, #111111)', borderColor: 'rgba(140,98,57,0.2)' }}>
                        <img src={teamLogoUrl} alt={`${team} logo`} className="w-full h-full object-contain" loading="eager" />
                      </div>
                    )}
                  </div>

                  {/* ── Name, metadata, and headline stats ── */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: teamColors.primary }}>{team}</span>
                      {conference && (
                        <>
                          <span className="text-[10px]" style={{ color: 'var(--bsi-dust)' }}>&middot;</span>
                          <span className="text-xs" style={{ color: 'var(--bsi-dust)' }}>{conference}</span>
                        </>
                      )}
                      {classYear && (
                        <>
                          <span className="text-[10px]" style={{ color: 'var(--bsi-dust)' }}>&middot;</span>
                          <span className="text-xs" style={{ color: 'var(--bsi-dust)' }}>{classYear}</span>
                        </>
                      )}
                    </div>

                    <h1 className="font-bold uppercase tracking-tight leading-none mb-1" style={{ fontFamily: 'var(--font-syne, var(--bsi-font-display-hero))', fontSize: 'clamp(1.75rem, 5vw, 3.5rem)', color: 'var(--bsi-bone)' }}>
                      {playerName}
                    </h1>

                    <div className="flex items-center gap-2 mt-2 mb-4 flex-wrap">
                      {isTwoWay && (
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm" style={{ background: `${teamColors.primary}22`, color: teamColors.primary, border: `1px solid ${teamColors.primary}33` }}>
                          Two-Way
                        </span>
                      )}
                      <span className="text-xs" style={{ color: 'var(--bsi-dust)' }}>{season} Season</span>
                    </div>

                    {/* ── Headline stat cards ── */}
                    <div className="flex items-stretch gap-3 flex-wrap">
                      {headlineStat.value && (
                        <div className="flex flex-col items-center px-4 py-2.5 rounded-sm min-w-[80px]" style={{ background: 'var(--surface-press-box, #111111)', border: `1px solid ${teamColors.primary}33`, borderTop: `2px solid ${teamColors.primary}` }}>
                          <span className="text-[10px] uppercase tracking-widest mb-0.5" style={{ fontFamily: 'var(--bsi-font-display)', color: teamColors.primary }}>{headlineStat.label}</span>
                          <span className="text-xl sm:text-2xl font-mono font-bold tabular-nums" style={{ color: 'var(--bsi-bone)' }}>{headlineStat.value}</span>
                        </div>
                      )}
                      {secondaryStat && (
                        <div className="flex flex-col items-center px-4 py-2.5 rounded-sm min-w-[80px]" style={{ background: 'var(--surface-press-box, #111111)', border: '1px solid rgba(140,98,57,0.2)' }}>
                          <span className="text-[10px] uppercase tracking-widest mb-0.5" style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-dust)' }}>{secondaryStat.label}</span>
                          <span className="text-xl sm:text-2xl font-mono font-bold tabular-nums" style={{ color: 'var(--bsi-bone)' }}>{secondaryStat.value}</span>
                        </div>
                      )}
                      {isBatter && batting && (
                        <div className="flex flex-col items-center px-4 py-2.5 rounded-sm min-w-[80px]" style={{ background: 'var(--surface-press-box, #111111)', border: '1px solid rgba(140,98,57,0.2)' }}>
                          <span className="text-[10px] uppercase tracking-widest mb-0.5" style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-dust)' }}>HR</span>
                          <span className="text-xl sm:text-2xl font-mono font-bold tabular-nums" style={{ color: 'var(--bsi-bone)' }}>{batting.hr}</span>
                        </div>
                      )}
                      {!isBatter && isPitcher && pitching && (
                        <div className="flex flex-col items-center px-4 py-2.5 rounded-sm min-w-[80px]" style={{ background: 'var(--surface-press-box, #111111)', border: '1px solid rgba(140,98,57,0.2)' }}>
                          <span className="text-[10px] uppercase tracking-widest mb-0.5" style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-dust)' }}>SO</span>
                          <span className="text-xl sm:text-2xl font-mono font-bold tabular-nums" style={{ color: 'var(--bsi-bone)' }}>{pitching.so}</span>
                        </div>
                      )}
                    </div>

                    {isPitcher && pitching && (
                      <p className="text-xs font-mono mt-3" style={{ color: 'var(--bsi-dust)' }}>
                        {pitching.w}-{pitching.l}{pitching.sv > 0 ? `, ${pitching.sv} SV` : ''} &middot; {fmt1(pitching.ip)} IP
                      </p>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </Container>
          <div className="h-px" style={{ background: `linear-gradient(to right, transparent, ${teamColors.primary}33, transparent)` }} />
        </section>

        {/* ── VIDEO HIGHLIGHTS ── */}
        <section style={{ padding: 'clamp(0.75rem, 2vw, 1.5rem) 0' }}>
          <Container size="lg">
            <ScrollReveal direction="up" delay={80}>
              <a href={youtubeSearchUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 px-5 py-4 rounded-sm border transition-all duration-200" style={{ background: 'var(--surface-dugout, #161616)', borderColor: 'rgba(140,98,57,0.2)' }}>
                <div className="flex-shrink-0 w-12 h-12 rounded-sm flex items-center justify-center transition-transform group-hover:scale-105" style={{ background: `${teamColors.primary}15`, border: `1px solid ${teamColors.primary}33` }}>
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill={teamColors.primary}>
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 4-8 4z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold block group-hover:text-[var(--bsi-primary)] transition-colors" style={{ color: 'var(--bsi-bone)' }}>Watch {playerName} Highlights</span>
                  <span className="text-xs" style={{ color: 'var(--bsi-dust)' }}>Search YouTube for {season} game footage, at-bats, and scouting clips</span>
                </div>
                <svg viewBox="0 0 20 20" className="w-5 h-5 flex-shrink-0 transition-transform group-hover:translate-x-1" fill="var(--bsi-dust)">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </a>
            </ScrollReveal>
          </Container>
        </section>

        {/* ── ANALYTICS SECTIONS ── */}
        <section style={{ padding: 'clamp(0.5rem, 2vw, 1rem) 0 clamp(1rem, 3vw, 2rem)' }}>
          <Container size="lg">
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

            <ScrollReveal direction="up" delay={200}>
              <ScoutingGrades
                batting={percentiles.batting}
                pitching={percentiles.pitching}
                isBatter={isBatter}
                isPitcher={isPitcher}
                isPro={isPro}
              />
            </ScrollReveal>

            <PlayerScoutingComposite
              playerId={playerId}
              position={isBatter && !isPitcher ? 'hitter' : 'pitcher'}
              className="mb-6"
            />

            {isBatter && (
              <ScrollReveal direction="up" delay={250}>
                <RawStatLine title="Batting Line" stats={batting} type="batting" isPro={isPro} />
              </ScrollReveal>
            )}
            {isPitcher && (
              <ScrollReveal direction="up" delay={isBatter ? 300 : 250}>
                <RawStatLine title="Pitching Line" stats={pitching} type="pitching" isPro={isPro} />
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
                    <p className="text-xs mt-6 mb-2" style={{ color: 'var(--bsi-dust)' }}>
                      {remaining} free profile{remaining === 1 ? '' : 's'} remaining &middot;{' '}
                      <Link href="/pricing" className="text-[var(--bsi-primary)] hover:underline">
                        Go Pro for unlimited
                      </Link>
                    </p>
                  );
                }
              } catch { /* localStorage unavailable */ }
              return null;
            })()}

            {/* Links */}
            <div className="flex items-center gap-6 mt-8 mb-4">
              <Link
                href={`/college-baseball/players/${playerId}`}
                className="text-xs uppercase tracking-widest transition-colors hover:text-[var(--bsi-primary)]"
                style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-display)' }}
              >
                Full Player Profile &rarr;
              </Link>
              <Link
                href="/college-baseball/savant"
                className="text-xs uppercase tracking-widest transition-colors hover:text-[var(--bsi-primary)]"
                style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-display)' }}
              >
                Savant Leaderboard &rarr;
              </Link>
            </div>
          </Container>
        </section>
      </div>

      <Footer />
    </>
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
      className="mb-6 rounded-sm overflow-hidden border"
      style={{
        background: 'var(--surface-dugout, #161616)',
        borderColor: 'var(--border-vintage, rgba(140,98,57,0.3))',
      }}
    >
      <div
        className="px-5 py-3 border-b"
        style={{
          borderColor: 'var(--border-vintage, rgba(140,98,57,0.3))',
          borderTop: `2px solid ${accentColor}`,
        }}
      >
        <h2
          className="text-sm uppercase tracking-wider"
          style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-bone)' }}
        >
          {title}
        </h2>
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
}: {
  batting: Record<string, number> | null;
  pitching: Record<string, number> | null;
  isBatter: boolean;
  isPitcher: boolean;
  isPro: boolean;
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
      className="mb-6 rounded-sm overflow-hidden border"
      style={{
        background: 'var(--surface-dugout, #161616)',
        borderColor: 'var(--border-vintage, rgba(140,98,57,0.3))',
      }}
    >
      <div
        className="px-5 py-3 border-b"
        style={{ borderColor: 'var(--border-vintage, rgba(140,98,57,0.3))' }}
      >
        <h2
          className="text-sm uppercase tracking-wider"
          style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-bone)' }}
        >
          Scouting Grades (20-80 Scale)
        </h2>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--bsi-dust)' }}>
          Derived from percentile rank among all D1 players meeting minimum thresholds
        </p>
      </div>

      <div className="px-5 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {isBatter && battingGrades.map(g => (
            <GradeCard key={g.label} label={g.label} grade={g.grade} />
          ))}
          {isPitcher && pitchingGrades.map(g => (
            <GradeCard key={g.label} label={g.label} grade={g.grade} />
          ))}
        </div>

        {proGrades.length > 0 && (
          <MetricGate isPro={isPro} metricName="pro scouting grades" className="mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
      className="text-center p-3 rounded-sm border"
      style={{
        borderColor: 'rgba(140,98,57,0.15)',
        background: 'rgba(255,255,255,0.01)',
      }}
    >
      <span
        className="text-[10px] uppercase tracking-widest block mb-1"
        style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-dust)' }}
      >
        {label}
      </span>
      <span
        className="text-2xl font-mono font-bold tabular-nums block"
        style={{ color }}
      >
        {grade}
      </span>
      <span className="text-[9px] font-mono block mt-0.5" style={{ color }}>
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
}: {
  title: string;
  stats: BattingStats | PitchingStats;
  type: 'batting' | 'pitching';
  isPro: boolean;
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
      className="mb-6 rounded-sm overflow-hidden border"
      style={{
        background: 'var(--surface-dugout, #161616)',
        borderColor: 'var(--border-vintage, rgba(140,98,57,0.3))',
      }}
    >
      <div
        className="px-5 py-3 border-b"
        style={{ borderColor: 'var(--border-vintage, rgba(140,98,57,0.3))' }}
      >
        <h2
          className="text-sm uppercase tracking-wider"
          style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-bone)' }}
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
          className="pt-3 border-t mb-3"
          style={{ borderColor: 'rgba(140,98,57,0.15)' }}
        >
          <span
            className="text-[9px] uppercase tracking-widest mb-2 block"
            style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-dust)' }}
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
              className="pt-3 border-t"
              style={{ borderColor: 'rgba(140,98,57,0.15)' }}
            >
              <span
                className="text-[9px] uppercase tracking-widest mb-2 block"
                style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-primary)' }}
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
        className="text-[10px] uppercase tracking-widest block"
        style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-dust)' }}
      >
        {label}
      </span>
      <span className="text-sm font-mono tabular-nums" style={{ color: 'var(--bsi-bone)' }}>
        {value}
      </span>
    </div>
  );
}
