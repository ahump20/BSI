'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataAttribution } from '@/components/ui/DataAttribution';
import { Footer } from '@/components/layout-ds/Footer';
import { teamMetadata, getLogoUrl } from '@/lib/data/team-metadata';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReadoutData {
  team: {
    id: number;
    name: string;
    shortName?: string;
    conference?: { name: string };
    stats?: {
      wins: number;
      losses: number;
      confWins: number;
      confLosses: number;
      streak?: string;
      battingAvg: number;
      era: number;
    };
    roster?: { id?: string; name: string; position: string; stats?: Record<string, unknown> }[];
  };
  teamStats?: {
    batting?: { battingAverage: number; homeRuns: number; runs: number; ops: number };
    pitching?: { era: number; whip: number; strikeouts: number };
  };
}

interface NILPlayer {
  player_name: string;
  team: string;
  estimated_mid: number;
  index_score: number;
  nil_tier: string;
}

interface ScheduleGame {
  id: string;
  date: string;
  opponent: { name: string };
  isHome: boolean;
  status: string;
  result: 'W' | 'L' | 'T' | null;
  score: { team: number; opponent: number } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNIL(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${v}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface TeamReadoutClientProps {
  teamId: string;
}

export default function TeamReadoutClient({ teamId }: TeamReadoutClientProps) {
  const [teamData, setTeamData] = useState<ReadoutData | null>(null);
  const [nilData, setNilData] = useState<NILPlayer[]>([]);
  const [schedule, setSchedule] = useState<ScheduleGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');

  const meta = teamMetadata[teamId];

  useEffect(() => {
    async function load() {
      try {
        const [teamRes, nilRes, schedRes] = await Promise.all([
          fetch(`/api/college-baseball/teams/${teamId}`),
          fetch(`/api/nil/leaderboard?limit=500`).catch(() => null),
          fetch(`/api/college-baseball/teams/${teamId}/schedule`).catch(() => null),
        ]);

        if (teamRes.ok) {
          const data = await teamRes.json();
          setTeamData(data as ReadoutData);
          setLastUpdated(teamRes.headers.get('X-Last-Updated') || new Date().toISOString());
        }

        if (nilRes?.ok) {
          const nd = await nilRes.json() as { data?: NILPlayer[] };
          setNilData(nd.data || []);
        }

        if (schedRes?.ok) {
          const sd = await schedRes.json() as { schedule?: ScheduleGame[] };
          setSchedule(sd.schedule || []);
        }
      } catch {
        // fail through
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [teamId]);

  const teamName = teamData?.team?.name || meta?.name || `Team ${teamId}`;
  const stats = teamData?.team?.stats;
  const teamStats = teamData?.teamStats;
  const roster = teamData?.team?.roster || [];
  const conference = teamData?.team?.conference?.name || meta?.conference || '';

  const teamNIL = useMemo(() => {
    if (!nilData.length) return [];
    return nilData.filter(p => p.team === teamName).sort((a, b) => b.estimated_mid - a.estimated_mid);
  }, [nilData, teamName]);

  const nilTotal = useMemo(() => teamNIL.reduce((s, p) => s + p.estimated_mid, 0), [teamNIL]);

  const upcoming = useMemo(() => {
    const now = new Date();
    return schedule
      .filter(g => new Date(g.date) >= now && !g.result)
      .slice(0, 5);
  }, [schedule]);

  const recentResults = useMemo(() => {
    return schedule
      .filter(g => g.result)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [schedule]);

  const logoUrl = meta ? getLogoUrl(meta.espnId, meta.logoId) : null;

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

  return (
    <>
      <div className="pt-6">
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
          <Container>
            {/* Breadcrumb */}
            <div className="flex items-center gap-3 mb-4 text-sm">
              <Link href="/college-baseball" className="text-text-muted hover:text-burnt-orange transition-colors">
                College Baseball
              </Link>
              <span className="text-text-muted">/</span>
              <Link href={`/college-baseball/teams/${teamId}`} className="text-text-muted hover:text-burnt-orange transition-colors">
                {teamName}
              </Link>
              <span className="text-text-muted">/</span>
              <span className="text-text-tertiary">Executive Readout</span>
            </div>

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              {logoUrl && (
                <img src={logoUrl} alt={teamName} className="w-16 h-16 object-contain" />
              )}
              <div>
                <Badge variant="primary" className="mb-2">2-Minute Readout</Badge>
                <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-text-primary">
                  {teamName}
                </h1>
                <span className="text-text-muted text-sm">{conference}</span>
              </div>
            </div>

            {/* ═══ Record & Performance Strip ═══ */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
              {stats && (
                <>
                  <Card padding="md" className="text-center">
                    <div className="text-xs text-text-muted uppercase tracking-wider">Record</div>
                    <div className="font-mono text-2xl font-bold text-text-primary mt-1">{stats.wins}-{stats.losses}</div>
                  </Card>
                  <Card padding="md" className="text-center">
                    <div className="text-xs text-text-muted uppercase tracking-wider">Conference</div>
                    <div className="font-mono text-2xl font-bold text-text-primary mt-1">{stats.confWins}-{stats.confLosses}</div>
                  </Card>
                  <Card padding="md" className="text-center">
                    <div className="text-xs text-text-muted uppercase tracking-wider">Team AVG</div>
                    <div className="font-mono text-2xl font-bold text-text-primary mt-1">{stats.battingAvg.toFixed(3)}</div>
                  </Card>
                  <Card padding="md" className="text-center">
                    <div className="text-xs text-text-muted uppercase tracking-wider">Team ERA</div>
                    <div className="font-mono text-2xl font-bold text-text-primary mt-1">{stats.era.toFixed(2)}</div>
                  </Card>
                  {stats.streak && (
                    <Card padding="md" className="text-center">
                      <div className="text-xs text-text-muted uppercase tracking-wider">Streak</div>
                      <div className={`font-mono text-2xl font-bold mt-1 ${stats.streak.startsWith('W') ? 'text-green-400' : 'text-red-400'}`}>
                        {stats.streak}
                      </div>
                    </Card>
                  )}
                </>
              )}
            </div>

            {/* ═══ Main Grid: 2/3 + 1/3 ═══ */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Left column — 2/3 */}
              <div className="md:col-span-2 space-y-6">
                {/* Team Stats Snapshot */}
                {teamStats && (
                  <Card padding="none" className="overflow-hidden">
                    <div className="px-4 py-3 bg-charcoal border-b border-border">
                      <h2 className="font-display text-base font-bold uppercase tracking-wide text-text-primary">Performance Snapshot</h2>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-6">
                        {teamStats.batting && (
                          <div>
                            <span className="text-xs text-text-muted uppercase tracking-widest block mb-2">Batting</span>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-text-muted">AVG</span>
                                <span className="text-text-primary font-mono">{teamStats.batting.battingAverage.toFixed(3)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-text-muted">OPS</span>
                                <span className="text-text-primary font-mono">{teamStats.batting.ops.toFixed(3)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-text-muted">HR</span>
                                <span className="text-text-primary font-mono">{teamStats.batting.homeRuns}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-text-muted">Runs</span>
                                <span className="text-text-primary font-mono">{teamStats.batting.runs}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        {teamStats.pitching && (
                          <div>
                            <span className="text-xs text-text-muted uppercase tracking-widest block mb-2">Pitching</span>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-text-muted">ERA</span>
                                <span className="text-text-primary font-mono">{teamStats.pitching.era.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-text-muted">WHIP</span>
                                <span className="text-text-primary font-mono">{teamStats.pitching.whip.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-text-muted">SO</span>
                                <span className="text-text-primary font-mono">{teamStats.pitching.strikeouts}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )}

                {/* Recent Results */}
                {recentResults.length > 0 && (
                  <Card padding="none" className="overflow-hidden">
                    <div className="px-4 py-3 bg-charcoal border-b border-border">
                      <h2 className="font-display text-base font-bold uppercase tracking-wide text-text-primary">Recent Results</h2>
                    </div>
                    <div className="divide-y divide-border-subtle">
                      {recentResults.map(g => (
                        <div key={g.id} className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-bold ${g.result === 'W' ? 'text-green-400' : 'text-red-400'}`}>
                              {g.result}
                            </span>
                            <span className="text-sm text-text-primary">
                              {g.isHome ? 'vs' : '@'} {g.opponent.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {g.score && (
                              <span className="text-sm font-mono text-text-secondary">
                                {g.score.team}-{g.score.opponent}
                              </span>
                            )}
                            <span className="text-xs text-text-muted">{formatDate(g.date)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Upcoming Schedule */}
                {upcoming.length > 0 && (
                  <Card padding="none" className="overflow-hidden">
                    <div className="px-4 py-3 bg-charcoal border-b border-border">
                      <h2 className="font-display text-base font-bold uppercase tracking-wide text-text-primary">Upcoming</h2>
                    </div>
                    <div className="divide-y divide-border-subtle">
                      {upcoming.map(g => (
                        <div key={g.id} className="flex items-center justify-between px-4 py-3">
                          <span className="text-sm text-text-primary">
                            {g.isHome ? 'vs' : '@'} {g.opponent.name}
                          </span>
                          <span className="text-xs text-text-muted">{formatDate(g.date)}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>

              {/* Right column — 1/3 */}
              <div className="space-y-6">
                {/* NIL Position */}
                <Card padding="none" className="overflow-hidden">
                  <div className="px-4 py-3 bg-gradient-to-r from-burnt-orange/15 to-transparent border-b border-border">
                    <h2 className="font-display text-base font-bold uppercase tracking-wide text-text-primary">NIL Position</h2>
                  </div>
                  <div className="p-4">
                    {teamNIL.length > 0 ? (
                      <>
                        <div className="text-center mb-4">
                          <div className="text-xs text-text-muted uppercase tracking-wider">Total Roster Value</div>
                          <div className="font-display text-3xl font-bold text-burnt-orange mt-1">{formatNIL(nilTotal)}</div>
                          <div className="text-xs text-text-muted mt-1">{teamNIL.length} players scored</div>
                        </div>
                        <div className="space-y-1">
                          {teamNIL.slice(0, 5).map((p, i) => (
                            <div key={p.player_name} className="flex items-center justify-between py-1 text-sm">
                              <span className="text-text-primary truncate">{i + 1}. {p.player_name}</span>
                              <span className="text-burnt-orange font-mono font-bold shrink-0 ml-2">{formatNIL(p.estimated_mid)}</span>
                            </div>
                          ))}
                        </div>
                        <Link href="/nil-valuation" className="block text-center mt-3 text-xs text-text-muted hover:text-burnt-orange transition-colors">
                          Full NIL Analysis →
                        </Link>
                      </>
                    ) : (
                      <p className="text-sm text-text-muted text-center py-4">NIL data loading...</p>
                    )}
                  </div>
                </Card>

                {/* Roster Depth */}
                <Card padding="none" className="overflow-hidden">
                  <div className="px-4 py-3 bg-charcoal border-b border-border">
                    <h2 className="font-display text-base font-bold uppercase tracking-wide text-text-primary">Roster Depth</h2>
                  </div>
                  <div className="p-4">
                    {roster.length > 0 ? (
                      <>
                        <div className="text-center mb-3">
                          <div className="font-display text-2xl font-bold text-text-primary">{roster.length}</div>
                          <div className="text-xs text-text-muted">Active Players</div>
                        </div>
                        {(() => {
                          const pitchers = roster.filter(p => ['P', 'SP', 'RP', 'LHP', 'RHP', 'LHSP', 'RHSP', 'LHRP', 'RHRP'].includes((p.position || '').toUpperCase()));
                          const catchers = roster.filter(p => (p.position || '').toUpperCase() === 'C');
                          const infielders = roster.filter(p => ['1B', '2B', '3B', 'SS', 'IF'].includes((p.position || '').toUpperCase()));
                          const outfielders = roster.filter(p => ['LF', 'CF', 'RF', 'OF'].includes((p.position || '').toUpperCase()));
                          return (
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between"><span className="text-text-muted">Pitchers</span><span className="text-text-primary font-mono">{pitchers.length}</span></div>
                              <div className="flex justify-between"><span className="text-text-muted">Catchers</span><span className="text-text-primary font-mono">{catchers.length}</span></div>
                              <div className="flex justify-between"><span className="text-text-muted">Infielders</span><span className="text-text-primary font-mono">{infielders.length}</span></div>
                              <div className="flex justify-between"><span className="text-text-muted">Outfielders</span><span className="text-text-primary font-mono">{outfielders.length}</span></div>
                            </div>
                          );
                        })()}
                      </>
                    ) : (
                      <p className="text-sm text-text-muted text-center py-4">Roster loading...</p>
                    )}
                  </div>
                </Card>

                {/* Quick Links */}
                <Card padding="md">
                  <div className="space-y-2">
                    <Link href={`/college-baseball/teams/${teamId}`} className="block text-sm text-text-muted hover:text-burnt-orange transition-colors">
                      ← Full Team Page
                    </Link>
                    <Link href="/college-baseball/transfer-portal" className="block text-sm text-text-muted hover:text-burnt-orange transition-colors">
                      Transfer Portal →
                    </Link>
                    <Link href="/college-baseball/savant" className="block text-sm text-text-muted hover:text-burnt-orange transition-colors">
                      Savant Explorer →
                    </Link>
                    <Link href="/nil-valuation/tools" className="block text-sm text-text-muted hover:text-burnt-orange transition-colors">
                      NIL Tools →
                    </Link>
                  </div>
                </Card>
              </div>
            </div>

            {lastUpdated && <DataAttribution lastUpdated={lastUpdated} className="mt-8" />}
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}
