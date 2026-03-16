'use client';

import { useState, useMemo, useCallback } from 'react';
import { MetricGate } from '@/components/analytics/MetricGate';
import Link from 'next/link';
import { useSportData } from '@/lib/hooks/useSportData';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import {
  SavantLeaderboard,
  BATTING_COLUMNS,
  PITCHING_COLUMNS,
  fmt3,
  fmt2,
  fmtInt,
} from '@/components/analytics/SavantLeaderboard';
import { ParkFactorTable } from '@/components/analytics/ParkFactorTable';
import { ConferenceStrengthChart } from '@/components/analytics/ConferenceStrengthChart';
import { getPercentileColor } from '@/components/analytics/PercentileBar';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { HeroGlow } from '@/components/ui/HeroGlow';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = 'batting' | 'pitching' | 'park-factors' | 'conference';

interface LeaderboardResponse {
  data: Record<string, unknown>[];
  total?: number;
  meta: { source: string; fetched_at: string; timezone: string };
}

interface ParkFactorRow {
  team: string;
  venue_name: string | null;
  conference: string | null;
  runs_factor: number;
  hits_factor?: number;
  hr_factor?: number;
  sample_games: number;
}

interface ConferenceRow {
  conference: string;
  strength_index: number;
  avg_era: number;
  avg_ops: number;
  avg_woba: number;
  is_power: number;
}

// ---------------------------------------------------------------------------
// Tab config
// ---------------------------------------------------------------------------

const TABS: { key: Tab; label: string }[] = [
  { key: 'batting', label: 'Batting' },
  { key: 'pitching', label: 'Pitching' },
  { key: 'park-factors', label: 'Park Factors' },
  { key: 'conference', label: 'Conference Strength' },
];

// ---------------------------------------------------------------------------
// Spotlight card definitions
// ---------------------------------------------------------------------------

interface SpotlightDef {
  metricKey: string;
  label: string;
  abbr: string;
  description: string;
  format: (v: number) => string;
  higherIsBetter: boolean;
  tab: 'batting' | 'pitching';
}

const SPOTLIGHT_DEFS: SpotlightDef[] = [
  {
    metricKey: 'woba', label: 'Weighted On-Base Average', abbr: 'wOBA',
    description: 'Best single batting metric publicly available. Weights each way of reaching base by run value.',
    format: fmt3, higherIsBetter: true, tab: 'batting',
  },
  {
    metricKey: 'wrc_plus', label: 'Weighted Runs Created+', abbr: 'wRC+',
    description: 'Park-adjusted, 100 = league average. 150 means 50% better than average.',
    format: fmtInt, higherIsBetter: true, tab: 'batting',
  },
  {
    metricKey: 'fip', label: 'Fielding Independent Pitching', abbr: 'FIP',
    description: 'Isolates what the pitcher controls: K, BB, HBP, HR. Strips defense and luck on balls in play.',
    format: fmt2, higherIsBetter: false, tab: 'pitching',
  },
  {
    metricKey: 'era_minus', label: 'ERA Minus', abbr: 'ERA-',
    description: 'Park-adjusted ERA on a 100 scale. 80 = 20% better than league average. Lower is better.',
    format: fmtInt, higherIsBetter: false, tab: 'pitching',
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SavantHubPage() {
  const [activeTab, setActiveTab] = useState<Tab>('batting');
  const [conferenceFilter, setConferenceFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [playerSearch, setPlayerSearch] = useState('');

  const { data: battingRes, loading: battingLoading } =
    useSportData<LeaderboardResponse>('/api/savant/batting/leaderboard?limit=100');
  const { data: pitchingRes, loading: pitchingLoading } =
    useSportData<LeaderboardResponse>('/api/savant/pitching/leaderboard?limit=100');
  const { data: parkRes, loading: parkLoading } =
    useSportData<{ data: ParkFactorRow[] }>('/api/savant/park-factors');
  const { data: confRes, loading: confLoading } =
    useSportData<{ data: ConferenceRow[]; total?: number }>('/api/savant/conference-strength');

  // Derive tier from API response — worker sets _tier_gated on free-tier rows
  const isPro = useMemo(() => {
    const firstRow = battingRes?.data?.[0] ?? pitchingRes?.data?.[0];
    return firstRow ? (firstRow as Record<string, unknown>)._tier_gated !== true : false;
  }, [battingRes, pitchingRes]);

  // ── Derived filter options ──
  const conferences = useMemo(() => {
    const confs = new Set<string>();
    for (const row of battingRes?.data ?? []) {
      if (row.conference) confs.add(row.conference as string);
    }
    for (const row of pitchingRes?.data ?? []) {
      if (row.conference) confs.add(row.conference as string);
    }
    return ['', ...Array.from(confs).sort()];
  }, [battingRes, pitchingRes]);

  const positions = useMemo(() => {
    const pos = new Set<string>();
    const source = activeTab === 'pitching' ? pitchingRes?.data : battingRes?.data;
    for (const row of source ?? []) {
      if (row.position) pos.add(row.position as string);
    }
    return ['', ...Array.from(pos).sort()];
  }, [activeTab, battingRes, pitchingRes]);

  // ── Apply client-side filters ──
  const applyFilters = useCallback((rows: Record<string, unknown>[]): Record<string, unknown>[] => {
    let filtered = rows;
    if (conferenceFilter) {
      filtered = filtered.filter(r => r.conference === conferenceFilter);
    }
    if (positionFilter) {
      filtered = filtered.filter(r => r.position === positionFilter);
    }
    if (playerSearch.trim()) {
      const q = playerSearch.trim().toLowerCase();
      filtered = filtered.filter(
        r =>
          (r.player_name as string)?.toLowerCase().includes(q) ||
          (r.team as string)?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [conferenceFilter, positionFilter, playerSearch]);

  const filteredBatting = useMemo(() => applyFilters(battingRes?.data ?? []), [applyFilters, battingRes]);
  const filteredPitching = useMemo(() => applyFilters(pitchingRes?.data ?? []), [applyFilters, pitchingRes]);

  return (
    <>
      <div>
        <section
          className="relative overflow-hidden savant-ambient"
          style={{
            padding: 'clamp(2rem, 4vw, 3rem) 0',
          }}
        >
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.15)] to-transparent" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs mb-6" style={{ fontFamily: 'var(--bsi-font-data)', color: 'var(--bsi-dust)' }}>
              <Link href="/" className="transition-colors hover:text-[var(--bsi-bone)]">Home</Link>
              <span>/</span>
              <Link href="/college-baseball" className="transition-colors hover:text-[var(--bsi-bone)]">College Baseball</Link>
              <span>/</span>
              <span style={{ color: 'var(--bsi-primary)' }}>Savant</span>
            </nav>

            {/* Hero */}
            <ScrollReveal direction="up" delay={50}>
              <div className="mb-10">
                <span className="heritage-stamp mb-3">Advanced Analytics</span>
                <h1
                  className="mt-3 font-bold uppercase tracking-tight leading-none mb-4 font-savant-display"
                  style={{
                    fontFamily: 'var(--font-syne, var(--bsi-font-display-hero))',
                    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                    color: 'var(--bsi-bone)',
                    textShadow: '1px 1px 0px rgba(0,0,0,0.5)',
                  }}
                >
                  College Baseball <span style={{ color: 'var(--bsi-primary)' }}>Savant</span>
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-relaxed font-serif italic" style={{ color: 'var(--bsi-dust)' }}>
                  The metrics MLB Savant tracks — wOBA, FIP, wRC+, park factors, conference
                  strength indices — applied to 300+ D1 programs. No other public platform
                  does this for the college game.
                </p>
                <div className="mt-5 flex items-center gap-6 flex-wrap">
                  <Link
                    href="/college-baseball/savant/visuals"
                    className="inline-flex items-center gap-2 text-sm transition-colors group"
                    style={{ color: 'var(--bsi-primary)' }}
                  >
                    <span className="uppercase tracking-wider" style={{ fontFamily: 'var(--bsi-font-display)' }}>Interactive Visuals</span>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link
                    href="/college-baseball/savant/glossary"
                    className="inline-flex items-center gap-2 text-sm transition-colors group"
                    style={{ color: 'var(--svt-text-muted, var(--bsi-dust))' }}
                  >
                    <span className="uppercase tracking-wider" style={{ fontFamily: 'var(--bsi-font-display)' }}>Glossary</span>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link
                    href="/college-baseball/savant/methodology"
                    className="inline-flex items-center gap-2 text-sm transition-colors group"
                    style={{ color: 'var(--svt-text-muted, var(--bsi-dust))' }}
                  >
                    <span className="uppercase tracking-wider" style={{ fontFamily: 'var(--bsi-font-display)' }}>Methodology</span>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link
                    href="/college-baseball/savant/conference-comparison"
                    className="inline-flex items-center gap-2 text-sm transition-colors group"
                    style={{ color: 'var(--svt-text-muted, var(--bsi-dust))' }}
                  >
                    <span className="uppercase tracking-wider" style={{ fontFamily: 'var(--bsi-font-display)' }}>Compare Conferences</span>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <a
                    href="https://labs.blazesportsintel.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm transition-colors group"
                    style={{ color: 'var(--bsi-dust)' }}
                  >
                    <span className="uppercase tracking-wider" style={{ fontFamily: 'var(--bsi-font-display)' }}>Labs Portal</span>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M7 17L17 7M17 7H7M17 7v10" />
                    </svg>
                  </a>
                </div>
              </div>
            </ScrollReveal>

            {/* Data Coverage — inline note, not boxed */}
            <div className="mb-8 flex items-start gap-3 pl-4" style={{ borderLeft: '2px solid rgba(191, 87, 0, 0.2)' }}>
              <p className="text-[11px] leading-relaxed" style={{ fontFamily: 'var(--bsi-font-data)', color: 'var(--bsi-dust)' }}>
                {confLoading ? '...' : `${confRes?.total ?? confRes?.data?.length ?? 22} conferences tracked`} · ESPN box scores + Highlightly Pro · Recomputed every 6 hours
              </p>
            </div>

            <DataErrorBoundary name="Savant Analytics">
            {/* Spotlight cards — dynamic, data-driven */}
            <ScrollReveal direction="up" delay={100}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {SPOTLIGHT_DEFS.map((spot, index) => {
                  const source = spot.tab === 'batting' ? battingRes?.data : pitchingRes?.data;
                  const leader = findLeader(source ?? [], spot.metricKey, spot.higherIsBetter);
                  const pctl = leader ? computeQuickPercentile(source ?? [], spot.metricKey, leader.value, spot.higherIsBetter) : 50;
                  const color = getPercentileColor(pctl, spot.higherIsBetter);

                  return (
                    <div
                      key={spot.metricKey}
                      className="savant-fade-in relative overflow-hidden rounded-sm bg-[rgba(26,26,26,0.6)] border border-[rgba(245,240,235,0.04)] hover:border-[var(--svt-accent)]/30 transition-all p-4"
                      style={{ borderLeftColor: color, borderLeftWidth: '2px', animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="font-mono text-xs font-bold tracking-wide" style={{ color }}>{spot.abbr}</span>
                        <span className="text-[9px] font-mono text-text-muted uppercase">{spot.tab}</span>
                      </div>
                      <MetricGate isPro={isPro} metricName={spot.label}>
                        {leader ? (
                          <div className="mb-2.5">
                            <span className="block text-2xl font-mono font-bold tabular-nums leading-none" style={{ color }}>
                              {spot.format(leader.value)}
                            </span>
                            <div className="mt-1.5">
                              <span className="text-xs text-text-primary font-medium">{leader.name}</span>
                              <span className="ml-1.5 text-[10px] text-text-muted">{leader.team}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="mb-2.5 h-14 flex items-center">
                            <div className="h-6 w-16 bg-surface-light rounded-sm animate-pulse" />
                          </div>
                        )}
                      </MetricGate>
                      <p className="text-[10px] text-text-muted/70 leading-relaxed">
                        {spot.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </ScrollReveal>

            {/* Tab navigation — immediate, no animation */}
            <div className="flex items-center gap-0.5 border-b border-border mb-4 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setPositionFilter(''); }}
                  className={`px-4 py-3 text-sm font-display uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${
                    activeTab === tab.key
                      ? 'text-burnt-orange border-burnt-orange bg-burnt-orange/[0.04]'
                      : 'text-text-muted border-transparent hover:text-text-tertiary hover:bg-white/[0.02]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filters — shown for batting/pitching tabs */}
            {(activeTab === 'batting' || activeTab === 'pitching') && (
              <ScrollReveal direction="up" delay={175}>
                <div className="flex items-center gap-3 mb-6 flex-wrap">
                  <FilterSelect
                    label="Conference"
                    value={conferenceFilter}
                    onChange={setConferenceFilter}
                    options={conferences}
                    allLabel="All Conferences"
                  />
                  <FilterSelect
                    label="Position"
                    value={positionFilter}
                    onChange={setPositionFilter}
                    options={positions}
                    allLabel="All Positions"
                  />
                  <div className="flex items-center gap-1.5 ml-auto">
                    <input
                      type="text"
                      value={playerSearch}
                      onChange={(e) => setPlayerSearch(e.target.value)}
                      placeholder="Search player or team..."
                      className="px-3 py-1.5 text-xs font-mono w-48 sm:w-56 outline-none placeholder:text-text-muted"
                      style={{
                        background: 'var(--surface-press-box, #111)',
                        color: 'var(--bsi-bone, #F5F2EB)',
                        border: '1px solid var(--border-vintage, rgba(140,98,57,0.3))',
                      }}
                      aria-label="Search players or teams"
                    />
                    {isPro ? (
                      <a
                        href={`/api/savant/${activeTab === 'pitching' ? 'pitching' : 'batting'}/export?format=csv${conferenceFilter ? `&conference=${encodeURIComponent(conferenceFilter)}` : ''}`}
                        download
                        className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider whitespace-nowrap transition-colors hover:opacity-80"
                        style={{
                          background: 'var(--bsi-primary, #BF5700)',
                          color: 'var(--bsi-bone, #F5F2EB)',
                        }}
                      >
                        Export CSV
                      </a>
                    ) : (
                      <Link
                        href="/pricing"
                        className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider whitespace-nowrap transition-colors hover:opacity-80"
                        style={{
                          background: 'var(--surface-press-box, #111)',
                          color: 'var(--bsi-dust, #C4B8A5)',
                          border: '1px solid var(--border-vintage, rgba(140,98,57,0.3))',
                        }}
                        title="CSV export requires Pro subscription"
                      >
                        Export CSV ↗
                      </Link>
                    )}
                  </div>
                  {(conferenceFilter || positionFilter || playerSearch) && (
                    <button
                      onClick={() => { setConferenceFilter(''); setPositionFilter(''); setPlayerSearch(''); }}
                      className="text-[10px] font-mono text-burnt-orange hover:text-ember transition-colors"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </ScrollReveal>
            )}

            {/* Tab content */}
            <ScrollReveal direction="up" delay={200}>
              {activeTab === 'batting' && (
                battingLoading ? (
                  <LeaderboardSkeleton />
                ) : (
                  <SavantLeaderboard
                    data={filteredBatting}
                    columns={BATTING_COLUMNS}
                    title="Batting Leaders — Advanced"
                    isPro={isPro}
                    initialRows={25}
                  />
                )
              )}

              {activeTab === 'pitching' && (
                pitchingLoading ? (
                  <LeaderboardSkeleton />
                ) : (
                  <SavantLeaderboard
                    data={filteredPitching}
                    columns={PITCHING_COLUMNS}
                    title="Pitching Leaders — Advanced"
                    isPro={isPro}
                    initialRows={25}
                  />
                )
              )}

              {activeTab === 'park-factors' && (
                parkLoading ? (
                  <LeaderboardSkeleton />
                ) : (
                  <ParkFactorTable
                    data={parkRes?.data ?? []}
                    isPro={isPro}
                  />
                )
              )}

              {activeTab === 'conference' && (
                confLoading ? (
                  <LeaderboardSkeleton />
                ) : (
                  <ConferenceStrengthChart
                    data={confRes?.data ?? []}
                    isPro={isPro}
                    total={confRes?.total}
                  />
                )
              )}
            </ScrollReveal>

            {/* Data attribution */}
            {battingRes && (
              <div className="mt-10 pt-6 border-t border-white/[0.06]">
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted/50">
                    Source: BSI Savant
                  </span>
                  <span className="text-text-muted/20">&middot;</span>
                  <Link
                    href="/college-baseball/savant/park-factors"
                    className="font-mono text-[10px] uppercase tracking-[0.12em] text-burnt-orange/50 hover:text-burnt-orange transition-colors"
                  >
                    Park Factor Methodology
                  </Link>
                  <span className="text-text-muted/20">&middot;</span>
                  <Link
                    href="/college-baseball/savant/conference-index"
                    className="font-mono text-[10px] uppercase tracking-[0.12em] text-burnt-orange/50 hover:text-burnt-orange transition-colors"
                  >
                    Conference Strength Index
                  </Link>
                  <span className="text-text-muted/20">&middot;</span>
                  <Link
                    href="/college-baseball/savant/glossary"
                    className="font-mono text-[10px] uppercase tracking-[0.12em] text-burnt-orange/50 hover:text-burnt-orange transition-colors"
                  >
                    Metric Glossary
                  </Link>
                </div>
              </div>
            )}
            </DataErrorBoundary>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}

// ---------------------------------------------------------------------------
// Filter dropdown
// ---------------------------------------------------------------------------

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  allLabel: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-display uppercase tracking-widest text-text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-surface-light border border-border rounded-sm px-2.5 py-1.5 text-xs text-text-tertiary font-mono appearance-none cursor-pointer hover:border-border-strong transition-colors focus:outline-none focus:border-burnt-orange/40"
      >
        {options.map(opt => (
          <option key={opt} value={opt} className="bg-background-secondary text-text-primary">
            {opt || allLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Spotlight helpers
// ---------------------------------------------------------------------------

function findLeader(
  data: Record<string, unknown>[],
  key: string,
  higherIsBetter: boolean,
): { name: string; team: string; value: number } | null {
  if (data.length === 0) return null;

  let best: Record<string, unknown> | null = null;
  let bestVal = higherIsBetter ? -Infinity : Infinity;

  for (const row of data) {
    const raw = row[key];
    if (raw == null || typeof raw !== 'number' || !Number.isFinite(raw)) continue;
    if (higherIsBetter ? raw > bestVal : raw < bestVal) {
      best = row;
      bestVal = raw;
    }
  }

  if (!best || !Number.isFinite(bestVal)) return null;

  return {
    name: best.player_name as string,
    team: best.team as string,
    value: bestVal,
  };
}

function computeQuickPercentile(
  data: Record<string, unknown>[],
  key: string,
  value: number,
  higherIsBetter: boolean,
): number {
  const values = data
    .map(r => r[key] as number)
    .filter(v => v != null && Number.isFinite(v))
    .sort((a, b) => a - b);

  if (values.length <= 1) return 50;
  const below = values.filter(v => (higherIsBetter ? v < value : v > value)).length;
  return (below / (values.length - 1)) * 100;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function LeaderboardSkeleton() {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
        <div className="h-4 w-48 bg-surface-medium rounded-sm animate-pulse" />
        <div className="h-3 w-20 bg-surface-light rounded-sm animate-pulse" />
      </div>
      <div className="divide-y divide-border-subtle">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="px-5 py-3 flex items-center gap-4">
            <div className="h-4 w-6 bg-surface-light rounded-sm animate-pulse" />
            <div className="h-4 flex-1 max-w-[200px] bg-surface-medium rounded-sm animate-pulse" />
            <div className="h-4 w-16 bg-surface-light rounded-sm animate-pulse hidden sm:block" />
            <div className="h-4 w-12 bg-surface-light rounded-sm animate-pulse" />
            <div className="h-4 w-12 bg-surface-light rounded-sm animate-pulse hidden md:block" />
          </div>
        ))}
      </div>
    </Card>
  );
}
