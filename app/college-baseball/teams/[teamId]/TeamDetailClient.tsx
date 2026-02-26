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
import { FEATURE_ARTICLES } from '@/app/college-baseball/editorial/page';

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
    walks: number;
    stolenBases: number;
    doubles: number;
    triples: number;
    totalBases: number;
    hitByPitch: number;
    obp: number;
    slg: number;
    ops: number;
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
    wins: number;
    losses: number;
    saves: number;
    runsAllowed: number;
    homeRunsAllowed: number;
    pitchers: number;
  };
}

interface RosterPlayer {
  id?: string;
  name: string;
  number: string;
  position: string;
  year?: string;
  headshot?: string;
  stats?: {
    // Batting
    avg?: number; obp?: number; slg?: number; ops?: number;
    hr?: number; rbi?: number; r?: number; h?: number; ab?: number;
    doubles?: number; triples?: number; bb?: number; k?: number;
    sb?: number; cs?: number; hbp?: number; sf?: number; sh?: number;
    tb?: number; gp?: number;
    // Pitching
    era?: number; whip?: number; w?: number; l?: number; sv?: number;
    ip?: number; ha?: number; ra?: number; er?: number;
    pitchBB?: number; so?: number; hra?: number; gpPitch?: number;
  };
}

// ─── Position Grouping ────────────────────────────────────────────────────

type PositionGroup = 'Rotation' | 'Bullpen' | 'Catchers' | 'Infielders' | 'Outfielders' | 'Utility';

const PITCHER_POSITIONS = new Set(['P', 'SP', 'RP', 'LHP', 'RHP', 'LHSP', 'RHSP', 'LHRP', 'RHRP']);
const CATCHER_POSITIONS = new Set(['C']);
const INFIELD_POSITIONS = new Set(['1B', '2B', '3B', 'SS', 'IF']);
const OUTFIELD_POSITIONS = new Set(['LF', 'CF', 'RF', 'OF']);

function classifyPosition(p: RosterPlayer): PositionGroup {
  const pos = (p.position || '').toUpperCase();
  // Check explicit position groups first — two-way players stay in their position group
  if (PITCHER_POSITIONS.has(pos)) {
    // Use IP-per-appearance to distinguish starters from relievers
    const ip = p.stats?.ip ?? 0;
    const gp = p.stats?.gpPitch ?? 1;
    const ipPerApp = gp > 0 ? ip / gp : ip;
    return ipPerApp >= 3.5 ? 'Rotation' : 'Bullpen';
  }
  if (CATCHER_POSITIONS.has(pos)) return 'Catchers';
  if (INFIELD_POSITIONS.has(pos)) return 'Infielders';
  if (OUTFIELD_POSITIONS.has(pos)) return 'Outfielders';
  // Only classify as pitcher if position is unknown AND pitching stats exist
  const hasPitchingStats = p.stats?.era !== undefined || p.stats?.ip !== undefined;
  if (hasPitchingStats) {
    const ip = p.stats?.ip ?? 0;
    const gp = p.stats?.gpPitch ?? 1;
    const ipPerApp = gp > 0 ? ip / gp : ip;
    return ipPerApp >= 3.5 ? 'Rotation' : 'Bullpen';
  }
  return 'Utility';
}

function groupRoster(players: RosterPlayer[]): { group: PositionGroup; players: RosterPlayer[] }[] {
  const groups: Record<PositionGroup, RosterPlayer[]> = {
    Rotation: [], Bullpen: [], Catchers: [], Infielders: [], Outfielders: [], Utility: [],
  };
  for (const p of players) {
    groups[classifyPosition(p)].push(p);
  }
  // Sort within groups
  groups.Rotation.sort((a, b) => (b.stats?.ip ?? 0) - (a.stats?.ip ?? 0));
  groups.Bullpen.sort((a, b) => (b.stats?.ip ?? 0) - (a.stats?.ip ?? 0));
  groups.Catchers.sort((a, b) => (b.stats?.avg ?? 0) - (a.stats?.avg ?? 0));
  groups.Infielders.sort((a, b) => (b.stats?.avg ?? 0) - (a.stats?.avg ?? 0));
  groups.Outfielders.sort((a, b) => (b.stats?.avg ?? 0) - (a.stats?.avg ?? 0));
  groups.Utility.sort((a, b) => (b.stats?.avg ?? 0) - (a.stats?.avg ?? 0));

  const order: PositionGroup[] = ['Rotation', 'Bullpen', 'Catchers', 'Infielders', 'Outfielders', 'Utility'];
  return order.filter(g => groups[g].length > 0).map(g => ({ group: g, players: groups[g] }));
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

  const positionGroups = useMemo(() => groupRoster(rosterPlayers), [rosterPlayers]);

  // Editorial articles for this team
  const teamArticles = useMemo(() => {
    return FEATURE_ARTICLES.filter(a =>
      a.teams?.includes(teamId) ||
      // Conference match only for articles without specific team targets (conference overviews)
      (!a.teams?.length && a.tags.some(t => t === meta?.conference))
    );
  }, [teamId, meta?.conference]);

  const statsUnavailable = !!statsError;

  // ─── Theme ────────────────────────────────────────────────────────────────

  const accent = meta ? getAccentColor(meta.colors.primary, meta.colors.secondary) : 'var(--bsi-primary)';
  const teamStyles = meta
    ? ({ '--team-primary': accent, '--team-primary-20': `${accent}33`, '--team-primary-40': `${accent}66` } as React.CSSProperties)
    : {};

  // ─── Not found ────────────────────────────────────────────────────────────

  if (!meta) {
    return (
      <>
        <main className="min-h-screen pt-24 bg-gradient-to-b from-charcoal to-background-primary">
          <Container>
            <Card padding="lg" className="text-center mt-12">
              <div className="text-burnt-orange text-4xl mb-4 font-display">?</div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Team Not Found</h3>
              <p className="text-text-muted mb-6">No data available for &ldquo;{teamId}&rdquo;.</p>
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

  const logoUrl = getLogoUrl(meta.espnId, meta.logoId);
  const hasPreseason = !!preseason;
  const overallRecord = preseason?.record2025?.split(' (')[0] || null;
  const confRecord = preseason?.record2025?.match(/\(([^)]+)\)/)?.[1] || null;
  const hasLiveRecord = liveStats && liveStats.wins + liveStats.losses > 0;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <main id="main-content" style={teamStyles}>
        {/* Hero */}
        <div style={{ backgroundImage: `linear-gradient(to bottom, ${accent}1A, var(--bsi-charcoal), var(--bsi-midnight))` }}>
          <Section padding="lg" className="pt-24">
            <Container>
              <ScrollReveal direction="up">
                <nav className="flex items-center gap-3 mb-8 text-sm">
                  <Link href="/college-baseball" className="text-text-muted hover:text-burnt-orange transition-colors">College Baseball</Link>
                  <span className="text-text-muted">/</span>
                  <Link href="/college-baseball/teams" className="text-text-muted hover:text-burnt-orange transition-colors">Teams</Link>
                  <span className="text-text-muted">/</span>
                  <span className="text-text-tertiary">{meta.shortName}</span>
                </nav>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
                  {/* Logo */}
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-surface-light flex items-center justify-center overflow-hidden shrink-0" style={{ borderWidth: '4px', borderStyle: 'solid', borderColor: `${accent}40` }}>
                    {!logoError ? (
                      <img src={logoUrl} alt={`${meta.name} logo`} className="w-20 h-20 md:w-24 md:h-24 object-contain" loading="eager" onError={() => setLogoError(true)} />
                    ) : (
                      <span className="font-display font-bold text-3xl md:text-4xl" style={{ color: accent }}>{meta.abbreviation}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary uppercase tracking-wide">{meta.name}</h1>
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
                    <div className="flex flex-wrap gap-4 text-sm text-text-muted">
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
                        <div className="text-text-muted text-xs uppercase tracking-wider mt-1">2026 Record</div>
                      </div>
                    )}
                    {hasPreseason && (
                      <>
                        {!hasLiveRecord && overallRecord && (
                          <div className="text-center">
                            <div className="font-mono text-2xl md:text-3xl font-bold" style={{ color: accent }}>{overallRecord}</div>
                            <div className="text-text-muted text-xs uppercase tracking-wider mt-1">2025 Record</div>
                          </div>
                        )}
                        {confRecord && (
                          <div className="text-center">
                            <div className="font-mono text-2xl md:text-3xl font-bold text-text-primary">{confRecord}</div>
                            <div className="text-text-muted text-xs uppercase tracking-wider mt-1">Conference</div>
                          </div>
                        )}
                        <div className="text-center">
                          <div className="font-mono text-2xl md:text-3xl font-bold text-success">#{preseason.rank}</div>
                          <div className="text-text-muted text-xs uppercase tracking-wider mt-1">BSI Rank</div>
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
        <Section padding="none" className="bg-charcoal border-b border-border sticky top-16 z-30">
          <Container>
            <div className="flex gap-1">
              {(['overview', 'roster', 'schedule', 'advanced'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 font-semibold text-sm uppercase tracking-wider transition-colors ${activeTab === tab ? 'border-b-2' : 'text-text-muted hover:text-text-tertiary'}`}
                  style={activeTab === tab ? { color: accent, borderColor: accent } : undefined}
                >
                  {tab === 'advanced' ? 'Advanced Stats' : tab}
                </button>
              ))}
            </div>
          </Container>
        </Section>

        {/* Tab Content */}
        <Section padding="lg" className="bg-background-primary">
          <Container>
            {/* ── Overview ──────────────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <>
                {hasPreseason && (
                  <ScrollReveal direction="up" className="mb-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card padding="md">
                        <div className="text-xs uppercase tracking-wide text-text-muted">2025 Record</div>
                        <div className="mt-1 text-xl font-mono text-text-primary">{preseason.record2025}</div>
                      </Card>
                      <Card padding="md">
                        <div className="text-xs uppercase tracking-wide text-text-muted">Postseason</div>
                        <div className="mt-1 text-xl font-mono" style={{ color: accent }}>{preseason.postseason2025}</div>
                      </Card>
                      <Card padding="md">
                        <div className="text-xs uppercase tracking-wide text-text-muted">BSI Tier</div>
                        <div className="mt-1 text-xl font-display uppercase tracking-wide text-text-primary">{getTierLabel(preseason.tier)}</div>
                      </Card>
                      <Card padding="md">
                        <div className="text-xs uppercase tracking-wide text-text-muted">Conference</div>
                        <div className="mt-1 text-xl font-display uppercase tracking-wide text-text-primary">{preseason.conference}</div>
                      </Card>
                    </div>
                  </ScrollReveal>
                )}

                {!hasPreseason && (
                  <ScrollReveal direction="up" className="mb-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {hasLiveRecord && (
                        <Card padding="md">
                          <div className="text-xs uppercase tracking-wide text-text-muted">2026 Record</div>
                          <div className="mt-1 text-xl font-mono" style={{ color: accent }}>
                            {liveStats.wins}-{liveStats.losses}
                          </div>
                        </Card>
                      )}
                      <Card padding="md">
                        <div className="text-xs uppercase tracking-wide text-text-muted">Conference</div>
                        <div className="mt-1 text-xl font-display uppercase tracking-wide text-text-primary">
                          {meta.conference}
                        </div>
                      </Card>
                      {rosterPlayers.length > 0 && (
                        <Card padding="md">
                          <div className="text-xs uppercase tracking-wide text-text-muted">Roster</div>
                          <div className="mt-1 text-xl font-mono text-text-primary">
                            {rosterPlayers.length} players
                          </div>
                        </Card>
                      )}
                      <Card padding="md">
                        <div className="text-xs uppercase tracking-wide text-text-muted">Division</div>
                        <div className="mt-1 text-xl font-display uppercase tracking-wide text-text-primary">
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
                          <div className="text-text-primary font-display text-lg uppercase tracking-wide">{meta.shortName} 2026 Season Preview</div>
                          <div className="text-text-muted text-sm mt-1">Deep-dive scouting report, roster breakdown, schedule analysis, and projection</div>
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
                        <h2 className="font-display text-xl font-bold text-text-primary uppercase tracking-wide mb-6">Key Players</h2>
                        <div className="space-y-4">
                          {preseason.keyPlayers.map((player) => {
                            const match = player.match(/^(.+?)\s*\((.+)\)$/);
                            const name = match ? match[1] : player;
                            const stat = match ? match[2] : null;
                            return (
                              <div key={player} className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
                                <span className="text-text-primary font-semibold">{name}</span>
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
                        <h2 className="font-display text-xl font-bold text-text-primary uppercase tracking-wide mb-4">BSI Outlook</h2>
                        <Badge variant="accent" className="mb-4">{getTierLabel(preseason.tier)}</Badge>
                        <p className="text-text-tertiary leading-relaxed">{preseason.outlook}</p>
                      </Card>
                    </ScrollReveal>
                  )}

                  {!hasPreseason && (
                    <ScrollReveal direction="up">
                      <Card padding="lg">
                        <h2 className="font-display text-xl font-bold text-text-primary uppercase tracking-wide mb-6">
                          Team Profile
                        </h2>
                        <div className="space-y-4">
                          <div className="flex justify-between py-2 border-b border-border-subtle">
                            <span className="text-text-muted">Conference</span>
                            <span className="text-text-primary font-semibold">{meta.conference}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-border-subtle">
                            <span className="text-text-muted">Stadium</span>
                            <span className="text-text-primary font-semibold">{meta.location.stadium}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-border-subtle">
                            <span className="text-text-muted">Location</span>
                            <span className="text-text-primary font-semibold">{meta.location.city}, {meta.location.state}</span>
                          </div>
                          {rosterPlayers.length > 0 && (
                            <div className="flex justify-between py-2 border-b border-border-subtle">
                              <span className="text-text-muted">Active Roster</span>
                              <span className="text-text-primary font-semibold">{rosterPlayers.length} players</span>
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
                            <div className="text-text-primary font-semibold">
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
                          <div className="text-text-primary font-semibold">
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
                      <h2 className="font-display text-xl font-bold text-text-primary uppercase tracking-wide mb-6">2026 Season Stats</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Batting */}
                        <div>
                          <div className="text-xs uppercase tracking-wider text-text-muted mb-4 font-semibold">Batting</div>
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <div className="font-mono text-2xl font-bold" style={{ color: accent }}>{teamStats.batting.battingAverage.toFixed(3).replace(/^0/, '')}</div>
                              <div className="text-text-muted text-xs uppercase mt-1">AVG</div>
                            </div>
                            <div>
                              <div className="font-mono text-2xl font-bold" style={{ color: accent }}>{teamStats.batting.ops?.toFixed(3).replace(/^0/, '') ?? '\u2014'}</div>
                              <div className="text-text-muted text-xs uppercase mt-1">OPS</div>
                            </div>
                            <div>
                              <div className="font-mono text-2xl font-bold text-text-primary">{teamStats.batting.homeRuns}</div>
                              <div className="text-text-muted text-xs uppercase mt-1">HR</div>
                            </div>
                            <div>
                              <div className="font-mono text-2xl font-bold text-text-primary">{teamStats.batting.rbi}</div>
                              <div className="text-text-muted text-xs uppercase mt-1">RBI</div>
                            </div>
                            <div>
                              <div className="font-mono text-lg text-text-tertiary">{teamStats.batting.runs}</div>
                              <div className="text-text-muted text-xs uppercase mt-1">Runs</div>
                            </div>
                            <div>
                              <div className="font-mono text-lg text-text-tertiary">{teamStats.batting.stolenBases ?? 0}</div>
                              <div className="text-text-muted text-xs uppercase mt-1">SB</div>
                            </div>
                            <div>
                              <div className="font-mono text-lg text-text-tertiary">{teamStats.batting.walks ?? 0}</div>
                              <div className="text-text-muted text-xs uppercase mt-1">BB</div>
                            </div>
                            <div>
                              <div className="font-mono text-lg text-text-tertiary">{teamStats.batting.players}</div>
                              <div className="text-text-muted text-xs uppercase mt-1">Batters</div>
                            </div>
                          </div>
                        </div>
                        {/* Pitching */}
                        <div>
                          <div className="text-xs uppercase tracking-wider text-text-muted mb-4 font-semibold">Pitching</div>
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <div className="font-mono text-2xl font-bold" style={{ color: accent }}>{teamStats.pitching.era.toFixed(2)}</div>
                              <div className="text-text-muted text-xs uppercase mt-1">ERA</div>
                            </div>
                            <div>
                              <div className="font-mono text-2xl font-bold" style={{ color: accent }}>{teamStats.pitching.whip.toFixed(2)}</div>
                              <div className="text-text-muted text-xs uppercase mt-1">WHIP</div>
                            </div>
                            <div>
                              <div className="font-mono text-2xl font-bold text-text-primary">{teamStats.pitching.strikeouts}</div>
                              <div className="text-text-muted text-xs uppercase mt-1">K</div>
                            </div>
                            <div>
                              <div className="font-mono text-2xl font-bold text-text-primary">{teamStats.pitching.saves ?? 0}</div>
                              <div className="text-text-muted text-xs uppercase mt-1">SV</div>
                            </div>
                            <div>
                              <div className="font-mono text-lg text-text-tertiary">{teamStats.pitching.inningsPitched}</div>
                              <div className="text-text-muted text-xs uppercase mt-1">IP</div>
                            </div>
                            <div>
                              <div className="font-mono text-lg text-text-tertiary">{teamStats.pitching.walks}</div>
                              <div className="text-text-muted text-xs uppercase mt-1">BB</div>
                            </div>
                            <div>
                              <div className="font-mono text-lg text-text-tertiary">{(teamStats.pitching.wins ?? 0)}-{(teamStats.pitching.losses ?? 0)}</div>
                              <div className="text-text-muted text-xs uppercase mt-1">W-L</div>
                            </div>
                            <div>
                              <div className="font-mono text-lg text-text-tertiary">{teamStats.pitching.pitchers}</div>
                              <div className="text-text-muted text-xs uppercase mt-1">Pitchers</div>
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
                      <h2 className="font-display text-xl font-bold text-text-primary uppercase tracking-wide mb-6">Team Leaders</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {teamLeaders.battingAvg && (
                          <div className="text-center">
                            <div className="text-text-muted text-xs uppercase tracking-wider mb-2">Batting Avg</div>
                            <div className="font-mono text-2xl font-bold" style={{ color: accent }}>{teamLeaders.battingAvg.stats?.avg?.toFixed(3)}</div>
                            <div className="text-text-primary font-semibold mt-1">{teamLeaders.battingAvg.name}</div>
                            <div className="text-text-muted text-xs">{teamLeaders.battingAvg.position}</div>
                          </div>
                        )}
                        {teamLeaders.homeRuns && (
                          <div className="text-center">
                            <div className="text-text-muted text-xs uppercase tracking-wider mb-2">Home Runs</div>
                            <div className="font-mono text-2xl font-bold" style={{ color: accent }}>{teamLeaders.homeRuns.stats?.hr}</div>
                            <div className="text-text-primary font-semibold mt-1">{teamLeaders.homeRuns.name}</div>
                            <div className="text-text-muted text-xs">{teamLeaders.homeRuns.position}</div>
                          </div>
                        )}
                        {teamLeaders.era && (
                          <div className="text-center">
                            <div className="text-text-muted text-xs uppercase tracking-wider mb-2">ERA</div>
                            <div className="font-mono text-2xl font-bold" style={{ color: accent }}>{teamLeaders.era.stats?.era?.toFixed(2)}</div>
                            <div className="text-text-primary font-semibold mt-1">{teamLeaders.era.name}</div>
                            <div className="text-text-muted text-xs">{teamLeaders.era.position}</div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </ScrollReveal>
                )}

                {/* Related Articles */}
                {teamArticles.length > 0 && (
                  <ScrollReveal direction="up" className="mt-8">
                    <Card padding="lg">
                      <h2 className="font-display text-xl font-bold text-text-primary uppercase tracking-wide mb-6">Related Articles</h2>
                      <div className="space-y-3">
                        {teamArticles.slice(0, 5).map((article) => (
                          <Link
                            key={article.slug}
                            href={`/college-baseball/editorial/${article.slug}`}
                            className="flex items-center justify-between py-3 border-b border-border-subtle last:border-0 group"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary">{article.badge}</Badge>
                                <span className="text-text-muted text-xs">{article.readTime}</span>
                              </div>
                              <div className="text-text-primary font-semibold text-sm group-hover:text-burnt-orange transition-colors truncate">
                                {article.title}
                              </div>
                              <div className="text-text-muted text-xs mt-0.5">{article.date}</div>
                            </div>
                            <svg className="w-4 h-4 text-text-muted group-hover:text-burnt-orange group-hover:translate-x-0.5 transition-all shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        ))}
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
                          <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wider">
                            <th className="text-left px-4 py-3">Date</th>
                            <th className="text-left px-4 py-3">Opponent</th>
                            <th className="text-center px-4 py-3">Result</th>
                            <th className="text-center px-4 py-3">Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scheduleGames.map((g) => (
                            <tr key={g.id} className="border-b border-border-subtle hover:bg-surface-light transition-colors">
                              <td className="px-4 py-3 text-text-tertiary whitespace-nowrap">{formatDate(g.date)}</td>
                              <td className="px-4 py-3 text-text-primary font-semibold">{g.isHome ? 'vs' : '@'} {g.opponent.name}</td>
                              <td className="px-4 py-3 text-center">
                                {g.result === 'W' && <span className="text-success font-bold">W</span>}
                                {g.result === 'L' && <span className="text-error font-bold">L</span>}
                                {!g.result && g.status === 'in' && <span style={{ color: accent }} className="font-bold">LIVE</span>}
                                {!g.result && g.status === 'pre' && <span className="text-text-muted">{g.detail || '\u2014'}</span>}
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-text-secondary">
                                {g.score ? `${g.score.team}-${g.score.opponent}` : '\u2014'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-4 py-3 border-t border-border-subtle text-xs text-text-muted">
                      {scheduleGames.length} games &mdash; Source: ESPN
                    </div>
                  </Card>
                ) : (
                  <Card padding="lg" className="text-center">
                    <p className="text-text-tertiary">Schedule loading...</p>
                  </Card>
                )}
              </ScrollReveal>
            )}

            {/* ── Roster ──────────────────────────────────────────────────── */}
            {activeTab === 'roster' && (
              <div className="space-y-8">
                {/* Pitching Depth Chart */}
                {positionGroups.some(g => g.group === 'Rotation') && (
                  <ScrollReveal direction="up">
                    <Card padding="lg">
                      <h2 className="font-display text-xl font-bold text-text-primary uppercase tracking-wide mb-6">Pitching Depth Chart</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Rotation */}
                        <div>
                          <div className="text-xs uppercase tracking-wider text-text-muted mb-3 font-semibold">Weekend Rotation</div>
                          <div className="space-y-2">
                            {positionGroups.find(g => g.group === 'Rotation')?.players.slice(0, 4).map((p, i) => (
                              <div key={p.id || p.name} className="flex items-center justify-between p-3 rounded-lg bg-surface-light border border-border-subtle">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="font-mono text-xs text-text-muted w-5">{['FRI', 'SAT', 'SUN', 'MID'][i]}</span>
                                  <div className="min-w-0">
                                    <div className="text-text-primary font-semibold text-sm truncate">
                                      {p.id ? <Link href={`/college-baseball/players/${p.id}`} className="hover:underline">{p.name}</Link> : p.name}
                                    </div>
                                    <div className="text-text-muted text-xs">{p.position}</div>
                                  </div>
                                </div>
                                <div className="flex gap-3 sm:gap-4 text-xs font-mono shrink-0">
                                  <div className="text-center">
                                    <div style={{ color: accent }} className="font-bold">{p.stats?.era?.toFixed(2) ?? '\u2014'}</div>
                                    <div className="text-text-muted">ERA</div>
                                  </div>
                                  <div className="text-center hidden sm:block">
                                    <div className="text-text-secondary">{p.stats?.whip?.toFixed(2) ?? '\u2014'}</div>
                                    <div className="text-text-muted">WHIP</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-text-secondary">{p.stats?.w ?? 0}-{p.stats?.l ?? 0}</div>
                                    <div className="text-text-muted">W-L</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-text-secondary">{p.stats?.ip ?? 0}</div>
                                    <div className="text-text-muted">IP</div>
                                  </div>
                                  <div className="text-center hidden sm:block">
                                    <div className="text-text-secondary">{p.stats?.so ?? 0}</div>
                                    <div className="text-text-muted">K</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Bullpen */}
                        {positionGroups.some(g => g.group === 'Bullpen') && (
                          <div>
                            <div className="text-xs uppercase tracking-wider text-text-muted mb-3 font-semibold">Bullpen</div>
                            <div className="space-y-2">
                              {positionGroups.find(g => g.group === 'Bullpen')?.players.map((p) => (
                                <div key={p.id || p.name} className="flex items-center justify-between p-3 rounded-lg bg-surface-light border border-border-subtle">
                                  <div className="min-w-0">
                                    <div className="text-text-primary font-semibold text-sm truncate">
                                      {p.id ? <Link href={`/college-baseball/players/${p.id}`} className="hover:underline">{p.name}</Link> : p.name}
                                    </div>
                                    <div className="text-text-muted text-xs">{p.position}{(p.stats?.sv ?? 0) > 0 ? ' \u00b7 Closer' : ''}</div>
                                  </div>
                                  <div className="flex gap-4 text-xs font-mono shrink-0">
                                    <div className="text-center">
                                      <div style={{ color: accent }} className="font-bold">{p.stats?.era?.toFixed(2) ?? '\u2014'}</div>
                                      <div className="text-text-muted">ERA</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-text-secondary">{p.stats?.ip ?? 0}</div>
                                      <div className="text-text-muted">IP</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-text-secondary">{p.stats?.sv ?? 0}</div>
                                      <div className="text-text-muted">SV</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </ScrollReveal>
                )}

                {/* Position-Grouped Roster Tables */}
                {rosterPlayers.length > 0 ? (
                  positionGroups.map(({ group, players: groupPlayers }) => {
                    const isPitcherGroup = group === 'Rotation' || group === 'Bullpen';
                    return (
                      <ScrollReveal key={group} direction="up">
                        <Card padding="none" className="overflow-hidden">
                          <div className="px-4 py-3 border-b border-border" style={{ backgroundColor: `${accent}0D` }}>
                            <h3 className="font-display text-sm font-bold uppercase tracking-wider" style={{ color: accent }}>{group}</h3>
                            <span className="text-text-muted text-xs">{groupPlayers.length} player{groupPlayers.length !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wider">
                                  <th className="text-left px-4 py-2 sticky left-0 bg-charcoal">Player</th>
                                  <th className="text-left px-3 py-2">Pos</th>
                                  {isPitcherGroup ? (
                                    <>
                                      <th className="text-right px-3 py-2">ERA</th>
                                      <th className="text-right px-3 py-2">WHIP</th>
                                      <th className="text-right px-3 py-2">W-L</th>
                                      <th className="text-right px-3 py-2">SV</th>
                                      <th className="text-right px-3 py-2">IP</th>
                                      <th className="text-right px-3 py-2">K</th>
                                      <th className="text-right px-3 py-2">BB</th>
                                      <th className="text-right px-3 py-2 hidden md:table-cell">H</th>
                                      <th className="text-right px-3 py-2 hidden md:table-cell">ER</th>
                                      <th className="text-right px-3 py-2 hidden lg:table-cell">HR</th>
                                    </>
                                  ) : (
                                    <>
                                      <th className="text-right px-3 py-2">AVG</th>
                                      <th className="text-right px-3 py-2">OPS</th>
                                      <th className="text-right px-3 py-2">HR</th>
                                      <th className="text-right px-3 py-2">RBI</th>
                                      <th className="text-right px-3 py-2">R</th>
                                      <th className="text-right px-3 py-2 hidden md:table-cell">H</th>
                                      <th className="text-right px-3 py-2 hidden md:table-cell">2B</th>
                                      <th className="text-right px-3 py-2 hidden md:table-cell">BB</th>
                                      <th className="text-right px-3 py-2 hidden lg:table-cell">SB</th>
                                      <th className="text-right px-3 py-2 hidden lg:table-cell">K</th>
                                    </>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {groupPlayers.map((p) => (
                                  <tr key={p.id || p.name} className="border-b border-border-subtle hover:bg-surface-light transition-colors">
                                    <td className="px-4 py-2.5 text-text-primary font-semibold sticky left-0 bg-charcoal whitespace-nowrap">
                                      {p.id ? <Link href={`/college-baseball/players/${p.id}`} className="hover:underline">{p.name}</Link> : p.name}
                                    </td>
                                    <td className="px-3 py-2.5 text-text-tertiary text-xs">{p.position}</td>
                                    {isPitcherGroup ? (
                                      <>
                                        <td className="px-3 py-2.5 text-right font-mono" style={{ color: accent }}>{p.stats?.era?.toFixed(2) ?? '\u2014'}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-text-secondary">{p.stats?.whip?.toFixed(2) ?? '\u2014'}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-text-secondary">{p.stats?.w ?? 0}-{p.stats?.l ?? 0}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-text-secondary">{p.stats?.sv ?? 0}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-text-secondary">{p.stats?.ip ?? 0}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-text-secondary">{p.stats?.so ?? 0}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-text-tertiary">{p.stats?.pitchBB ?? 0}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-text-tertiary hidden md:table-cell">{p.stats?.ha ?? 0}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-text-tertiary hidden md:table-cell">{p.stats?.er ?? 0}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-text-tertiary hidden lg:table-cell">{p.stats?.hra ?? 0}</td>
                                      </>
                                    ) : (
                                      <>
                                        <td className="px-3 py-2.5 text-right font-mono" style={{ color: accent }}>{p.stats?.avg?.toFixed(3).replace(/^0/, '') ?? '\u2014'}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-text-secondary">{p.stats?.ops?.toFixed(3).replace(/^0/, '') ?? '\u2014'}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-text-secondary">{p.stats?.hr ?? 0}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-text-secondary">{p.stats?.rbi ?? 0}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-text-secondary">{p.stats?.r ?? 0}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-text-tertiary hidden md:table-cell">{p.stats?.h ?? 0}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-text-tertiary hidden md:table-cell">{p.stats?.doubles ?? 0}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-text-tertiary hidden md:table-cell">{p.stats?.bb ?? 0}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-text-tertiary hidden lg:table-cell">{p.stats?.sb ?? 0}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-text-tertiary hidden lg:table-cell">{p.stats?.k ?? 0}</td>
                                      </>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </Card>
                      </ScrollReveal>
                    );
                  })
                ) : (
                  <Card padding="lg" className="text-center">
                    <p className="text-text-tertiary">Roster loading...</p>
                  </Card>
                )}

                <div className="text-xs text-text-muted text-center mt-4">
                  {rosterPlayers.length} players &middot; Stats from D1 box scores &mdash; Source: ESPN / Highlightly
                </div>
              </div>
            )}

            {/* ── Advanced Stats ──────────────────────────────────────────── */}
            {activeTab === 'advanced' && (
              <SabermetricsPanel teamId={teamId} espnId={meta?.espnId} accent={accent} />
            )}

            {/* Attribution */}
            <div className="mt-12 pt-6 border-t border-border-subtle text-center">
              <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
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
