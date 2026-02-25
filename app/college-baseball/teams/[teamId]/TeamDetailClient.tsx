'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { AITeamPreview } from '@/components/college-baseball/AITeamPreview';
import { SabermetricsPanel } from '@/components/college-baseball/SabermetricsPanel';
import { preseason2026, getTierLabel } from '@/lib/data/preseason-2026';
import { teamMetadata, getLogoUrl } from '@/lib/data/team-metadata';
import { useSportData } from '@/lib/hooks/useSportData';

// ─── Types ─────────────────────────────────────────────────────────────────

interface LiveStats {
  wins: number;
  losses: number;
  confWins: number;
  confLosses: number;
  rpi: number;
  streak?: string;
  runsScored: number;
  runsAllowed: number;
  battingAvg: number;
  era: number;
}

interface TeamStats {
  batting: {
    atBats: number;
    hits: number;
    homeRuns: number;
    rbi: number;
    runs: number;
    strikeouts: number;
    battingAverage: number;
    players: number;
  };
  pitching: {
    inningsPitched: number;
    earnedRuns: number;
    strikeouts: number;
    walks: number;
    hitsAllowed: number;
    era: number;
    whip: number;
    pitchers: number;
  };
}

interface RosterPlayer {
  id?: string;
  name: string;
  number: string;
  position: string;
  year?: string;
  stats?: {
    avg?: number;
    hr?: number;
    rbi?: number;
    era?: number;
    wins?: number;
    so?: number;
  };
}

interface ScheduleGame {
  id: string;
  date: string;
  opponent: { name: string; abbreviation: string };
  isHome: boolean;
  status: string;
  detail: string;
  score: { team: number; opponent: number } | null;
  result: 'W' | 'L' | 'T' | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'America/Chicago',
    });
  } catch {
    return iso;
  }
}

function getAccentColor(primary: string, secondary: string): string {
  const lum = getLuminance(primary);
  if (lum >= 0.35) return primary;
  const secLum = getLuminance(secondary);
  if (secLum >= 0.35) return secondary;
  return lightenHex(primary, 0.4);
}

function getLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function lightenHex(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.round(r + (255 - r) * amount);
  const lg = Math.round(g + (255 - g) * amount);
  const lb = Math.round(b + (255 - b) * amount);
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
}

// ─── Component ─────────────────────────────────────────────────────────────

interface TeamDetailClientProps {
  teamId: string;
}

export default function TeamDetailClient({ teamId }: TeamDetailClientProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'roster' | 'schedule' | 'advanced'>('overview');
  const [logoError, setLogoError] = useState(false);

  const meta = teamMetadata[teamId];
  const preseason = preseason2026[teamId];

  // Team data (roster, stats, record) — always fetched
  const { data: teamData, error: statsError } = useSportData<Record<string, unknown>>(
    `/api/college-baseball/teams/${teamId}`,
    { timeout: 10000 },
  );

  // Schedule data — lazy-loaded when schedule tab is active
  const { data: scheduleData } = useSportData<{ schedule: ScheduleGame[] }>(
    activeTab === 'schedule' ? `/api/college-baseball/teams/${teamId}/schedule` : null,
    { timeout: 10000 },
  );

  // ─── Derived state ────────────────────────────────────────────────────────

  const liveStats = useMemo(() => {
    if (!teamData) return null;
    const teamObj = teamData.team as Record<string, unknown> | undefined;
    const stats = (teamObj?.stats ?? teamData.stats) as LiveStats | undefined;
    return stats?.wins !== undefined && stats?.losses !== undefined ? stats : null;
  }, [teamData]);

  const rosterPlayers = useMemo<RosterPlayer[]>(() => {
    if (!teamData) return [];
    const teamObj = teamData.team as Record<string, unknown> | undefined;
    return (teamObj?.roster ?? []) as RosterPlayer[];
  }, [teamData]);

  const teamStats = useMemo<TeamStats | null>(() => {
    if (!teamData) return null;
    return (teamData.teamStats as TeamStats) ?? null;
  }, [teamData]);

  const scheduleGames = useMemo<ScheduleGame[]>(() => {
    return scheduleData?.schedule ?? [];
  }, [scheduleData]);

  const teamLeaders = useMemo(() => {
    if (!rosterPlayers || rosterPlayers.length === 0) return null;
    const withAvg = rosterPlayers.filter((p) => p.stats?.avg && p.stats.avg > 0);
    const withHR = rosterPlayers.filter((p) => p.stats?.hr && p.stats.hr > 0);
    const withERA = rosterPlayers.filter((p) => p.stats?.era && p.stats.era > 0);

    const battingAvg = withAvg.sort((a, b) => (b.stats?.avg ?? 0) - (a.stats?.avg ?? 0))[0] ?? null;
    const homeRuns = withHR.sort((a, b) => (b.stats?.hr ?? 0) - (a.stats?.hr ?? 0))[0] ?? null;
    const era = withERA.sort((a, b) => (a.stats?.era ?? 99) - (b.stats?.era ?? 99))[0] ?? null;

    if (!battingAvg && !homeRuns && !era) return null;
    return { battingAvg, homeRuns, era };
  }, [rosterPlayers]);

  const statsUnavailable = !!statsError;

  // ─── Theme ────────────────────────────────────────────────────────────────

  const accent = meta ? getAccentColor(meta.colors.primary, meta.colors.secondary) : '#BF5700';
  const teamStyles = meta
    ? ({ '--team-primary': accent, '--team-primary-20': `${accent}33`, '--team-primary-40': `${accent}66` } as React.CSSProperties)
    : {};

  // ─── Not found ────────────────────────────────────────────────────────────

  if (!meta) {
    return (
      <>
        <main className="min-h-screen pt-24 bg-gradient-to-b from-charcoal to-[#0D0D0D]">
          <Container>
            <Card padding="lg" className="text-center mt-12">
              <div className="text-burnt-orange text-4xl mb-4 font-display">?</div>
              <h3 className="text-xl font-semibold text-white mb-2">Team Not Found</h3>
              <p className="text-white/50 mb-6">No data available for &ldquo;{teamId}&rdquo;.</p>
              <Link href="/college-baseball/teams" className="inline-block px-6 py-2 bg-burnt-orange text-white font-semibold rounded-lg hover:bg-burnt-orange/90 transition-colors">
                Back to Teams
              </Link>
            </Card>
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  const logoUrl = getLogoUrl(meta.espnId);
  const hasPreseason = !!preseason;
  const overallRecord = preseason?.record2025?.split(' (')[0] || null;
  const confRecord = preseason?.record2025?.match(/\(([^)]+)\)/)?.[1] || null;
  const hasLiveRecord = liveStats && liveStats.wins + liveStats.losses > 0;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <main id="main-content" style={teamStyles}>
        {/* Hero */}
        <div style={{ backgroundImage: `linear-gradient(to bottom, ${accent}1A, #1A1A1A, #0D0D0D)` }}>
          <Section padding="lg" className="pt-24">
            <Container>
              <ScrollReveal direction="up">
                <nav className="flex items-center gap-3 mb-8 text-sm">
                  <Link href="/college-baseball" className="text-white/30 hover:text-burnt-orange transition-colors">College Baseball</Link>
                  <span className="text-white/20">/</span>
                  <Link href="/college-baseball/teams" className="text-white/30 hover:text-burnt-orange transition-colors">Teams</Link>
                  <span className="text-white/20">/</span>
                  <span className="text-white/60">{meta.shortName}</span>
                </nav>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
                  {/* Logo */}
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-white/5 flex items-center justify-center overflow-hidden shrink-0" style={{ borderWidth: '4px', borderStyle: 'solid', borderColor: `${accent}40` }}>
                    {!logoError ? (
                      <img src={logoUrl} alt={`${meta.name} logo`} className="w-20 h-20 md:w-24 md:h-24 object-contain" loading="eager" onError={() => setLogoError(true)} />
                    ) : (
                      <span className="font-display font-bold text-3xl md:text-4xl" style={{ color: accent }}>{meta.abbreviation}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white uppercase tracking-wide">{meta.name}</h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant="secondary">{meta.conference}</Badge>
                      {hasPreseason && (
                        <>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold text-white" style={{ backgroundColor: accent }}>#{preseason.rank} Preseason</span>
                          <Badge variant="accent">{getTierLabel(preseason.tier)}</Badge>
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-white/40">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                        {meta.location.city}, {meta.location.state}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
                        {meta.location.stadium}
                      </span>
                    </div>
                  </div>

                  {/* Record Stats */}
                  <div className="flex flex-wrap gap-4 md:gap-6 shrink-0">
                    {hasLiveRecord && (
                      <div className="text-center">
                        <div className="font-mono text-2xl md:text-3xl font-bold" style={{ color: accent }}>{liveStats.wins}-{liveStats.losses}</div>
                        <div className="text-white/30 text-xs uppercase tracking-wider mt-1">2026 Record</div>
                      </div>
                    )}
                    {hasPreseason && (
                      <>
                        {!hasLiveRecord && overallRecord && (
                          <div className="text-center">
                            <div className="font-mono text-2xl md:text-3xl font-bold" style={{ color: accent }}>{overallRecord}</div>
                            <div className="text-white/30 text-xs uppercase tracking-wider mt-1">2025 Record</div>
                          </div>
                        )}
                        {confRecord && (
                          <div className="text-center">
                            <div className="font-mono text-2xl md:text-3xl font-bold text-white">{confRecord}</div>
                            <div className="text-white/30 text-xs uppercase tracking-wider mt-1">Conference</div>
                          </div>
                        )}
                        <div className="text-center">
                          <div className="font-mono text-2xl md:text-3xl font-bold text-green-400">#{preseason.rank}</div>
                          <div className="text-white/30 text-xs uppercase tracking-wider mt-1">BSI Rank</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            </Container>
          </Section>
        </div>

        {/* Tabs */}
        <Section padding="none" className="bg-charcoal border-b border-white/10 sticky top-16 z-30">
          <Container>
            <div className="flex gap-1">
              {(['overview', 'roster', 'schedule', 'advanced'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 font-semibold text-sm uppercase tracking-wider transition-colors ${activeTab === tab ? 'border-b-2' : 'text-white/30 hover:text-white/60'}`}
                  style={activeTab === tab ? { color: accent, borderColor: accent } : undefined}
                >
                  {tab === 'advanced' ? 'Advanced Stats' : tab}
                </button>
              ))}
            </div>
          </Container>
        </Section>

        {/* Tab Content */}
        <Section padding="lg" className="bg-[#0D0D0D]">
          <Container>
            {/* ── Overview ──────────────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <>
                {hasPreseason && (
                  <ScrollReveal direction="up" className="mb-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card padding="md">
                        <div className="text-xs uppercase tracking-wide text-white/30">2025 Record</div>
                        <div className="mt-1 text-xl font-mono text-white">{preseason.record2025}</div>
                      </Card>
                      <Card padding="md">
                        <div className="text-xs uppercase tracking-wide text-white/30">Postseason</div>
                        <div className="mt-1 text-xl font-mono" style={{ color: accent }}>{preseason.postseason2025}</div>
                      </Card>
                      <Card padding="md">
                        <div className="text-xs uppercase tracking-wide text-white/30">BSI Tier</div>
                        <div className="mt-1 text-xl font-display uppercase tracking-wide text-white">{getTierLabel(preseason.tier)}</div>
                      </Card>
                      <Card padding="md">
                        <div className="text-xs uppercase tracking-wide text-white/30">Conference</div>
                        <div className="mt-1 text-xl font-display uppercase tracking-wide text-white">{preseason.conference}</div>
                      </Card>
                    </div>
                  </ScrollReveal>
                )}

                {!hasPreseason && (
                  <ScrollReveal direction="up" className="mb-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {hasLiveRecord && (
                        <Card padding="md">
                          <div className="text-xs uppercase tracking-wide text-white/30">2026 Record</div>
                          <div className="mt-1 text-xl font-mono" style={{ color: accent }}>
                            {liveStats.wins}-{liveStats.losses}
                          </div>
                        </Card>
                      )}
                      <Card padding="md">
                        <div className="text-xs uppercase tracking-wide text-white/30">Conference</div>
                        <div className="mt-1 text-xl font-display uppercase tracking-wide text-white">
                          {meta.conference}
                        </div>
                      </Card>
                      {rosterPlayers.length > 0 && (
                        <Card padding="md">
                          <div className="text-xs uppercase tracking-wide text-white/30">Roster</div>
                          <div className="mt-1 text-xl font-mono text-white">
                            {rosterPlayers.length} players
                          </div>
                        </Card>
                      )}
                      <Card padding="md">
                        <div className="text-xs uppercase tracking-wide text-white/30">Division</div>
                        <div className="mt-1 text-xl font-display uppercase tracking-wide text-white">
                          D1
                        </div>
                      </Card>
                    </div>
                  </ScrollReveal>
                )}

                {preseason?.editorialLink && (
                  <ScrollReveal direction="up" className="mb-8">
                    <Link href={preseason.editorialLink}>
                      <Card variant="hover" padding="lg" className="group flex items-center justify-between">
                        <div>
                          <div className="text-xs uppercase tracking-wide font-semibold mb-1" style={{ color: accent }}>Full Preview Available</div>
                          <div className="text-white font-display text-lg uppercase tracking-wide">{meta.shortName} 2026 Season Preview</div>
                          <div className="text-white/40 text-sm mt-1">Deep-dive scouting report, roster breakdown, schedule analysis, and projection</div>
                        </div>
                        <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform shrink-0 ml-4" style={{ color: accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Card>
                    </Link>
                  </ScrollReveal>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {hasPreseason && preseason.keyPlayers.length > 0 && (
                    <ScrollReveal direction="up">
                      <Card padding="lg">
                        <h2 className="font-display text-xl font-bold text-white uppercase tracking-wide mb-6">Key Players</h2>
                        <div className="space-y-4">
                          {preseason.keyPlayers.map((player) => {
                            const match = player.match(/^(.+?)\s*\((.+)\)$/);
                            const name = match ? match[1] : player;
                            const stat = match ? match[2] : null;
                            return (
                              <div key={player} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <span className="text-white font-semibold">{name}</span>
                                {stat && <span className="font-mono text-sm" style={{ color: accent }}>{stat}</span>}
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    </ScrollReveal>
                  )}

                  {hasPreseason && (
                    <ScrollReveal direction="up" delay={100}>
                      <Card padding="lg">
                        <h2 className="font-display text-xl font-bold text-white uppercase tracking-wide mb-4">BSI Outlook</h2>
                        <Badge variant="accent" className="mb-4">{getTierLabel(preseason.tier)}</Badge>
                        <p className="text-white/60 leading-relaxed">{preseason.outlook}</p>
                      </Card>
                    </ScrollReveal>
                  )}

                  {!hasPreseason && (
                    <ScrollReveal direction="up">
                      <Card padding="lg">
                        <h2 className="font-display text-xl font-bold text-white uppercase tracking-wide mb-6">
                          Team Profile
                        </h2>
                        <div className="space-y-4">
                          <div className="flex justify-between py-2 border-b border-white/5">
                            <span className="text-white/40">Conference</span>
                            <span className="text-white font-semibold">{meta.conference}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-white/5">
                            <span className="text-white/40">Stadium</span>
                            <span className="text-white font-semibold">{meta.location.stadium}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-white/5">
                            <span className="text-white/40">Location</span>
                            <span className="text-white font-semibold">{meta.location.city}, {meta.location.state}</span>
                          </div>
                          {rosterPlayers.length > 0 && (
                            <div className="flex justify-between py-2 border-b border-white/5">
                              <span className="text-white/40">Active Roster</span>
                              <span className="text-white font-semibold">{rosterPlayers.length} players</span>
                            </div>
                          )}
                        </div>
                      </Card>
                    </ScrollReveal>
                  )}
                </div>

                {/* Tab CTAs for non-ranked teams */}
                {!hasPreseason && (
                  <ScrollReveal direction="up" delay={100} className="mt-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {rosterPlayers.length > 0 && (
                        <button onClick={() => setActiveTab('roster')} className="text-left">
                          <Card padding="md" className="hover:border-burnt-orange/50 transition-all">
                            <div className="text-xs uppercase tracking-wide mb-1" style={{ color: accent }}>
                              Full Roster
                            </div>
                            <div className="text-white font-semibold">
                              {rosterPlayers.length} players &mdash; view roster breakdown
                            </div>
                          </Card>
                        </button>
                      )}
                      <button onClick={() => setActiveTab('schedule')} className="text-left">
                        <Card padding="md" className="hover:border-burnt-orange/50 transition-all">
                          <div className="text-xs uppercase tracking-wide mb-1" style={{ color: accent }}>
                            Season Schedule
                          </div>
                          <div className="text-white font-semibold">
                            View full 2026 schedule &amp; results
                          </div>
                        </Card>
                      </button>
                    </div>
                  </ScrollReveal>
                )}

                {/* Team Season Stats — from D1 accumulated data */}
                {teamStats && (
                  <ScrollReveal direction="up" className="mt-8">
                    <Card padding="lg">
                      <h2 className="font-display text-xl font-bold text-white uppercase tracking-wide mb-6">2026 Season Stats</h2>
                      <div className="grid grid-cols-2 gap-8">
                        {/* Batting */}
                        <div>
                          <div className="text-xs uppercase tracking-wider text-white/30 mb-4 font-semibold">Batting</div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <div className="font-mono text-2xl font-bold" style={{ color: accent }}>{teamStats.batting.battingAverage.toFixed(3).replace(/^0/, '')}</div>
                              <div className="text-white/30 text-xs uppercase mt-1">AVG</div>
                            </div>
                            <div>
                              <div className="font-mono text-2xl font-bold text-white">{teamStats.batting.homeRuns}</div>
                              <div className="text-white/30 text-xs uppercase mt-1">HR</div>
                            </div>
                            <div>
                              <div className="font-mono text-2xl font-bold text-white">{teamStats.batting.rbi}</div>
                              <div className="text-white/30 text-xs uppercase mt-1">RBI</div>
                            </div>
                            <div>
                              <div className="font-mono text-lg text-white/60">{teamStats.batting.runs}</div>
                              <div className="text-white/30 text-xs uppercase mt-1">Runs</div>
                            </div>
                            <div>
                              <div className="font-mono text-lg text-white/60">{teamStats.batting.hits}</div>
                              <div className="text-white/30 text-xs uppercase mt-1">Hits</div>
                            </div>
                            <div>
                              <div className="font-mono text-lg text-white/60">{teamStats.batting.players}</div>
                              <div className="text-white/30 text-xs uppercase mt-1">Batters</div>
                            </div>
                          </div>
                        </div>
                        {/* Pitching */}
                        <div>
                          <div className="text-xs uppercase tracking-wider text-white/30 mb-4 font-semibold">Pitching</div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <div className="font-mono text-2xl font-bold" style={{ color: accent }}>{teamStats.pitching.era.toFixed(2)}</div>
                              <div className="text-white/30 text-xs uppercase mt-1">ERA</div>
                            </div>
                            <div>
                              <div className="font-mono text-2xl font-bold text-white">{teamStats.pitching.strikeouts}</div>
                              <div className="text-white/30 text-xs uppercase mt-1">K</div>
                            </div>
                            <div>
                              <div className="font-mono text-2xl font-bold text-white">{teamStats.pitching.whip.toFixed(2)}</div>
                              <div className="text-white/30 text-xs uppercase mt-1">WHIP</div>
                            </div>
                            <div>
                              <div className="font-mono text-lg text-white/60">{teamStats.pitching.inningsPitched}</div>
                              <div className="text-white/30 text-xs uppercase mt-1">IP</div>
                            </div>
                            <div>
                              <div className="font-mono text-lg text-white/60">{teamStats.pitching.walks}</div>
                              <div className="text-white/30 text-xs uppercase mt-1">BB</div>
                            </div>
                            <div>
                              <div className="font-mono text-lg text-white/60">{teamStats.pitching.pitchers}</div>
                              <div className="text-white/30 text-xs uppercase mt-1">Pitchers</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </ScrollReveal>
                )}

                {/* Team Leaders — only when stats are available from Highlightly/D1 */}
                {teamLeaders && (
                  <ScrollReveal direction="up" className="mt-8">
                    <Card padding="lg">
                      <h2 className="font-display text-xl font-bold text-white uppercase tracking-wide mb-6">Team Leaders</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {teamLeaders.battingAvg && (
                          <div className="text-center">
                            <div className="text-white/30 text-xs uppercase tracking-wider mb-2">Batting Avg</div>
                            <div className="font-mono text-2xl font-bold" style={{ color: accent }}>{teamLeaders.battingAvg.stats?.avg?.toFixed(3)}</div>
                            <div className="text-white font-semibold mt-1">{teamLeaders.battingAvg.name}</div>
                            <div className="text-white/40 text-xs">{teamLeaders.battingAvg.position}</div>
                          </div>
                        )}
                        {teamLeaders.homeRuns && (
                          <div className="text-center">
                            <div className="text-white/30 text-xs uppercase tracking-wider mb-2">Home Runs</div>
                            <div className="font-mono text-2xl font-bold" style={{ color: accent }}>{teamLeaders.homeRuns.stats?.hr}</div>
                            <div className="text-white font-semibold mt-1">{teamLeaders.homeRuns.name}</div>
                            <div className="text-white/40 text-xs">{teamLeaders.homeRuns.position}</div>
                          </div>
                        )}
                        {teamLeaders.era && (
                          <div className="text-center">
                            <div className="text-white/30 text-xs uppercase tracking-wider mb-2">ERA</div>
                            <div className="font-mono text-2xl font-bold" style={{ color: accent }}>{teamLeaders.era.stats?.era?.toFixed(2)}</div>
                            <div className="text-white font-semibold mt-1">{teamLeaders.era.name}</div>
                            <div className="text-white/40 text-xs">{teamLeaders.era.position}</div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </ScrollReveal>
                )}

                <ScrollReveal direction="up" className="mt-8">
                  <AITeamPreview teamId={teamId} teamName={meta.name} stats={liveStats ?? undefined} conference={meta.conference} />
                </ScrollReveal>
              </>
            )}

            {/* ── Schedule ─────────────────────────────────────────────────── */}
            {activeTab === 'schedule' && (
              <ScrollReveal direction="up">
                {scheduleGames.length > 0 ? (
                  <Card padding="none" className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                            <th className="text-left px-4 py-3">Date</th>
                            <th className="text-left px-4 py-3">Opponent</th>
                            <th className="text-center px-4 py-3">Result</th>
                            <th className="text-center px-4 py-3">Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scheduleGames.map((g) => (
                            <tr key={g.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3 text-white/60 whitespace-nowrap">{formatDate(g.date)}</td>
                              <td className="px-4 py-3 text-white font-semibold">{g.isHome ? 'vs' : '@'} {g.opponent.name}</td>
                              <td className="px-4 py-3 text-center">
                                {g.result === 'W' && <span className="text-green-400 font-bold">W</span>}
                                {g.result === 'L' && <span className="text-red-400 font-bold">L</span>}
                                {!g.result && g.status === 'in' && <span style={{ color: accent }} className="font-bold">LIVE</span>}
                                {!g.result && g.status === 'pre' && <span className="text-white/30">{g.detail || '\u2014'}</span>}
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-white/80">
                                {g.score ? `${g.score.team}-${g.score.opponent}` : '\u2014'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-4 py-3 border-t border-white/5 text-xs text-white/20">
                      {scheduleGames.length} games &mdash; Source: ESPN
                    </div>
                  </Card>
                ) : (
                  <Card padding="lg" className="text-center">
                    <p className="text-white/50">Schedule loading...</p>
                  </Card>
                )}
              </ScrollReveal>
            )}

            {/* ── Roster ──────────────────────────────────────────────────── */}
            {activeTab === 'roster' && (
              <ScrollReveal direction="up">
                {rosterPlayers.length > 0 ? (() => {
                  const hasNumbers = rosterPlayers.some((p) => p.number && p.number !== '');
                  const hasPositions = rosterPlayers.some((p) => p.position && p.position !== 'UN' && p.position !== '');
                  const hasYears = rosterPlayers.some((p) => p.year && p.year !== '' && p.year !== '—');
                  const hasStats = rosterPlayers.some((p) => p.stats && (p.stats.avg !== undefined || p.stats.era !== undefined));
                  return (
                    <Card padding="none" className="overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                              {hasNumbers && <th className="text-left px-4 py-3">#</th>}
                              <th className="text-left px-4 py-3">Name</th>
                              {hasPositions && <th className="text-left px-4 py-3">Pos</th>}
                              {hasYears && <th className="text-left px-4 py-3">Year</th>}
                              {hasStats && (
                                <>
                                  <th className="text-right px-4 py-3">AVG/ERA</th>
                                  <th className="text-right px-4 py-3">HR/K</th>
                                  <th className="text-right px-4 py-3">RBI/W</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {rosterPlayers.map((p) => {
                              const isBatter = p.stats?.avg !== undefined;
                              const isPitcher = p.stats?.era !== undefined;
                              return (
                                <tr key={p.id || p.name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                  {hasNumbers && <td className="px-4 py-3 font-mono" style={{ color: accent }}>{p.number}</td>}
                                  <td className="px-4 py-3 text-white font-semibold">
                                    {p.id ? <Link href={`/college-baseball/players/${p.id}`} className="hover:underline">{p.name}</Link> : p.name}
                                  </td>
                                  {hasPositions && <td className="px-4 py-3 text-white/60">{p.position}</td>}
                                  {hasYears && <td className="px-4 py-3 text-white/60">{p.year}</td>}
                                  {hasStats && (
                                    <>
                                      <td className="px-4 py-3 text-right font-mono text-white/80">
                                        {isBatter ? p.stats?.avg?.toFixed(3).replace(/^0/, '') : isPitcher ? p.stats?.era?.toFixed(2) : '\u2014'}
                                      </td>
                                      <td className="px-4 py-3 text-right font-mono text-white/60">
                                        {isBatter ? p.stats?.hr : isPitcher ? p.stats?.so : '\u2014'}
                                      </td>
                                      <td className="px-4 py-3 text-right font-mono text-white/60">
                                        {isBatter ? p.stats?.rbi : isPitcher ? (p.stats?.wins ?? '\u2014') : '\u2014'}
                                      </td>
                                    </>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="px-4 py-3 border-t border-white/5 text-xs text-white/20">
                        {rosterPlayers.length} players{hasStats ? ' \u00b7 Stats from D1 box scores' : ''} &mdash; Source: ESPN
                      </div>
                    </Card>
                  );
                })() : (
                  <Card padding="lg" className="text-center">
                    <p className="text-white/50">Roster loading...</p>
                  </Card>
                )}
              </ScrollReveal>
            )}

            {/* ── Advanced Stats ──────────────────────────────────────────── */}
            {activeTab === 'advanced' && (
              <SabermetricsPanel teamId={teamId} espnId={meta?.espnId} accent={accent} />
            )}

            {/* Attribution */}
            <div className="mt-12 pt-6 border-t border-white/5 text-center">
              <div className="flex items-center justify-center gap-2 text-xs text-white/20">
                <span>BSI Preseason Intelligence</span>
                <span>|</span>
                <span>NCAA / D1Baseball</span>
                {liveStats && (
                  <>
                    <span>|</span>
                    <Badge variant="success" size="sm">Live Stats Active</Badge>
                  </>
                )}
                {statsUnavailable && !liveStats && (
                  <>
                    <span>|</span>
                    <span className="text-yellow-500/60 text-xs">Live stats temporarily unavailable</span>
                  </>
                )}
              </div>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
