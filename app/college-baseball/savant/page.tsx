'use client';

import { useState, useMemo } from 'react';
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

  const { data: battingRes, loading: battingLoading } =
    useSportData<LeaderboardResponse>('/api/savant/batting/leaderboard?limit=100');
  const { data: pitchingRes, loading: pitchingLoading } =
    useSportData<LeaderboardResponse>('/api/savant/pitching/leaderboard?limit=100');
  const { data: parkRes, loading: parkLoading } =
    useSportData<{ data: ParkFactorRow[] }>('/api/savant/park-factors');
  const { data: confRes, loading: confLoading } =
    useSportData<{ data: ConferenceRow[] }>('/api/savant/conference-strength');

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
  function applyFilters(rows: Record<string, unknown>[]): Record<string, unknown>[] {
    let filtered = rows;
    if (conferenceFilter) {
      filtered = filtered.filter(r => r.conference === conferenceFilter);
    }
    if (positionFilter) {
      filtered = filtered.filter(r => r.position === positionFilter);
    }
    return filtered;
  }

  const filteredBatting = useMemo(() => applyFilters(battingRes?.data ?? []), [battingRes, conferenceFilter, positionFilter]);
  const filteredPitching = useMemo(() => applyFilters(pitchingRes?.data ?? []), [pitchingRes, conferenceFilter, positionFilter]);

  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-24">
          <Container size="wide">
            {/* Breadcrumb */}
            <ScrollReveal direction="up">
              <nav className="flex items-center gap-2 text-sm mb-6">
                <Link href="/" className="text-text-muted hover:text-burnt-orange transition-colors">
                  Home
                </Link>
                <span className="text-text-muted">/</span>
                <Link
                  href="/college-baseball"
                  className="text-text-muted hover:text-burnt-orange transition-colors"
                >
                  College Baseball
                </Link>
                <span className="text-text-muted">/</span>
                <span className="text-text-secondary">Savant</span>
              </nav>
            </ScrollReveal>

            {/* Hero */}
            <ScrollReveal direction="up" delay={50}>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="accent" size="sm">ADVANCED ANALYTICS</Badge>
                </div>
                <h1 className="font-display text-3xl md:text-5xl font-bold uppercase tracking-wider text-text-primary">
                  College Baseball <span className="text-burnt-orange">Savant</span>
                </h1>
                <p className="text-text-tertiary mt-3 max-w-2xl text-base leading-relaxed">
                  The metrics MLB Savant tracks — wOBA, FIP, wRC+, park factors, conference
                  strength indices — applied to 300+ D1 programs. No other public platform
                  does this for the college game.
                </p>
              </div>
            </ScrollReveal>

            {/* Data Coverage Banner */}
            <ScrollReveal direction="up" delay={75}>
              <Card padding="sm" className="mb-8 border-border-subtle">
                <p className="text-[11px] font-mono text-text-muted leading-relaxed">
                  Data coverage: SEC, ACC, Big 12, Big Ten — sourced from ESPN box scores (~30% of D1 games).
                  Full D1 coverage coming via Highlightly Pro integration.
                </p>
              </Card>
            </ScrollReveal>

            {/* Spotlight cards — dynamic, data-driven */}
            <ScrollReveal direction="up" delay={100}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {SPOTLIGHT_DEFS.map(spot => {
                  const source = spot.tab === 'batting' ? battingRes?.data : pitchingRes?.data;
                  const leader = findLeader(source ?? [], spot.metricKey, spot.higherIsBetter);
                  const pctl = leader ? computeQuickPercentile(source ?? [], spot.metricKey, leader.value, spot.higherIsBetter) : 50;
                  const color = getPercentileColor(pctl, spot.higherIsBetter);

                  return (
                    <Card key={spot.metricKey} padding="md" className="relative overflow-hidden">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-display text-2xl font-bold" style={{ color }}>{spot.abbr}</span>
                      </div>
                      {leader ? (
                        <div className="mb-2">
                          <span className="text-sm text-text-primary font-medium">{leader.name}</span>
                          <span className="ml-1.5 text-[10px] text-text-muted">{leader.team}</span>
                          <span className="block text-lg font-mono font-bold tabular-nums mt-0.5" style={{ color }}>
                            {spot.format(leader.value)}
                          </span>
                        </div>
                      ) : (
                        <div className="mb-2 h-12 flex items-center">
                          <span className="text-xs text-text-muted">Loading...</span>
                        </div>
                      )}
                      <p className="text-[10px] text-text-muted leading-relaxed">
                        {spot.description}
                      </p>
                    </Card>
                  );
                })}
              </div>
            </ScrollReveal>

            {/* Tab navigation */}
            <ScrollReveal direction="up" delay={150}>
              <div className="flex items-center gap-1 border-b border-border mb-4 overflow-x-auto">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => { setActiveTab(tab.key); setPositionFilter(''); }}
                    className={`px-4 py-3 text-sm font-display uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${
                      activeTab === tab.key
                        ? 'text-burnt-orange border-burnt-orange'
                        : 'text-text-muted border-transparent hover:text-text-tertiary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </ScrollReveal>

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
                  {(conferenceFilter || positionFilter) && (
                    <button
                      onClick={() => { setConferenceFilter(''); setPositionFilter(''); }}
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
                    isPro={false}
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
                    isPro={false}
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
                    isPro={false}
                  />
                )
              )}

              {activeTab === 'conference' && (
                confLoading ? (
                  <LeaderboardSkeleton />
                ) : (
                  <ConferenceStrengthChart
                    data={confRes?.data ?? []}
                    isPro={false}
                  />
                )
              )}
            </ScrollReveal>

            {/* Data attribution */}
            {battingRes && (
              <div className="mt-8 text-center text-xs text-text-muted">
                <p>
                  Source: BSI College Baseball Savant | Methodology:{' '}
                  <Link
                    href="/college-baseball/savant/park-factors"
                    className="text-burnt-orange hover:text-ember transition-colors"
                  >
                    Park Factors
                  </Link>
                  {' · '}
                  <Link
                    href="/college-baseball/savant/conference-index"
                    className="text-burnt-orange hover:text-ember transition-colors"
                  >
                    Conference Strength
                  </Link>
                </p>
              </div>
            )}
          </Container>
        </Section>
      </main>

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
        className="bg-surface-light border border-border rounded-md px-2.5 py-1.5 text-xs text-text-tertiary font-mono appearance-none cursor-pointer hover:border-border-strong transition-colors focus:outline-none focus:border-burnt-orange/40"
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
  let best = data[0];
  let bestVal = (best[key] as number) ?? (higherIsBetter ? -Infinity : Infinity);

  for (let i = 1; i < data.length; i++) {
    const val = (data[i][key] as number) ?? (higherIsBetter ? -Infinity : Infinity);
    if (higherIsBetter ? val > bestVal : val < bestVal) {
      best = data[i];
      bestVal = val;
    }
  }

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
        <div className="h-4 w-48 bg-surface-medium rounded animate-pulse" />
        <div className="h-3 w-20 bg-surface-light rounded animate-pulse" />
      </div>
      <div className="divide-y divide-border-subtle">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="px-5 py-3 flex items-center gap-4">
            <div className="h-4 w-6 bg-surface-light rounded animate-pulse" />
            <div className="h-4 flex-1 max-w-[200px] bg-surface-medium rounded animate-pulse" />
            <div className="h-4 w-16 bg-surface-light rounded animate-pulse hidden sm:block" />
            <div className="h-4 w-12 bg-surface-light rounded animate-pulse" />
            <div className="h-4 w-12 bg-surface-light rounded animate-pulse hidden md:block" />
          </div>
        ))}
      </div>
    </Card>
  );
}
