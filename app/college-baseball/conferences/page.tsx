'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { DataAttribution } from '@/components/ui/DataAttribution';
import { Trophy, Users, TrendingUp, MapPin } from 'lucide-react';
import { teamMetadata } from '@/lib/data/team-metadata';
import { getReadApiUrl } from '@/lib/utils/public-api';

/* ── Types ─────────────────────────────────────────────────────────── */

interface StandingsTeam {
  team_name: string;
  conference?: string;
  overall_wins?: number;
  overall_losses?: number;
  batting_avg?: number;
  era?: number;
  rpi?: number;
  [key: string]: unknown;
}

interface SavantEntry {
  team_name?: string;
  conference?: string;
  woba?: number;
  wrc_plus?: number;
  [key: string]: unknown;
}

interface NILEntry {
  school?: string;
  team_name?: string;
  conference?: string;
  estimated_mid?: number;
  [key: string]: unknown;
}

/* ── Static conference metadata ────────────────────────────────────── */

const conferenceInfo: Record<string, { fullName: string; description: string; region: string }> = {
  SEC: { fullName: 'Southeastern Conference', description: 'The deepest conference in college baseball — Texas and Texas A&M now call home alongside perennial powers like LSU, Tennessee, and Vanderbilt.', region: 'South' },
  ACC: { fullName: 'Atlantic Coast Conference', description: 'Massive expansion in 2024 brought Stanford, Cal, and SMU — joining established powers like Florida State, North Carolina, and Wake Forest.', region: 'East Coast' },
  'Big 12': { fullName: 'Big 12 Conference', description: 'TCU leads a competitive Big 12 that added UCF, Houston, BYU, and others in realignment. Deep pitching across the board.', region: 'Central' },
  'Big Ten': { fullName: 'Big Ten Conference', description: 'Growing power in the Midwest. USC and UCLA joined in 2024, bringing West Coast talent to the conference.', region: 'Midwest' },
};

const powerConfs = new Set(['SEC', 'ACC', 'Big 12', 'Big Ten']);

const confNameToSlug: Record<string, string> = {
  SEC: 'sec', ACC: 'acc', 'Big 12': 'big-12', 'Big Ten': 'big-ten',
  'Big East': 'big-east', AAC: 'aac', 'Sun Belt': 'sun-belt', 'Mountain West': 'mountain-west',
  CUSA: 'c-usa', 'A-10': 'a-10', CAA: 'colonial', 'Missouri Valley': 'missouri-valley',
  WCC: 'wcc', 'Big West': 'big-west', Southland: 'southland',
  ASUN: 'asun', 'America East': 'america-east', 'Big South': 'big-south', Horizon: 'horizon',
  'Patriot League': 'patriot-league', Southern: 'southern', Summit: 'summit', WAC: 'wac',
  Independent: 'independent',
};

/* ── Helpers ───────────────────────────────────────────────────────── */

function _normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function fmtPct(v?: number): string {
  if (v === undefined || v === null) return '—';
  return (v * 100).toFixed(1) + '%';
}

function fmtDollars(v?: number): string {
  if (v === undefined || v === null) return '—';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

/* ── Component ─────────────────────────────────────────────────────── */

export default function ConferencesHubPage() {
  const [standings, setStandings] = useState<StandingsTeam[]>([]);
  const [savant, setSavant] = useState<SavantEntry[]>([]);
  const [nil, setNil] = useState<NILEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [standingsRes, savantRes, nilRes] = await Promise.all([
          fetch(getReadApiUrl('/api/college-baseball/standings')).catch(() => null),
          fetch(getReadApiUrl('/api/savant/batting/leaderboard?limit=100')).catch(() => null),
          fetch(getReadApiUrl('/api/nil/leaderboard?limit=500')).catch(() => null),
        ]);

        if (standingsRes?.ok) {
          const data = await standingsRes.json();
          const teams = data.standings || data.data || data.teams || [];
          setStandings(Array.isArray(teams) ? teams : []);
          if (data.meta?.fetched_at) setLastUpdated(data.meta.fetched_at);
        }
        if (savantRes?.ok) {
          const data = await savantRes.json();
          setSavant(data.data || data.leaderboard || []);
        }
        if (nilRes?.ok) {
          const data = await nilRes.json();
          setNil(data.data || []);
        }
      } catch {
        /* silent — page renders with static metadata */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* Build conference aggregates from live data */
  const confAggregates = useMemo(() => {
    const map: Record<string, {
      teamCount: number;
      totalWins: number;
      totalLosses: number;
      avgRpi: number | undefined;
      topTeam: string | undefined;
      topWins: number;
      totalNil: number;
      nilCount: number;
      avgWoba: number | undefined;
      avgWrcPlus: number | undefined;
    }> = {};

    for (const t of standings) {
      const conf = t.conference;
      if (!conf) continue;
      if (!map[conf]) map[conf] = { teamCount: 0, totalWins: 0, totalLosses: 0, avgRpi: undefined, topTeam: undefined, topWins: 0, totalNil: 0, nilCount: 0, avgWoba: undefined, avgWrcPlus: undefined };
      const agg = map[conf];
      agg.teamCount++;
      agg.totalWins += t.overall_wins || 0;
      agg.totalLosses += t.overall_losses || 0;
      const wins = t.overall_wins || 0;
      if (wins > agg.topWins) { agg.topWins = wins; agg.topTeam = t.team_name; }
    }

    /* Savant averages per conference */
    const savantByConf: Record<string, { wobaSum: number; wrcSum: number; count: number }> = {};
    for (const s of savant) {
      const conf = s.conference;
      if (!conf) continue;
      if (!savantByConf[conf]) savantByConf[conf] = { wobaSum: 0, wrcSum: 0, count: 0 };
      if (s.woba) { savantByConf[conf].wobaSum += s.woba; savantByConf[conf].count++; }
      if (s.wrc_plus) savantByConf[conf].wrcSum += s.wrc_plus;
    }
    for (const [conf, sv] of Object.entries(savantByConf)) {
      if (map[conf] && sv.count > 0) {
        map[conf].avgWoba = sv.wobaSum / sv.count;
        map[conf].avgWrcPlus = sv.wrcSum / sv.count;
      }
    }

    /* NIL totals per conference */
    for (const n of nil) {
      const conf = n.conference;
      if (!conf || !map[conf]) continue;
      map[conf].totalNil += n.estimated_mid || 0;
      map[conf].nilCount++;
    }

    return map;
  }, [standings, savant, nil]);

  /* Mid-major conferences from teamMetadata */
  const midMajorConfs = useMemo(() => {
    const confTeams: Record<string, number> = {};
    for (const meta of Object.values(teamMetadata)) {
      if (powerConfs.has(meta.conference)) continue;
      confTeams[meta.conference] = (confTeams[meta.conference] || 0) + 1;
    }
    return Object.entries(confTeams)
      .filter(([name]) => confNameToSlug[name])
      .map(([name, count]) => ({ id: confNameToSlug[name], name, teamCount: count, agg: confAggregates[name] }))
      .sort((a, b) => b.teamCount - a.teamCount || a.name.localeCompare(b.name));
  }, [confAggregates]);

  const powerConferences = ['SEC', 'ACC', 'Big 12', 'Big Ten'].map((name) => ({
    id: confNameToSlug[name],
    name,
    fullName: conferenceInfo[name].fullName,
    description: conferenceInfo[name].description,
    region: conferenceInfo[name].region,
    agg: confAggregates[name],
  }));

  const totalTeams = Object.values(confAggregates).reduce((sum, a) => sum + a.teamCount, 0);

  return (
    <>
      <div>
        <Section padding="lg" className="pt-6">
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-2">
                <Link href="/college-baseball" className="text-bsi-dust hover:text-burnt-orange transition-colors">
                  College Baseball
                </Link>
                <span className="text-bsi-dust">/</span>
                <span className="text-bsi-bone">Conferences</span>
              </div>

              <div className="mb-8">
                <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-bsi-bone">
                  Conference <span className="text-burnt-orange">Hub</span>
                </h1>
                <p className="text-bsi-dust mt-2 max-w-2xl">
                  Live conference breakdowns with records, advanced metrics, and NIL spend across the reshuffled D1 landscape.
                </p>
              </div>
            </ScrollReveal>

            {/* Summary Stats */}
            <ScrollReveal direction="up" delay={100}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <Card padding="md" className="text-center">
                  <Trophy className="w-6 h-6 text-burnt-orange mx-auto mb-2" />
                  <div className="font-display text-2xl font-bold text-bsi-bone">4</div>
                  <div className="text-bsi-dust text-sm">Power Conferences</div>
                </Card>
                <Card padding="md" className="text-center">
                  <Users className="w-6 h-6 text-burnt-orange mx-auto mb-2" />
                  <div className="font-display text-2xl font-bold text-bsi-bone">{totalTeams || '300+'}</div>
                  <div className="text-bsi-dust text-sm">D1 Teams</div>
                </Card>
                <Card padding="md" className="text-center">
                  <TrendingUp className="w-6 h-6 text-burnt-orange mx-auto mb-2" />
                  <div className="font-display text-2xl font-bold text-bsi-bone">{midMajorConfs.length + 4}</div>
                  <div className="text-bsi-dust text-sm">Conferences</div>
                </Card>
                <Card padding="md" className="text-center">
                  <MapPin className="w-6 h-6 text-burnt-orange mx-auto mb-2" />
                  <div className="font-display text-2xl font-bold text-bsi-bone">Live</div>
                  <div className="text-bsi-dust text-sm">Data Feed</div>
                </Card>
              </div>
            </ScrollReveal>

            {/* Loading */}
            {loading && (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin mx-auto mb-3" />
                <p className="text-bsi-dust text-sm">Loading conference data...</p>
              </div>
            )}

            {/* Conference Comparison Grid (Power Conferences) */}
            {!loading && standings.length > 0 && (
              <ScrollReveal direction="up" delay={150}>
                <h2 className="font-display text-xl font-bold text-bsi-bone mb-4 uppercase tracking-wide">
                  Power Conference Comparison
                </h2>
                <div className="overflow-x-auto mb-10">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-press-box text-bsi-dust text-xs uppercase tracking-wider">
                        <th className="text-left px-4 py-3">Conference</th>
                        <th className="text-center px-3 py-3">Teams</th>
                        <th className="text-center px-3 py-3">Overall</th>
                        <th className="text-center px-3 py-3">Win%</th>
                        <th className="text-center px-3 py-3">Avg wOBA</th>
                        <th className="text-center px-3 py-3">Avg wRC+</th>
                        <th className="text-center px-3 py-3">NIL Spend</th>
                        <th className="text-center px-3 py-3">Top Team</th>
                      </tr>
                    </thead>
                    <tbody>
                      {powerConferences.map((conf) => {
                        const a = conf.agg;
                        const totalGames = (a?.totalWins || 0) + (a?.totalLosses || 0);
                        const winPct = totalGames > 0 ? (a?.totalWins || 0) / totalGames : undefined;
                        return (
                          <tr key={conf.id} className="border-b border-border-vintage/20 hover:bg-surface-dugout/50 transition-colors">
                            <td className="px-4 py-3">
                              <Link href={`/college-baseball/conferences/${conf.id}`} className="text-bsi-bone hover:text-burnt-orange transition-colors font-display font-bold">
                                {conf.name}
                              </Link>
                            </td>
                            <td className="text-center px-3 py-3 text-bsi-bone font-mono">{a?.teamCount || '—'}</td>
                            <td className="text-center px-3 py-3 text-bsi-bone font-mono">{a ? `${a.totalWins}-${a.totalLosses}` : '—'}</td>
                            <td className="text-center px-3 py-3 text-bsi-bone font-mono">{fmtPct(winPct)}</td>
                            <td className="text-center px-3 py-3 text-bsi-bone font-mono">{a?.avgWoba ? a.avgWoba.toFixed(3) : '—'}</td>
                            <td className="text-center px-3 py-3 text-bsi-bone font-mono">{a?.avgWrcPlus ? a.avgWrcPlus.toFixed(1) : '—'}</td>
                            <td className="text-center px-3 py-3 text-bsi-bone font-mono">{a?.nilCount ? fmtDollars(a.totalNil) : '—'}</td>
                            <td className="text-center px-3 py-3 text-burnt-orange text-xs">{a?.topTeam || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </ScrollReveal>
            )}

            {/* Conference Cards */}
            <div className="grid gap-6">
              {powerConferences.map((conf, index) => {
                const a = conf.agg;
                const totalGames = (a?.totalWins || 0) + (a?.totalLosses || 0);
                const winPct = totalGames > 0 ? (a?.totalWins || 0) / totalGames : undefined;
                return (
                  <ScrollReveal key={conf.id} direction="up" delay={150 + index * 50}>
                    <Link href={`/college-baseball/conferences/${conf.id}`}>
                      <Card padding="lg" className="hover:border-burnt-orange/50 transition-all cursor-pointer group">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h2 className="font-display text-2xl font-bold text-bsi-bone group-hover:text-burnt-orange transition-colors">
                                {conf.fullName}
                              </h2>
                              {a && a.teamCount > 0 && (
                                <Badge variant="primary">{a.teamCount} Teams</Badge>
                              )}
                            </div>
                            <p className="text-bsi-dust mb-3">{conf.description}</p>
                            <div className="flex flex-wrap gap-3 text-sm">
                              {a?.topTeam && (
                                <span className="text-burnt-orange">Leader: {a.topTeam}</span>
                              )}
                              {winPct !== undefined && (
                                <span className="text-bsi-dust">Win%: {fmtPct(winPct)}</span>
                              )}
                              <span className="text-bsi-dust">{conf.region}</span>
                            </div>
                          </div>
                          <div className="md:text-right space-y-1">
                            {a?.totalWins !== undefined && (
                              <div className="text-bsi-bone font-mono text-sm">{a.totalWins}-{a.totalLosses} overall</div>
                            )}
                            {a?.avgWoba && (
                              <div className="text-bsi-dust text-xs">wOBA: {a.avgWoba.toFixed(3)}</div>
                            )}
                            {a?.nilCount ? (
                              <div className="text-bsi-dust text-xs">NIL: {fmtDollars(a.totalNil)}</div>
                            ) : null}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </ScrollReveal>
                );
              })}
            </div>

            {/* Mid-Major & D1 Conferences */}
            {midMajorConfs.length > 0 && (
              <ScrollReveal direction="up" delay={400}>
                <h2 className="font-display text-2xl font-bold text-bsi-bone mt-12 mb-6">
                  Mid-Major &amp; D1 Conferences
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {midMajorConfs.map((conf) => {
                    const totalGames = (conf.agg?.totalWins || 0) + (conf.agg?.totalLosses || 0);
                    const winPct = totalGames > 0 ? (conf.agg?.totalWins || 0) / totalGames : undefined;
                    return (
                      <Link key={conf.id} href={`/college-baseball/conferences/${conf.id}`}>
                        <Card padding="md" className="hover:border-burnt-orange/50 transition-all cursor-pointer group h-full">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-display text-lg font-bold text-bsi-bone group-hover:text-burnt-orange transition-colors">
                              {conf.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-3 text-bsi-dust text-sm">
                            <span>{conf.teamCount} teams</span>
                            {winPct !== undefined && <span>Win%: {fmtPct(winPct)}</span>}
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </ScrollReveal>
            )}

            {/* Data Attribution */}
            <div className="mt-10 flex justify-center">
              {lastUpdated ? (
                <DataAttribution lastUpdated={lastUpdated} source="BSI Analytics" />
              ) : (
                <p className="text-xs text-bsi-dust" suppressHydrationWarning>
                  Conference membership reflects 2024-25 realignment. Last updated: {new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT
                </p>
              )}
            </div>
          </Container>
        </Section>
      </div>

      <Footer />
    </>
  );
}
