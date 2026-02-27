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
import { PlateDisciplineScatter, type ScatterPlayer } from '@/components/analytics/PlateDisciplineScatter';
import { ConferenceHeatmap, type ConferenceHeatmapRow } from '@/components/analytics/ConferenceHeatmap';
import { PowerVsContact, type PowerContactPlayer } from '@/components/analytics/PowerVsContact';
import { EraFipGap, type EraFipPitcher } from '@/components/analytics/EraFipGap';
import {
  PercentilePlayerCard,
  type StatGroup,
} from '@/components/analytics/PercentilePlayerCard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LeaderboardResponse {
  data: Record<string, unknown>[];
  total?: number;
  meta: { source: string; fetched_at: string; timezone: string };
}

// ---------------------------------------------------------------------------
// Visual tool cards — the gallery
// ---------------------------------------------------------------------------

interface VisualTool {
  id: string;
  title: string;
  description: string;
  category: 'batting' | 'pitching' | 'team' | 'player';
  available: boolean;
  proRequired?: boolean;
}

const VISUAL_TOOLS: VisualTool[] = [
  {
    id: 'plate-discipline',
    title: 'Plate Discipline Scatter',
    description: 'K% vs BB% interactive scatter — four quadrants separating approach archetypes. Bubble size maps to plate appearances.',
    category: 'batting',
    available: true,
  },
  {
    id: 'power-contact',
    title: 'Power vs Contact',
    description: 'ISO (isolated power) vs K% — identifies contact power hitters, all-or-nothing sluggers, and slap hitters.',
    category: 'batting',
    available: true,
  },
  {
    id: 'spray-chart',
    title: 'Spray Chart',
    description: 'Batted ball distribution across the field. Pull vs. oppo tendencies visualized on a diamond overlay.',
    category: 'batting',
    available: false,
  },
  {
    id: 'conference-heatmap',
    title: 'Conference Strength Heatmap',
    description: 'Grid heatmap of conferences ranked by composite strength. Cell color maps to percentile across ERA, wOBA, OPS.',
    category: 'team',
    available: true,
  },
  {
    id: 'percentile-card',
    title: 'Percentile Player Card',
    description: 'Savant-style scouting report. Horizontal percentile bars grouped by skill category — red is elite, blue is poor.',
    category: 'player',
    available: true,
  },
  {
    id: 'similarity-map',
    title: 'Player Similarity Map',
    description: 'Dimensionality-reduced scatter grouping players by statistical profile. Find comps across the college game.',
    category: 'player',
    available: false,
  },
  {
    id: 'era-fip-gap',
    title: 'ERA vs FIP Gap',
    description: 'Identifies pitchers whose ERA diverges from FIP — separating luck and defense from true performance.',
    category: 'pitching',
    available: true,
    proRequired: true,
  },
  {
    id: 'pitch-arsenal',
    title: 'Pitch Arsenal Breakdown',
    description: 'Velocity distribution curves and usage rates by pitch type. Shows how a pitcher attacks the zone.',
    category: 'pitching',
    available: false,
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  batting: 'Batting',
  pitching: 'Pitching',
  team: 'Team / Conference',
  player: 'Player Profile',
};

// ---------------------------------------------------------------------------
// Helpers — build percentile card from leaderboard data
// ---------------------------------------------------------------------------

function computePercentile(
  allValues: number[],
  value: number,
): number {
  const sorted = [...allValues].sort((a, b) => a - b);
  if (sorted.length <= 1) return 50;
  const below = sorted.filter(v => v < value).length;
  return (below / (sorted.length - 1)) * 100;
}

const STAT_DEFS = [
  { key: 'avg', label: 'AVG', higherIsBetter: true, group: 'Hitting', format: (v: number) => v.toFixed(3).replace(/^0/, '') },
  { key: 'obp', label: 'OBP', higherIsBetter: true, group: 'Hitting', format: (v: number) => v.toFixed(3).replace(/^0/, '') },
  { key: 'slg', label: 'SLG', higherIsBetter: true, group: 'Hitting', format: (v: number) => v.toFixed(3).replace(/^0/, '') },
  { key: 'iso', label: 'ISO', higherIsBetter: true, group: 'Hitting', format: (v: number) => v.toFixed(3).replace(/^0/, '') },
  { key: 'woba', label: 'wOBA', higherIsBetter: true, group: 'Advanced', format: (v: number) => v.toFixed(3).replace(/^0/, '') },
  { key: 'wrc_plus', label: 'wRC+', higherIsBetter: true, group: 'Advanced', format: (v: number) => Math.round(v).toString() },
  { key: 'ops_plus', label: 'OPS+', higherIsBetter: true, group: 'Advanced', format: (v: number) => Math.round(v).toString() },
  { key: 'k_pct', label: 'K%', higherIsBetter: false, group: 'Discipline', format: (v: number) => `${(v * 100).toFixed(1)}%` },
  { key: 'bb_pct', label: 'BB%', higherIsBetter: true, group: 'Discipline', format: (v: number) => `${(v * 100).toFixed(1)}%` },
  { key: 'babip', label: 'BABIP', higherIsBetter: true, group: 'Discipline', format: (v: number) => v.toFixed(3).replace(/^0/, '') },
];

function buildPlayerCard(
  data: Record<string, unknown>[],
  targetPlayer?: Record<string, unknown>,
): { player: Record<string, unknown>; groups: StatGroup[] } | null {
  if (data.length === 0) return null;

  // Use specified player or pick top wOBA
  let player = targetPlayer;
  if (!player) {
    const valid = data.filter(r => r.woba != null && typeof r.woba === 'number' && Number.isFinite(r.woba as number));
    if (valid.length === 0) {
      // Fallback to top AVG if wOBA is pro-gated
      const byAvg = data.filter(r => r.avg != null && typeof r.avg === 'number' && Number.isFinite(r.avg as number));
      if (byAvg.length === 0) return null;
      player = [...byAvg].sort((a, b) => (b.avg as number) - (a.avg as number))[0];
    } else {
      player = [...valid].sort((a, b) => (b.woba as number) - (a.woba as number))[0];
    }
  }

  const groupMap = new Map<string, StatGroup>();

  for (const def of STAT_DEFS) {
    const raw = player[def.key];
    if (raw == null || typeof raw !== 'number' || !Number.isFinite(raw)) continue;

    const allVals = data
      .map(r => r[def.key] as number)
      .filter(v => v != null && Number.isFinite(v));

    const pctl = computePercentile(allVals, raw);

    if (!groupMap.has(def.group)) {
      groupMap.set(def.group, { label: def.group, stats: [] });
    }

    groupMap.get(def.group)!.stats.push({
      key: def.key,
      label: def.label,
      value: raw,
      percentile: pctl,
      higherIsBetter: def.higherIsBetter,
      format: def.format,
    });
  }

  return {
    player,
    groups: Array.from(groupMap.values()),
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SavantVisualsPage() {
  const [activeViz, setActiveViz] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');

  const { data: battingRes, loading: battingLoading } =
    useSportData<LeaderboardResponse>('/api/savant/batting/leaderboard?limit=100');
  const { data: pitchingRes, loading: pitchingLoading } =
    useSportData<LeaderboardResponse>('/api/savant/pitching/leaderboard?limit=100');
  const { data: confRes, loading: confLoading } =
    useSportData<{ data: ConferenceHeatmapRow[] }>('/api/savant/conference-strength');

  // Build scatter data from batting leaderboard
  const scatterData: ScatterPlayer[] = useMemo(() => {
    if (!battingRes?.data) return [];
    return battingRes.data
      .filter(r =>
        r.k_pct != null && r.bb_pct != null &&
        Number.isFinite(r.k_pct as number) && Number.isFinite(r.bb_pct as number)
      )
      .map(r => ({
        player_name: r.player_name as string,
        team: r.team as string,
        conference: (r.conference as string) ?? 'Unknown',
        k_pct: r.k_pct as number,
        bb_pct: r.bb_pct as number,
        pa: (r.pa as number) ?? 30,
        player_id: r.player_id as string | undefined,
      }));
  }, [battingRes]);

  // Power vs Contact data
  const powerContactData: PowerContactPlayer[] = useMemo(() => {
    if (!battingRes?.data) return [];
    return battingRes.data
      .filter(r =>
        r.iso != null && r.k_pct != null &&
        Number.isFinite(r.iso as number) && Number.isFinite(r.k_pct as number)
      )
      .map(r => ({
        player_name: r.player_name as string,
        team: r.team as string,
        conference: (r.conference as string) ?? 'Unknown',
        iso: r.iso as number,
        k_pct: r.k_pct as number,
        slg: (r.slg as number) ?? 0,
        pa: (r.pa as number) ?? 30,
        hr: (r.hr as number) ?? undefined,
        player_id: r.player_id as string | undefined,
      }));
  }, [battingRes]);

  // ERA vs FIP data (pro-gated — FIP may be null on free tier)
  const eraFipData: EraFipPitcher[] = useMemo(() => {
    if (!pitchingRes?.data) return [];
    return pitchingRes.data
      .filter(r =>
        r.era != null && r.fip != null &&
        Number.isFinite(r.era as number) && Number.isFinite(r.fip as number)
      )
      .map(r => ({
        player_name: r.player_name as string,
        team: r.team as string,
        conference: (r.conference as string) ?? 'Unknown',
        era: r.era as number,
        fip: r.fip as number,
        ip: (r.ip as number) ?? undefined,
        k_9: (r.k_9 as number) ?? undefined,
        player_id: r.player_id as string | undefined,
      }));
  }, [pitchingRes]);

  // Player list for selector
  const playerOptions = useMemo(() => {
    if (!battingRes?.data) return [];
    return battingRes.data
      .filter(r => r.player_name && r.player_id)
      .map(r => ({
        id: r.player_id as string,
        name: r.player_name as string,
        team: r.team as string,
      }));
  }, [battingRes]);

  // Build percentile card for selected or default player
  const playerCardData = useMemo(() => {
    if (!battingRes?.data) return null;
    const target = selectedPlayerId
      ? battingRes.data.find(r => r.player_id === selectedPlayerId) ?? undefined
      : undefined;
    return buildPlayerCard(battingRes.data, target);
  }, [battingRes, selectedPlayerId]);

  // Group tools by category
  const toolsByCategory = useMemo(() => {
    const map = new Map<string, VisualTool[]>();
    for (const tool of VISUAL_TOOLS) {
      const cat = tool.category;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(tool);
    }
    return map;
  }, []);

  return (
    <>
      <div>
        <Section padding="lg" className="pt-6">
          <Container size="wide">
            {/* Breadcrumb */}
            <ScrollReveal direction="up">
              <nav className="flex items-center gap-2 text-sm mb-6">
                <Link href="/" className="text-text-muted hover:text-burnt-orange transition-colors">Home</Link>
                <span className="text-text-muted">/</span>
                <Link href="/college-baseball" className="text-text-muted hover:text-burnt-orange transition-colors">College Baseball</Link>
                <span className="text-text-muted">/</span>
                <Link href="/college-baseball/savant" className="text-text-muted hover:text-burnt-orange transition-colors">Savant</Link>
                <span className="text-text-muted">/</span>
                <span className="text-text-secondary">Visuals</span>
              </nav>
            </ScrollReveal>

            {/* Hero */}
            <ScrollReveal direction="up" delay={50}>
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="accent" size="sm">VISUAL ANALYTICS</Badge>
                </div>
                <h1 className="font-display text-3xl md:text-5xl font-bold uppercase tracking-wider text-text-primary">
                  Savant <span className="text-burnt-orange">Visuals</span>
                </h1>
                <p className="text-text-tertiary mt-3 max-w-2xl text-base leading-relaxed">
                  Interactive data visualizations for college baseball analytics. Each tool
                  turns leaderboard data into spatial, scannable insight — the kind of view
                  that tables alone can&apos;t provide.
                </p>
              </div>
            </ScrollReveal>

            {/* Tool gallery */}
            {Array.from(toolsByCategory.entries()).map(([category, tools]) => (
              <ScrollReveal key={category} direction="up" delay={100}>
                <div className="mb-10">
                  <h2 className="font-display text-sm uppercase tracking-widest text-text-muted mb-4">
                    {CATEGORY_LABELS[category] ?? category}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tools.map(tool => (
                      <button
                        key={tool.id}
                        onClick={() => tool.available ? setActiveViz(activeViz === tool.id ? null : tool.id) : undefined}
                        disabled={!tool.available}
                        className={`text-left group ${!tool.available ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <Card
                          padding="md"
                          className={`h-full transition-all duration-300 ${
                            activeViz === tool.id
                              ? 'border-burnt-orange/40 shadow-[0_0_20px_rgba(191,87,0,0.1)]'
                              : 'hover:border-border-strong'
                          }`}
                        >
                          {/* Thumbnail placeholder */}
                          <div className={`h-24 rounded-lg mb-3 flex items-center justify-center ${
                            tool.available ? 'bg-gradient-to-br from-surface-light to-surface-medium' : 'bg-surface-light'
                          }`}>
                            {tool.available ? (
                              <svg viewBox="0 0 48 48" className="w-10 h-10 text-burnt-orange/40">
                                <rect x="4" y="4" width="40" height="40" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                                <circle cx="16" cy="28" r="4" fill="currentColor" opacity="0.5" />
                                <circle cx="28" cy="18" r="3" fill="currentColor" opacity="0.3" />
                                <circle cx="36" cy="32" r="5" fill="currentColor" opacity="0.4" />
                                <line x1="8" y1="40" x2="40" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.2" />
                              </svg>
                            ) : (
                              <span className="text-[10px] font-display uppercase tracking-widest text-text-muted">Coming Soon</span>
                            )}
                          </div>

                          <h3 className="font-display text-sm uppercase tracking-wider text-text-primary mb-1">
                            {tool.title}
                          </h3>
                          <p className="text-[11px] text-text-muted leading-relaxed">
                            {tool.description}
                          </p>

                          {tool.available && (
                            <div className="mt-3 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider">
                                {activeViz === tool.id ? 'Active' : 'Click to explore'}
                              </span>
                              {tool.proRequired && (
                                <span className="text-[7px] font-mono text-burnt-orange ml-1 uppercase">Pro</span>
                              )}
                            </div>
                          )}
                        </Card>
                      </button>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}

            {/* Active visualization */}
            {activeViz && (
              <ScrollReveal direction="up" delay={50}>
                <div className="mb-12">
                  {/* Plate Discipline Scatter */}
                  {activeViz === 'plate-discipline' && (
                    battingLoading ? (
                      <Card padding="lg" className="text-center">
                        <span className="text-xs text-text-muted font-mono">Loading scatter data...</span>
                      </Card>
                    ) : (
                      <PlateDisciplineScatter data={scatterData} />
                    )
                  )}

                  {/* Power vs Contact */}
                  {activeViz === 'power-contact' && (
                    battingLoading ? (
                      <Card padding="lg" className="text-center">
                        <span className="text-xs text-text-muted font-mono">Loading scatter data...</span>
                      </Card>
                    ) : (
                      <PowerVsContact data={powerContactData} />
                    )
                  )}

                  {/* Conference Heatmap */}
                  {activeViz === 'conference-heatmap' && (
                    confLoading ? (
                      <Card padding="lg" className="text-center">
                        <span className="text-xs text-text-muted font-mono">Loading conference data...</span>
                      </Card>
                    ) : (
                      <ConferenceHeatmap data={confRes?.data ?? []} />
                    )
                  )}

                  {/* ERA vs FIP Gap */}
                  {activeViz === 'era-fip-gap' && (
                    pitchingLoading ? (
                      <Card padding="lg" className="text-center">
                        <span className="text-xs text-text-muted font-mono">Loading pitching data...</span>
                      </Card>
                    ) : eraFipData.length === 0 ? (
                      <Card padding="lg" className="text-center">
                        <div className="py-6">
                          <span className="text-sm text-text-muted">
                            FIP data requires Pro tier.{' '}
                            <Link href="/pricing" className="text-burnt-orange hover:text-ember transition-colors">
                              Upgrade to unlock
                            </Link>
                          </span>
                        </div>
                      </Card>
                    ) : (
                      <EraFipGap data={eraFipData} />
                    )
                  )}

                  {/* Percentile Player Card */}
                  {activeViz === 'percentile-card' && (
                    battingLoading ? (
                      <Card padding="lg" className="text-center">
                        <span className="text-xs text-text-muted font-mono">Loading player data...</span>
                      </Card>
                    ) : (
                      <div className="max-w-lg mx-auto">
                        {/* Player selector */}
                        {playerOptions.length > 0 && (
                          <div className="mb-4">
                            <select
                              value={selectedPlayerId}
                              onChange={(e) => setSelectedPlayerId(e.target.value)}
                              className="w-full bg-surface-light border border-border rounded-md px-3 py-2 text-sm text-text-tertiary font-mono appearance-none cursor-pointer hover:border-border-strong transition-colors focus:outline-none focus:border-burnt-orange/40"
                            >
                              <option value="" className="bg-background-secondary text-text-primary">
                                Top player (auto)
                              </option>
                              {playerOptions.map(p => (
                                <option key={p.id} value={p.id} className="bg-background-secondary text-text-primary">
                                  {p.name} — {p.team}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {playerCardData ? (
                          <PercentilePlayerCard
                            playerName={playerCardData.player.player_name as string}
                            team={playerCardData.player.team as string}
                            position={(playerCardData.player.position as string) ?? undefined}
                            groups={playerCardData.groups}
                          />
                        ) : (
                          <Card padding="lg" className="text-center">
                            <span className="text-xs text-text-muted font-mono">No player data available</span>
                          </Card>
                        )}
                      </div>
                    )
                  )}
                </div>
              </ScrollReveal>
            )}

            {/* Attribution */}
            <div className="mt-8 text-center text-xs text-text-muted">
              <p>
                Data: BSI College Baseball Savant ·{' '}
                <Link
                  href="/college-baseball/savant"
                  className="text-burnt-orange hover:text-ember transition-colors"
                >
                  Back to Leaderboards
                </Link>
              </p>
            </div>
          </Container>
        </Section>
      </div>

      <Footer />
    </>
  );
}
