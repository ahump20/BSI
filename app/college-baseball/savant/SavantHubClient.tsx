'use client';

import { useState, useMemo, useCallback } from 'react';
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
import { SavantComparePanel } from '@/components/analytics/SavantComparePanel';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';

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

interface LeagueContext {
  season: number;
  computed_at: string;
  woba: number;
  obp: number;
  avg: number;
  slg: number;
  era: number;
  fip_constant: number;
  woba_scale: number;
  sample_batting: number;
  sample_pitching: number;
  weights_source: string;
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
  const [minPA, setMinPA] = useState(25);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());

  const { data: battingRes, loading: battingLoading } =
    useSportData<LeaderboardResponse>('/api/savant/batting/leaderboard?limit=100');
  const { data: pitchingRes, loading: pitchingLoading } =
    useSportData<LeaderboardResponse>('/api/savant/pitching/leaderboard?limit=100');
  const { data: parkRes, loading: parkLoading } =
    useSportData<{ data: ParkFactorRow[] }>('/api/savant/park-factors');
  const { data: confRes, loading: confLoading } =
    useSportData<{ data: ConferenceRow[]; total?: number }>('/api/savant/conference-strength');
  const { data: leagueCtxRes } =
    useSportData<{ context: LeagueContext }>('/api/savant/league-context');

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
    // Apply minimum PA/IP threshold
    if (minPA > 0) {
      filtered = filtered.filter(r => {
        const threshold = (r.pa as number) ?? (r.ip as number) ?? 0;
        return threshold >= minPA;
      });
    }
    return filtered;
  }, [conferenceFilter, positionFilter, playerSearch, minPA]);

  const filteredBatting = useMemo(() => applyFilters(battingRes?.data ?? []), [applyFilters, battingRes]);
  const filteredPitching = useMemo(() => applyFilters(pitchingRes?.data ?? []), [applyFilters, pitchingRes]);

  // Compare mode
  const handleCompareToggle = useCallback((playerId: string) => {
    setCompareIds(prev => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else if (next.size < 3) {
        next.add(playerId);
      }
      return next;
    });
  }, []);

  const comparePlayers = useMemo(() => {
    if (compareIds.size === 0) return [];
    const source = activeTab === 'pitching'
      ? (pitchingRes?.data ?? [])
      : (battingRes?.data ?? []);
    return source.filter(row => compareIds.has(row.player_id as string));
  }, [compareIds, activeTab, battingRes, pitchingRes]);

  const batterCount = filteredBatting.length || (battingRes?.data?.length ?? 0);
  const pitcherCount = filteredPitching.length || (pitchingRes?.data?.length ?? 0);
  const confCount = confRes?.total ?? confRes?.data?.length ?? 0;

  return (
    <>
      <div>
        <section className="relative overflow-hidden pt-6 pb-4">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

            {/* Compact title + trust strip */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="heritage-stamp">Savant</span>
                <h1
                  className="text-lg font-bold uppercase tracking-wide"
                  style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-bone)' }}
                >
                  D1 Sabermetrics
                </h1>
              </div>
              <p className="text-[10px] font-mono" style={{ color: 'var(--bsi-dust)' }}>
                {confLoading ? '...' : `${confCount} conferences`} · Updated every 6h
                {battingRes?.meta?.fetched_at && (
                  <> · {new Date(battingRes.meta.fetched_at).toLocaleString('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} CT</>
                )}
              </p>
            </div>

            {/* Hero stat pills — animated counters showing data scope */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: 'Batters', value: batterCount, color: 'var(--bsi-primary)' },
                { label: 'Pitchers', value: pitcherCount, color: 'var(--heritage-columbia-blue)' },
                { label: 'Conferences', value: confCount, color: 'var(--bsi-dust)' },
                { label: 'Parks', value: parkRes?.data?.length ?? 0, color: 'var(--bsi-success)' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="heritage-card p-3 flex flex-col items-center text-center"
                  style={{ borderTop: `2px solid ${stat.color}` }}
                >
                  <span
                    className="text-2xl font-bold tabular-nums"
                    style={{ fontFamily: 'var(--font-mono)', color: stat.color }}
                  >
                    {stat.value.toLocaleString()}
                  </span>
                  <span
                    className="text-[9px] uppercase tracking-[0.15em] mt-1"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--bsi-dust)' }}
                  >
                    {stat.label}
                  </span>
                </div>
              ))}
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
                      className="savant-fade-in relative overflow-hidden rounded-sm bg-[var(--surface-dugout)] border border-[var(--border-vintage)] hover:border-[rgba(140,98,57,0.5)] transition-all p-4"
                      style={{ borderLeftColor: color, borderLeftWidth: '2px', animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="font-mono text-xs font-bold tracking-wide" style={{ color }}>{spot.abbr}</span>
                        <span className="text-[9px] font-mono text-[rgba(196,184,165,0.35)] uppercase">{spot.tab}</span>
                      </div>
                      {leader ? (
                        <div className="mb-2.5">
                          <span className="block text-2xl font-mono font-bold tabular-nums leading-none" style={{ color }}>
                            {spot.format(leader.value)}
                          </span>
                          <div className="mt-1.5">
                            <span className="text-xs text-[var(--bsi-bone)] font-medium">{leader.name}</span>
                            <span className="ml-1.5 text-[10px] text-[rgba(196,184,165,0.35)]">{leader.team}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-2.5 h-14 flex items-center">
                          <div className="h-6 w-16 bg-[var(--surface-press-box)] rounded-sm animate-pulse" />
                        </div>
                      )}
                      <p className="text-[10px] text-[rgba(196,184,165,0.35)]/70 leading-relaxed">
                        {spot.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </ScrollReveal>

            {/* 2026 D1 Run Environment — the baseline that makes every stat meaningful */}
            {leagueCtxRes?.context && (
              <ScrollReveal direction="up" delay={150}>
                <div className="mb-6 rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-dugout)] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="heritage-stamp text-[9px]">2026 D1 Run Environment</span>
                    <span className="text-[9px] text-[rgba(196,184,165,0.35)] font-mono">
                      {leagueCtxRes.context.sample_batting.toLocaleString()} batters · {leagueCtxRes.context.sample_pitching.toLocaleString()} pitchers
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                    {[
                      { label: 'Lg wOBA', value: leagueCtxRes.context.woba.toFixed(3) },
                      { label: 'Lg AVG', value: leagueCtxRes.context.avg.toFixed(3) },
                      { label: 'Lg OBP', value: leagueCtxRes.context.obp.toFixed(3) },
                      { label: 'Lg SLG', value: leagueCtxRes.context.slg.toFixed(3) },
                      { label: 'Lg ERA', value: leagueCtxRes.context.era.toFixed(2) },
                      { label: 'FIP Const', value: leagueCtxRes.context.fip_constant.toFixed(2) },
                    ].map((stat) => (
                      <div key={stat.label}>
                        <div className="font-mono text-sm font-bold" style={{ color: 'var(--bsi-bone)' }}>{stat.value}</div>
                        <div className="text-[9px] text-[rgba(196,184,165,0.35)]/60 uppercase tracking-wider">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-[rgba(196,184,165,0.35)]/40 mt-3 leading-relaxed">
                    Every metric on this page is normalized against these baselines. A 100 wRC+ means exactly league average for the {leagueCtxRes.context.season} D1 season. Weights derived from actual D1 data, not MLB defaults.
                  </p>
                </div>
              </ScrollReveal>
            )}

            {/* Tab navigation — immediate, no animation */}
            <div className="flex items-center gap-0.5 border-b border-[var(--border-vintage)] mb-4 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setPositionFilter(''); setCompareIds(new Set()); }}
                  className={`px-4 py-3 text-sm font-display uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${
                    activeTab === tab.key
                      ? 'text-[var(--bsi-primary)] border-[var(--bsi-primary)] bg-[var(--bsi-primary)]/[0.04]'
                      : 'text-[rgba(196,184,165,0.35)] border-transparent hover:text-[rgba(196,184,165,0.5)] hover:bg-[rgba(140,98,57,0.06)]'
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
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--bsi-dust, #C4B8A5)' }}>
                      Min {activeTab === 'pitching' ? 'IP' : 'PA'}:
                    </span>
                    <select
                      value={minPA}
                      onChange={(e) => setMinPA(Number(e.target.value))}
                      className="px-2 py-1 text-xs font-mono appearance-none cursor-pointer"
                      style={{
                        background: 'var(--surface-press-box, #111)',
                        color: 'var(--bsi-bone, #F5F2EB)',
                        border: '1px solid var(--border-vintage, rgba(140,98,57,0.3))',
                      }}
                      aria-label={`Minimum ${activeTab === 'pitching' ? 'innings pitched' : 'plate appearances'}`}
                    >
                      <option value={0}>Any</option>
                      <option value={10}>10+</option>
                      <option value={25}>25+</option>
                      <option value={50}>50+</option>
                      <option value={75}>75+</option>
                      <option value={100}>100+</option>
                      <option value={150}>150+</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <input
                      type="text"
                      value={playerSearch}
                      onChange={(e) => setPlayerSearch(e.target.value)}
                      placeholder="Search player or team..."
                      className="px-3 py-1.5 text-xs font-mono w-48 sm:w-56 outline-none placeholder:text-[rgba(196,184,165,0.35)]"
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
                  {(conferenceFilter || positionFilter || playerSearch || minPA !== 25) && (
                    <button
                      onClick={() => { setConferenceFilter(''); setPositionFilter(''); setPlayerSearch(''); setMinPA(25); }}
                      className="text-[10px] font-mono text-[var(--bsi-primary)] hover:text-[var(--bsi-primary)] transition-colors"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </ScrollReveal>
            )}

            {/* Compare mode indicator */}
            {compareIds.size > 0 && (activeTab === 'batting' || activeTab === 'pitching') && (
              <div
                className="flex items-center justify-between px-4 py-2 mb-4 rounded-sm"
                style={{
                  background: 'rgba(191,87,0,0.08)',
                  border: '1px solid rgba(191,87,0,0.2)',
                }}
              >
                <span className="text-xs font-mono" style={{ color: 'var(--bsi-bone)' }}>
                  <span style={{ color: 'var(--bsi-primary)' }}>{compareIds.size}</span> of 3 players selected
                  {compareIds.size < 2 && ' — select at least 2 to compare'}
                </span>
                <button
                  onClick={() => setCompareIds(new Set())}
                  className="text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer"
                  style={{ color: 'var(--bsi-primary)' }}
                >
                  Clear
                </button>
              </div>
            )}

            {/* Compare panel */}
            {comparePlayers.length >= 2 && (activeTab === 'batting' || activeTab === 'pitching') && (
              <ScrollReveal direction="up" delay={175}>
                <SavantComparePanel
                  players={comparePlayers as { player_id: string; player_name: string; team: string; position: string; [key: string]: unknown }[]}
                  columns={activeTab === 'pitching' ? PITCHING_COLUMNS : BATTING_COLUMNS}
                  allData={activeTab === 'pitching' ? (pitchingRes?.data ?? []) : (battingRes?.data ?? [])}
                  isPro={isPro}
                  onRemove={(id) => handleCompareToggle(id)}
                  onClear={() => setCompareIds(new Set())}
                />
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
                    initialRows={50}
                    defaultSortKey="woba"
                    compareSelected={compareIds}
                    onCompareToggle={handleCompareToggle}
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
                    initialRows={50}
                    defaultSortKey="fip"
                    compareSelected={compareIds}
                    onCompareToggle={handleCompareToggle}
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
              <div className="mt-10 pt-6 border-t border-[var(--border-vintage)]">
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[rgba(196,184,165,0.35)]/50">
                    Source: BSI Savant
                  </span>
                  <span className="text-[rgba(196,184,165,0.35)]/20">&middot;</span>
                  <Link
                    href="/college-baseball/savant/park-factors"
                    className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--bsi-primary)]/50 hover:text-[var(--bsi-primary)] transition-colors"
                  >
                    Park Factor Methodology
                  </Link>
                  <span className="text-[rgba(196,184,165,0.35)]/20">&middot;</span>
                  <Link
                    href="/college-baseball/savant/conference-index"
                    className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--bsi-primary)]/50 hover:text-[var(--bsi-primary)] transition-colors"
                  >
                    Conference Strength Index
                  </Link>
                  <span className="text-[rgba(196,184,165,0.35)]/20">&middot;</span>
                  <Link
                    href="/college-baseball/savant/glossary"
                    className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--bsi-primary)]/50 hover:text-[var(--bsi-primary)] transition-colors"
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
      <span className="text-[10px] font-display uppercase tracking-widest text-[rgba(196,184,165,0.35)]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`Filter by ${label.toLowerCase()}`}
        className="bg-[var(--surface-press-box)] border border-[var(--border-vintage)] rounded-sm px-2.5 py-1.5 text-xs text-[rgba(196,184,165,0.5)] font-mono appearance-none cursor-pointer hover:border-[rgba(140,98,57,0.5)] transition-colors focus:outline-none focus:border-[var(--bsi-primary)]/40 focus:ring-1 focus:ring-[var(--bsi-primary)]/30"
      >
        {options.map(opt => (
          <option key={opt} value={opt} className="bg-[var(--surface-dugout)] text-[var(--bsi-bone)]">
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
      <div className="px-5 py-4 border-b border-[var(--border-vintage)] flex items-center justify-between">
        <div className="h-4 w-48 bg-surface-medium rounded-sm animate-pulse" />
        <div className="h-3 w-20 bg-[var(--surface-press-box)] rounded-sm animate-pulse" />
      </div>
      <div className="divide-y divide-[var(--border-vintage)]">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="px-5 py-3 flex items-center gap-4">
            <div className="h-4 w-6 bg-[var(--surface-press-box)] rounded-sm animate-pulse" />
            <div className="h-4 flex-1 max-w-[200px] bg-surface-medium rounded-sm animate-pulse" />
            <div className="h-4 w-16 bg-[var(--surface-press-box)] rounded-sm animate-pulse hidden sm:block" />
            <div className="h-4 w-12 bg-[var(--surface-press-box)] rounded-sm animate-pulse" />
            <div className="h-4 w-12 bg-[var(--surface-press-box)] rounded-sm animate-pulse hidden md:block" />
          </div>
        ))}
      </div>
    </Card>
  );
}
