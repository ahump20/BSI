'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Footer } from '@/components/layout-ds/Footer';
import { PercentileBar } from '@/components/analytics/PercentileBar';
import { MetricGate } from '@/components/analytics/MetricGate';
import { PlayerScoutingComposite } from '@/components/college-baseball/PlayerScoutingComposite';
import { ScrollReveal } from '@/components/cinematic';
import { fmt1, fmt2, fmtPct, fmtInt, fmt3 } from '@/lib/utils/format';

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
  const teamId = (batting as unknown as Record<string, unknown>)?.team_id ?? (pitching as unknown as Record<string, unknown>)?.team_id ?? '';
  const conference = batting?.conference ?? pitching?.conference ?? '';
  const position = batting?.position ?? pitching?.position ?? '';
  const classYear = batting?.class_year ?? pitching?.class_year ?? '';
  const season = batting?.season ?? pitching?.season ?? 2026;
  const isBatter = batting !== null;
  const isPitcher = pitching !== null;
  const isTwoWay = isBatter && isPitcher;

  // Team logo from ESPN CDN
  const teamLogoUrl = teamId ? `https://a.espncdn.com/i/teamlogos/ncaa/500/${teamId}.png` : '';
  // YouTube highlight search
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${playerName} ${team} baseball highlights ${season}`)}`;
  // Headline stat for the hero card
  const headlineStat = isBatter
    ? { label: 'wOBA', value: batting?.woba != null ? `.${String(Math.round(batting.woba * 1000))}` : (batting ? `.${String(Math.round(batting.avg * 1000))}` : '') }
    : { label: 'FIP', value: pitching?.fip != null ? String(pitching.fip.toFixed(2)) : (pitching ? pitching.era.toFixed(2) : '') };

  return (
    <>
      <div>
        <section
          className="relative overflow-hidden"
          style={{ padding: 'clamp(1.5rem, 3vw, 2.5rem) 0' }}
        >
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.15)] to-transparent" />

          {/* Team logo watermark — large, faded behind the content */}
          {teamLogoUrl && (
            <div className="absolute right-0 top-0 bottom-0 w-[300px] sm:w-[400px] pointer-events-none overflow-hidden" aria-hidden="true">
              <img
                src={teamLogoUrl}
                alt=""
                className="absolute right-[-40px] top-1/2 -translate-y-1/2 w-[280px] sm:w-[360px] opacity-[0.04]"
                loading="eager"
              />
            </div>
          )}

          <Container size="lg">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs mb-6" style={{ fontFamily: 'var(--bsi-font-data)', color: 'var(--bsi-dust)' }}>
              <Link href="/" className="transition-colors hover:text-[var(--bsi-bone)]">Home</Link>
              <span>/</span>
              <Link href="/college-baseball" className="transition-colors hover:text-[var(--bsi-bone)]">College Baseball</Link>
              <span>/</span>
              <Link href="/college-baseball/savant" className="transition-colors hover:text-[var(--bsi-bone)]">Savant</Link>
              <span>/</span>
              <span style={{ color: 'var(--bsi-primary)' }}>{playerName}</span>
            </nav>

            <ScrollReveal direction="up" delay={50}>
              {/* Player header — scouting card layout */}
              <div className="mb-8 flex items-start gap-5 sm:gap-8">
                {/* Team logo + player avatar area */}
                <div className="flex-shrink-0 relative">
                  {teamLogoUrl && (
                    <div
                      className="w-20 h-20 sm:w-28 sm:h-28 rounded-sm border overflow-hidden flex items-center justify-center"
                      style={{
                        background: 'var(--surface-press-box, #111111)',
                        borderColor: 'var(--border-vintage, rgba(140,98,57,0.3))',
                      }}
                    >
                      <img
                        src={teamLogoUrl}
                        alt={`${team} logo`}
                        className="w-14 h-14 sm:w-20 sm:h-20 object-contain"
                        loading="eager"
                      />
                    </div>
                  )}
                  {/* Position badge overlaid on logo */}
                  {position && position !== 'UN' && (
                    <span
                      className="absolute -bottom-1.5 -right-1.5 text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-sm"
                      style={{ background: 'var(--bsi-primary)', color: '#fff' }}
                    >
                      {position}
                    </span>
                  )}
                </div>

                {/* Name and metadata */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs font-medium" style={{ color: 'var(--bsi-bone)' }}>{team}</span>
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
                    {isTwoWay && (
                      <span
                        className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm"
                        style={{ background: 'rgba(191,87,0,0.15)', color: 'var(--bsi-primary)' }}
                      >
                        Two-Way
                      </span>
                    )}
                  </div>
                  <h1
                    className="font-bold uppercase tracking-tight leading-none mb-2"
                    style={{
                      fontFamily: 'var(--font-syne, var(--bsi-font-display-hero))',
                      fontSize: 'clamp(1.75rem, 5vw, 3.5rem)',
                      color: 'var(--bsi-bone)',
                  }}
                >
                  {playerName}
                </h1>
                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                    <p className="text-sm" style={{ color: 'var(--bsi-dust)' }}>
                      {season} Season
                    </p>

                    {/* Headline stat pill */}
                    {headlineStat.value && (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-mono font-bold"
                        style={{
                          background: 'rgba(191,87,0,0.12)',
                          color: 'var(--bsi-primary)',
                          border: '1px solid rgba(191,87,0,0.2)',
                        }}
                      >
                        {headlineStat.label}
                        <span style={{ color: 'var(--bsi-bone)' }}>{headlineStat.value}</span>
                      </span>
                    )}

                    {/* YouTube highlights link */}
                    <a
                      href={youtubeSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs transition-colors hover:text-[var(--bsi-primary)]"
                      style={{ color: 'var(--bsi-dust)' }}
                    >
                      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor">
                        <path d="M14.7 4.5a1.8 1.8 0 0 0-1.3-1.3C12.2 3 8 3 8 3s-4.2 0-5.4.3A1.8 1.8 0 0 0 1.3 4.5C1 5.7 1 8 1 8s0 2.3.3 3.5a1.8 1.8 0 0 0 1.3 1.2C3.8 13 8 13 8 13s4.2 0 5.4-.3a1.8 1.8 0 0 0 1.3-1.2c.3-1.2.3-3.5.3-3.5s0-2.3-.3-3.5zM6.5 10.2V5.8L10.2 8l-3.7 2.2z" />
                      </svg>
                      Highlights
                    </a>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Batting section */}
            {isBatter && (
              <ScrollReveal direction="up" delay={100}>
                <PercentileSection
                  title="Batting Percentiles"
                  stats={batting as unknown as Record<string, unknown>}
                  metrics={BATTING_METRICS}
                  percentileData={percentiles.batting}
                  isPro={isPro}
                />
              </ScrollReveal>
            )}

            {/* Pitching section */}
            {isPitcher && (
              <ScrollReveal direction="up" delay={isBatter ? 150 : 100}>
                <PercentileSection
                  title="Pitching Percentiles"
                  stats={pitching as unknown as Record<string, unknown>}
                  metrics={PITCHING_METRICS}
                  percentileData={percentiles.pitching}
                  isPro={isPro}
                />
              </ScrollReveal>
            )}

            {/* Scouting Grades */}
            <ScrollReveal direction="up" delay={200}>
              <ScoutingGrades
                batting={percentiles.batting}
                pitching={percentiles.pitching}
                isBatter={isBatter}
                isPitcher={isPitcher}
                isPro={isPro}
              />
            </ScrollReveal>

            {/* Scouting Composite — radar chart */}
            <PlayerScoutingComposite
              playerId={playerId}
              position={isBatter && !isPitcher ? 'hitter' : 'pitcher'}
              className="mb-6"
            />

            {/* Raw stat lines */}
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
}: {
  title: string;
  stats: Record<string, unknown>;
  metrics: MetricConfig[];
  percentileData: Record<string, number> | null;
  isPro: boolean;
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
          borderTop: '2px solid var(--bsi-primary, #BF5700)',
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
