'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
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

/** Heritage-styled stat cell for the record strip */
function StatCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="heritage-card px-4 py-3 text-center">
      <div className="text-[10px] font-display uppercase tracking-[0.2em] text-[rgba(196,184,165,0.35)] mb-1">{label}</div>
      <div className={`font-mono text-xl md:text-2xl font-bold tabular-nums ${accent ? 'text-[var(--bsi-primary)]' : 'text-[var(--bsi-bone)]'}`}>
        {value}
      </div>
    </div>
  );
}

/** Heritage panel with press-box header */
function Panel({ title, accentHeader, children }: { title: string; accentHeader?: boolean; children: React.ReactNode }) {
  return (
    <div className="heritage-card overflow-hidden">
      <div
        className="px-4 py-2.5 border-b border-border-vintage"
        style={{
          background: accentHeader
            ? 'linear-gradient(90deg, rgba(191,87,0,0.12), transparent)'
            : 'var(--surface-press-box)',
        }}
      >
        <h2 className="text-xs font-display uppercase tracking-[0.2em] text-[rgba(196,184,165,0.35)]">{title}</h2>
      </div>
      {children}
    </div>
  );
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
      } catch (err) {
        console.error(`[readout] Failed to load team ${teamId}:`, err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [teamId]);

  const teamName = teamData?.team?.name || meta?.name || `Team ${teamId}`;
  const rawStats = teamData?.team?.stats;
  const teamStats = teamData?.teamStats;
  const roster = teamData?.team?.roster || [];
  const conference = teamData?.team?.conference?.name || meta?.conference || '';

  const stats = rawStats ? {
    ...rawStats,
    battingAvg: rawStats.battingAvg || teamStats?.batting?.battingAverage || 0,
    era: rawStats.era || teamStats?.pitching?.era || 0,
  } : null;

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

  const winPct = stats && (stats.wins + stats.losses) > 0
    ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(0)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface-scoreboard)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[var(--bsi-primary)]/30 border-t-[var(--bsi-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[var(--surface-scoreboard)] text-[var(--bsi-bone)]">
        {/* ═══ Dossier Header ═══ */}
        <Section className="pt-6 pb-8 relative overflow-hidden grain-overlay">
          <div className="absolute inset-0 bg-gradient-to-b from-burnt-orange/6 via-transparent to-transparent pointer-events-none" />
          <Container>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs font-display uppercase tracking-wider mb-6">
              <Link href="/college-baseball" className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors">
                College Baseball
              </Link>
              <span className="text-[rgba(196,184,165,0.35)]">/</span>
              <Link href={`/college-baseball/teams/${teamId}`} className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors">
                {teamName}
              </Link>
              <span className="text-[rgba(196,184,165,0.35)]">/</span>
              <span className="text-[rgba(196,184,165,0.5)]">Readout</span>
            </nav>

            {/* Team Identity */}
            <div className="flex items-start gap-5 mb-6">
              {logoUrl && (
                <div className="shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-sm overflow-hidden heritage-card p-2 flex items-center justify-center">
                  <img src={logoUrl} alt={teamName} className="w-full h-full object-contain" loading="eager" />
                </div>
              )}
              <div className="min-w-0">
                <span className="heritage-stamp mb-2 inline-block text-[9px]">Executive Readout</span>
                <h1
                  className="font-display font-bold uppercase tracking-display text-[var(--bsi-bone)]"
                  style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', lineHeight: 1.1 }}
                >
                  {teamName}
                </h1>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-sm text-[rgba(196,184,165,0.35)]">{conference}</span>
                  {winPct && (
                    <span className="text-xs font-mono text-[rgba(196,184,165,0.35)]">
                      {winPct}% W
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ═══ Record Strip ═══ */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <StatCell label="Record" value={`${stats.wins}-${stats.losses}`} />
                <StatCell label="Conference" value={`${stats.confWins}-${stats.confLosses}`} />
                <StatCell label="Team AVG" value={stats.battingAvg.toFixed(3)} />
                <StatCell label="Team ERA" value={stats.era.toFixed(2)} />
                {stats.streak && (
                  <div className="heritage-card px-4 py-3 text-center">
                    <div className="text-[10px] font-display uppercase tracking-[0.2em] text-[rgba(196,184,165,0.35)] mb-1">Streak</div>
                    <div className={`font-mono text-xl md:text-2xl font-bold ${stats.streak.startsWith('W') ? 'text-[var(--bsi-success)]' : 'text-[var(--bsi-danger)]'}`}>
                      {stats.streak}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Texas Intel Hub CTA */}
            {teamId === 'texas' && (
              <div className="mt-4">
                <Link href="/college-baseball/texas-intelligence">
                  <div className="heritage-card px-5 py-4 border-t-2 border-[var(--bsi-primary)] hover:border-[var(--bsi-primary)]/80 transition-colors cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="heritage-stamp text-[9px] block mb-1">Dedicated Hub</span>
                        <span className="font-display font-bold text-sm uppercase tracking-wide text-[var(--bsi-bone)] group-hover:text-[var(--bsi-primary)] transition-colors">
                          Texas Intelligence Hub
                        </span>
                        <p className="text-[rgba(196,184,165,0.35)] text-xs mt-1">
                          Full sabermetrics, scouting, draft board, press conference analysis, and program history
                        </p>
                      </div>
                      <span className="text-[var(--bsi-primary)] text-lg" aria-hidden="true">&rarr;</span>
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </Container>
        </Section>

        {/* ═══ Main Content ═══ */}
        <Section className="py-8">
          <Container>
            <div className="grid lg:grid-cols-3 gap-5">
              {/* ── Left Column: Performance + Schedule (2/3) ── */}
              <div className="lg:col-span-2 space-y-5">
                {/* Performance Snapshot */}
                {teamStats && (
                  <Panel title="Performance Snapshot">
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-6">
                        {teamStats.batting && (
                          <div>
                            <div className="section-rule-thick mb-3" />
                            <span className="text-[10px] font-display uppercase tracking-[0.25em] text-[var(--bsi-primary)] block mb-3">
                              Batting
                            </span>
                            <div className="space-y-2.5">
                              {([
                                ['AVG', teamStats.batting.battingAverage.toFixed(3)],
                                ['OPS', teamStats.batting.ops.toFixed(3)],
                                ['HR', String(teamStats.batting.homeRuns)],
                                ['Runs', String(teamStats.batting.runs)],
                              ] as const).map(([label, val]) => (
                                <div key={label} className="flex justify-between items-baseline text-sm">
                                  <span className="text-[rgba(196,184,165,0.35)]">{label}</span>
                                  <span className="text-[var(--bsi-bone)] font-mono tabular-nums">{val}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {teamStats.pitching && (
                          <div>
                            <div className="section-rule-thick mb-3" />
                            <span className="text-[10px] font-display uppercase tracking-[0.25em] text-[var(--bsi-primary)] block mb-3">
                              Pitching
                            </span>
                            <div className="space-y-2.5">
                              {([
                                ['ERA', teamStats.pitching.era.toFixed(2)],
                                ['WHIP', teamStats.pitching.whip.toFixed(2)],
                                ['SO', String(teamStats.pitching.strikeouts)],
                              ] as const).map(([label, val]) => (
                                <div key={label} className="flex justify-between items-baseline text-sm">
                                  <span className="text-[rgba(196,184,165,0.35)]">{label}</span>
                                  <span className="text-[var(--bsi-bone)] font-mono tabular-nums">{val}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Panel>
                )}

                {/* Recent Results */}
                {recentResults.length > 0 && (
                  <Panel title="Recent Results">
                    <div className="divide-y divide-border-vintage/40">
                      {recentResults.map(g => (
                        <div key={g.id} className="flex items-center justify-between px-4 py-2.5">
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-6 h-6 rounded-sm flex items-center justify-center text-xs font-bold ${
                                g.result === 'W'
                                  ? 'bg-[var(--bsi-success)]/15 text-[var(--bsi-success)]'
                                  : 'bg-[var(--bsi-danger)]/15 text-[var(--bsi-danger)]'
                              }`}
                            >
                              {g.result}
                            </span>
                            <span className="text-sm text-[var(--bsi-bone)]">
                              {g.isHome ? 'vs' : '@'} {g.opponent.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {g.score && (
                              <span className="text-sm font-mono tabular-nums text-[var(--bsi-dust)]">
                                {g.score.team}&ndash;{g.score.opponent}
                              </span>
                            )}
                            <span className="text-xs text-[rgba(196,184,165,0.35)] font-mono">{formatDate(g.date)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Panel>
                )}

                {/* Upcoming */}
                {upcoming.length > 0 && (
                  <Panel title="Upcoming">
                    <div className="divide-y divide-border-vintage/40">
                      {upcoming.map(g => (
                        <div key={g.id} className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-sm text-[var(--bsi-bone)]">
                            {g.isHome ? 'vs' : '@'} {g.opponent.name}
                          </span>
                          <span className="text-xs text-[rgba(196,184,165,0.35)] font-mono">{formatDate(g.date)}</span>
                        </div>
                      ))}
                    </div>
                  </Panel>
                )}
              </div>

              {/* ── Right Column: NIL + Roster + Links (1/3) ── */}
              <div className="space-y-5">
                {/* NIL Position */}
                <Panel title="NIL Position" accentHeader>
                  <div className="p-4">
                    {teamNIL.length > 0 ? (
                      <>
                        <div className="text-center mb-4 corner-marks py-4">
                          <div className="text-[10px] font-display uppercase tracking-[0.25em] text-[rgba(196,184,165,0.35)]">
                            Total Roster Value
                          </div>
                          <div
                            className="font-display font-bold text-[var(--bsi-primary)] mt-1"
                            style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}
                          >
                            {formatNIL(nilTotal)}
                          </div>
                          <div className="text-[10px] text-[rgba(196,184,165,0.35)] mt-1 font-mono">
                            {teamNIL.length} players scored
                          </div>
                        </div>

                        <div className="heritage-divider" />

                        <div className="space-y-0">
                          {teamNIL.slice(0, 5).map((p, i) => (
                            <div key={p.player_name} className="flex items-center justify-between py-1.5 text-sm">
                              <span className="text-[var(--bsi-bone)] truncate">
                                <span className="text-[rgba(196,184,165,0.35)] font-mono text-xs mr-1.5">{i + 1}</span>
                                {p.player_name}
                              </span>
                              <span className="text-[var(--bsi-primary)] font-mono font-bold shrink-0 ml-2 tabular-nums">
                                {formatNIL(p.estimated_mid)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <Link
                          href="/nil-valuation"
                          className="block text-center mt-3 text-xs font-display uppercase tracking-wider text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors"
                        >
                          Full NIL Analysis &rarr;
                        </Link>
                      </>
                    ) : (
                      <p className="text-sm text-[rgba(196,184,165,0.35)] text-center py-4">
                        No NIL data available
                      </p>
                    )}
                  </div>
                </Panel>

                {/* Roster Depth */}
                <Panel title="Roster Depth">
                  <div className="p-4">
                    {roster.length > 0 ? (
                      <>
                        <div className="text-center mb-3">
                          <div className="font-display text-2xl font-bold text-[var(--bsi-bone)]">{roster.length}</div>
                          <div className="text-[10px] font-display uppercase tracking-[0.2em] text-[rgba(196,184,165,0.35)]">
                            Active Players
                          </div>
                        </div>
                        <div className="heritage-divider" />
                        {(() => {
                          const pitchers = roster.filter(p => ['P', 'SP', 'RP', 'LHP', 'RHP', 'LHSP', 'RHSP', 'LHRP', 'RHRP'].includes((p.position || '').toUpperCase()));
                          const catchers = roster.filter(p => (p.position || '').toUpperCase() === 'C');
                          const infielders = roster.filter(p => ['1B', '2B', '3B', 'SS', 'IF'].includes((p.position || '').toUpperCase()));
                          const outfielders = roster.filter(p => ['LF', 'CF', 'RF', 'OF'].includes((p.position || '').toUpperCase()));
                          return (
                            <div className="space-y-2 text-sm">
                              {([
                                ['Pitchers', pitchers.length],
                                ['Catchers', catchers.length],
                                ['Infielders', infielders.length],
                                ['Outfielders', outfielders.length],
                              ] as const).map(([label, count]) => (
                                <div key={label} className="flex justify-between items-baseline">
                                  <span className="text-[rgba(196,184,165,0.35)]">{label}</span>
                                  <span className="text-[var(--bsi-bone)] font-mono tabular-nums">{count}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </>
                    ) : (
                      <p className="text-sm text-[rgba(196,184,165,0.35)] text-center py-4">
                        No roster data available
                      </p>
                    )}
                  </div>
                </Panel>

                {/* Quick Links */}
                <div className="heritage-card p-4">
                  <div className="space-y-2">
                    {([
                      [`/college-baseball/teams/${teamId}`, '\u2190 Full Team Page'],
                      ['/college-baseball/transfer-portal', 'Transfer Portal \u2192'],
                      ['/college-baseball/savant', 'Savant Explorer \u2192'],
                      ['/nil-valuation/tools', 'NIL Tools \u2192'],
                    ] as const).map(([href, label]) => (
                      <Link
                        key={href}
                        href={href}
                        className="block text-xs font-display uppercase tracking-wider text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors"
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
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
