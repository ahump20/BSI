'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSportData } from '@/lib/hooks/useSportData';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';

import { Skeleton, SkeletonTableRow, SkeletonScoreCard } from '@/components/ui/Skeleton';
import { TabBar, TabPanel } from '@/components/ui/TabBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { GameScoreCard } from '@/components/sports/GameScoreCard';
import { SportInfoCard } from '@/components/sports/SportInfoCard';
import { formatTimestamp } from '@/lib/utils/timezone';
import { SportHero } from '@/components/sports/SportHero';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface RankedTeam {
  rank: number;
  team: string;
  conference: string;
  record?: string;
  previousRank?: number;
}

interface PortalEntry {
  name: string;
  position: string;
  fromSchool: string;
  toSchool?: string;
  rating?: number;
  status?: string;
}

interface CFBGame {
  id: string | number;
  status: string;
  isLive: boolean;
  isFinal: boolean;
  detail?: string;
  away: { name: string; score: number };
  home: { name: string; score: number };
  venue?: string;
}

function normalizeCFBGame(raw: Record<string, unknown>, fallbackIndex: number): CFBGame {
  const statusRaw = raw.status as Record<string, unknown> | string | undefined;
  const statusType = typeof statusRaw === 'object'
    ? statusRaw?.type as Record<string, unknown> | undefined
    : undefined;
  const teams = (raw.teams as Record<string, unknown>[] | undefined) || [];
  const homeEntry = teams.find((team) => team.homeAway === 'home');
  const awayEntry = teams.find((team) => team.homeAway === 'away');
  const existingHome = raw.home as Record<string, unknown> | undefined;
  const existingAway = raw.away as Record<string, unknown> | undefined;
  const homeTeam = existingHome || (homeEntry?.team as Record<string, unknown>) || homeEntry || {};
  const awayTeam = existingAway || (awayEntry?.team as Record<string, unknown>) || awayEntry || {};

  const status =
    typeof statusRaw === 'object'
      ? (statusRaw.detailedState as string) ||
        (statusType?.description as string) ||
        (statusType?.detail as string) ||
        (statusType?.shortDetail as string) ||
        'Scheduled'
      : (statusRaw as string) || 'Scheduled';

  const state = statusType?.state as string | undefined;
  const isLive = state === 'in' || /live|in progress/i.test(status);
  const isFinal = state === 'post' || statusType?.completed === true || /final/i.test(status);

  return {
    id: (raw.id as string | number) || fallbackIndex,
    status,
    isLive,
    isFinal,
    detail: typeof statusRaw === 'object'
      ? (statusType?.detail as string) || (statusType?.shortDetail as string) || undefined
      : undefined,
    away: {
      name: (awayTeam.displayName as string) || (awayTeam.shortDisplayName as string) || (awayTeam.name as string) || 'Away',
      score: Number((existingAway?.score ?? awayEntry?.score ?? 0)),
    },
    home: {
      name: (homeTeam.displayName as string) || (homeTeam.shortDisplayName as string) || (homeTeam.name as string) || 'Home',
      score: Number((existingHome?.score ?? homeEntry?.score ?? 0)),
    },
    venue:
      ((raw.venue as Record<string, unknown> | undefined)?.fullName as string) ||
      ((raw.venue as Record<string, unknown> | undefined)?.name as string) ||
      undefined,
  };
}

interface StandingsTeam {
  teamName: string;
  name?: string;
  wins: number;
  losses: number;
  conferenceWins?: number;
  conferenceLosses?: number;
  conference?: string;
}

type TabType = 'rankings' | 'conferences' | 'portal';

const TRACKING_BULLETS = [
  { bold: 'Catapult GPS', text: '— dominant across SEC and Power 4. Real-time workload, sprint distance, and collision load for every practice and game.' },
  { bold: 'Hudl IQ:', text: 'CV-based tracking from All-22 coaching film — extracting positional data without dedicated camera arrays.' },
  { bold: 'SkillCorner:', text: 'broadcast-feed tracking for speed, separation, and get-off time across televised games.' },
  { bold: 'Sportlogiq', text: '(acquired by Teamworks Jan 2026) — formation recognition and route classification at scale.' },
];

const cfbFeatures = [
  {
    href: '/cfb/scores',
    title: 'Live Scores',
    description: 'Real-time scores and game updates for all 134 FBS teams. Box scores, drive charts, and game flow.',
    badge: 'Live Now',
    badgeVariant: 'success' as const,
  },
  {
    href: '/cfb/standings',
    title: 'Conference Standings',
    description: 'Complete standings for SEC, Big Ten, Big 12, ACC, and all FBS conferences with records and tiebreakers.',
    badge: 'Updated Weekly',
    badgeVariant: 'primary' as const,
  },
  {
    href: '/cfb/transfer-portal',
    title: 'Transfer Portal',
    description: 'Real-time portal entries, commitments, decommitments, and recruiting intel across all FBS programs.',
    badge: 'Live',
    badgeVariant: 'success' as const,
  },
  {
    href: '/cfb/teams',
    title: 'Team Profiles',
    description: 'Rosters, schedules, and statistics for all 134 FBS teams across every conference.',
    badge: '134 Teams',
    badgeVariant: 'warning' as const,
  },
];

const conferences = [
  { name: 'SEC', teams: 16, description: 'Southeastern Conference' },
  { name: 'Big Ten', teams: 18, description: 'Big Ten Conference' },
  { name: 'Big 12', teams: 16, description: 'Big 12 Conference' },
  { name: 'ACC', teams: 17, description: 'Atlantic Coast Conference' },
  { name: 'Pac-12', teams: 4, description: 'Pacific-12 Conference' },
  { name: 'Mountain West', teams: 12, description: 'Mountain West Conference' },
  { name: 'AAC', teams: 14, description: 'American Athletic Conference' },
  { name: 'Sun Belt', teams: 14, description: 'Sun Belt Conference' },
];
export default function CFBPage() {
  const [activeTab, setActiveTab] = useState<TabType>('rankings');

  // Rankings data — fetched only when rankings tab is active
  const { data: teamsRaw, loading, error, retry: retryRankings, lastUpdated: rankingsUpdated } = useSportData<{
    teams?: Array<{
      school?: string;
      name?: string;
      conference?: string;
      apRank?: number | null;
      coachesRank?: number | null;
    }>;
    meta?: { lastUpdated?: string };
  }>('/api/cfb/teams', { skip: activeTab !== 'rankings' });

  const rankings: RankedTeam[] = useMemo(() => {
    if (!teamsRaw?.teams) return [];
    return teamsRaw.teams
      .filter((team) => {
        const ap = team.apRank ?? 0;
        const coaches = team.coachesRank ?? 0;
        return ap > 0 || coaches > 0;
      })
      .sort((a, b) => {
        const aRank = a.apRank && a.apRank > 0 ? a.apRank : (a.coachesRank || 999);
        const bRank = b.apRank && b.apRank > 0 ? b.apRank : (b.coachesRank || 999);
        return aRank - bRank;
      })
      .slice(0, 25)
      .map((team, idx) => ({
        rank: team.apRank && team.apRank > 0 ? team.apRank : idx + 1,
        team: team.school || team.name || 'Unknown Team',
        conference: team.conference || 'Independent',
      }));
  }, [teamsRaw]);

  const lastUpdated = rankingsUpdated ? rankingsUpdated.toISOString() : '';

  // Portal data — fetched only when portal tab is active
  const { data: portalRaw, loading: portalLoading, error: portalError } = useSportData<{
    entries?: PortalEntry[];
    players?: PortalEntry[];
  }>('/api/cfb/transfer-portal', { skip: activeTab !== 'portal' });

  const portalEntries: PortalEntry[] = useMemo(() => {
    return portalRaw?.entries || portalRaw?.players || [];
  }, [portalRaw]);

  // Recent scores — always fetched on mount for the preview strip
  const { data: scoresRaw, loading: scoresLoading } = useSportData<{
    games?: CFBGame[];
    scores?: Array<{
      id?: string | number;
      homeTeam?: string; awayTeam?: string;
      homeScore?: number; awayScore?: number;
      status?: string; state?: string;
      venue?: string;
    }>;
    live?: boolean;
    meta?: { lastUpdated?: string; dataSource?: string };
  }>('/api/cfb/scores');

  const recentGames: CFBGame[] = useMemo(() => {
    if (scoresRaw?.games?.length) {
      return scoresRaw.games
        .map((game, index) => normalizeCFBGame(game as unknown as Record<string, unknown>, index))
        .slice(0, 6);
    }

    return (scoresRaw?.scores || []).map((score, idx) => ({
      id: score.id || `cfb-game-${idx}`,
      status: score.status || score.state || 'Final',
      isLive: (score.status || score.state || '').toLowerCase().includes('live') || (score.status || score.state || '').toLowerCase().includes('in progress'),
      isFinal: (score.status || score.state || '').toLowerCase().includes('final'),
      away: { name: score.awayTeam || 'Away', score: score.awayScore || 0 },
      home: { name: score.homeTeam || 'Home', score: score.homeScore || 0 },
      venue: score.venue,
    })).slice(0, 6);
  }, [scoresRaw]);
  const hasLiveGames = scoresRaw?.live || recentGames.some((g) => g.isLive);

  // Conference standings snapshot — always fetched on mount
  const { data: standingsRaw, loading: standingsLoading } = useSportData<{
    standings?: StandingsTeam[];
    teams?: StandingsTeam[];
    conferences?: Array<{ name: string; teams: StandingsTeam[] }>;
    meta?: { lastUpdated?: string; dataSource?: string };
  }>('/api/cfb/standings');

  // Extract and group standings by top conferences
  const standingsSnapshot = (() => {
    const targetConfs = ['SEC', 'Big Ten', 'Big 12', 'ACC'];
    const allTeams: StandingsTeam[] = [];

    // Handle different response shapes — the API may return:
    // 1. { conferences: [{ name, teams }] }
    // 2. { standings: [{ name, teams }] } — nested conference groups
    // 3. { standings: [flat team objects] } or { teams: [flat team objects] }
    const confs = standingsRaw?.conferences || standingsRaw?.standings || [];
    const isNested = Array.isArray(confs) && confs.length > 0 && 'teams' in (confs[0] as Record<string, unknown>);

    if (isNested) {
      for (const conf of confs as Array<{ name: string; teams: StandingsTeam[] }>) {
        for (const team of conf.teams || []) {
          allTeams.push({ ...team, conference: team.conference || conf.name });
        }
      }
    } else {
      allTeams.push(...(standingsRaw?.teams || (confs as StandingsTeam[]) || []));
    }

    const grouped: Record<string, StandingsTeam[]> = {};
    for (const conf of targetConfs) {
      const confTeams = allTeams
        .filter((t) => (t.conference || '').toLowerCase() === conf.toLowerCase())
        .sort((a, b) => b.wins - a.wins || a.losses - b.losses)
        .slice(0, 4);
      if (confTeams.length > 0) grouped[conf] = confTeams;
    }
    return grouped;
  })();
  const hasStandings = Object.keys(standingsSnapshot).length > 0;

  const tabs: { id: TabType; label: string }[] = [
    { id: 'rankings', label: 'Rankings' },
    { id: 'conferences', label: 'Conferences' },
    { id: 'portal', label: 'Transfer Portal' },
  ];

  return (
    <ErrorBoundary>
    <div className="bsi-theme-football">
      <>
        <div>
        <SportHero
          sport="College Football"
          leagueName="NCAA Division I FBS"
          tagline="A Wednesday night game between Rice and Sam Houston covered with the same rigor as Saturday in Tuscaloosa."
          description="College football's national narrative runs through about twelve programs. The other 122 have fans, rivalries, and players worth knowing — they just don't have coverage to match."
          dataSource="SportsDataIO"
          primaryCta={{ label: 'Live Scores', href: '/cfb/scores' }}
          secondaryCta={{ label: 'Transfer Portal', href: '/cfb/transfer-portal' }}
          heroBg={{ bucket: 'images', imagePath: 'hero-cfb.webp', opacity: 0.18 }}
        />

        {/* Recent Scores Preview */}
        <Section padding="md" background="charcoal" borderTop>
          <Container>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {hasLiveGames && <span className="w-2 h-2 bg-success rounded-full animate-pulse" />}
                <h2 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wide text-text-primary">
                  {hasLiveGames ? 'Live' : 'Recent'} <span className="text-burnt-orange">Scores</span>
                </h2>
              </div>
              <Link href="/cfb/scores">
                <Button variant="ghost" size="sm">All Scores &rarr;</Button>
              </Link>
            </div>
            {scoresLoading ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonScoreCard key={i} />)}
              </div>
            ) : recentGames.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {recentGames.map((game) => (
                  <GameScoreCard
                    key={game.id}
                    game={{
                      id: game.id,
                      away: game.away,
                      home: game.home,
                      status: game.status,
                      isLive: game.isLive,
                      isFinal: game.isFinal,
                      detail: game.detail,
                      venue: game.venue,
                    }}
                  />
                ))}
              </div>
            ) : (
              <Card variant="default" padding="lg">
                <div className="text-center py-6">
                  <p className="text-text-tertiary">No recent games available. Check back during the season for live scores and results.</p>
                </div>
              </Card>
            )}
            {scoresRaw?.meta && (
              <div className="mt-4 pt-3 border-t border-border-subtle">
                <DataSourceBadge source={scoresRaw.meta.dataSource || 'SportsDataIO'} timestamp={formatTimestamp(scoresRaw.meta.lastUpdated)} />
              </div>
            )}
          </Container>
        </Section>

        {/* Conference Standings Snapshot */}
        <Section padding="md" background="midnight" borderTop>
          <Container>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wide text-text-primary">
                Conference <span className="text-burnt-orange">Standings</span>
              </h2>
              <Link href="/cfb/standings">
                <Button variant="ghost" size="sm">Full Standings &rarr;</Button>
              </Link>
            </div>
            {standingsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} variant="default" padding="md">
                    <Skeleton variant="text" width={120} height={20} />
                    <div className="mt-3"><table className="w-full"><tbody>{Array.from({ length: 4 }).map((_, j) => <SkeletonTableRow key={j} columns={3} />)}</tbody></table></div>
                  </Card>
                ))}
              </div>
            ) : hasStandings ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(standingsSnapshot).map(([conf, teams]) => (
                  <ScrollReveal key={conf}>
                    <Card variant="default" padding="md">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-burnt-orange">{conf}</h3>
                        <Link href={`/cfb/standings?conference=${conf.toLowerCase().replace(/\s+/g, '-')}`} className="text-xs text-text-muted hover:text-burnt-orange transition-colors">
                          Full &rarr;
                        </Link>
                      </div>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border-subtle">
                            <th className="text-left pb-2 text-text-muted font-semibold text-[11px] uppercase tracking-wider">Team</th>
                            <th className="text-center pb-2 text-text-muted font-semibold text-[11px] uppercase tracking-wider w-12">W</th>
                            <th className="text-center pb-2 text-text-muted font-semibold text-[11px] uppercase tracking-wider w-12">L</th>
                            {teams[0]?.conferenceWins != null && (
                              <th className="text-center pb-2 text-text-muted font-semibold text-[11px] uppercase tracking-wider w-16">Conf</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {teams.map((team, idx) => (
                            <tr key={team.teamName || team.name} className="border-b border-border-subtle/50 last:border-0">
                              <td className="py-2 text-sm">
                                <span className="text-burnt-orange font-bold mr-2 text-xs">{idx + 1}</span>
                                <span className="font-semibold text-text-primary">{team.teamName || team.name}</span>
                              </td>
                              <td className="py-2 text-center text-sm text-text-secondary">{team.wins}</td>
                              <td className="py-2 text-center text-sm text-text-secondary">{team.losses}</td>
                              {team.conferenceWins != null && (
                                <td className="py-2 text-center text-sm text-text-tertiary">{team.conferenceWins}-{team.conferenceLosses}</td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <Card variant="default" padding="lg">
                <div className="text-center py-6">
                  <p className="text-text-tertiary">Conference standings will populate once the season begins. Browse conferences below for team rosters and schedules.</p>
                </div>
              </Card>
            )}
            {standingsRaw?.meta && (
              <div className="mt-4 pt-3 border-t border-border-subtle">
                <DataSourceBadge source={standingsRaw.meta.dataSource || 'SportsDataIO'} timestamp={formatTimestamp(standingsRaw.meta.lastUpdated)} />
              </div>
            )}
          </Container>
        </Section>

        {/* This Week in CFB — Editorial Content Cards */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal>
              <div className="text-center mb-8">
                <span className="text-[11px] font-mono uppercase tracking-widest text-burnt-orange">The Pulse</span>
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mt-2 text-text-primary">
                  This Week in <span className="text-gradient-blaze">CFB</span>
                </h2>
                <p className="text-text-secondary mt-3 max-w-xl mx-auto text-sm">
                  The storylines shaping the season — portal movement, rivalry matchups, and the 12-team playoff picture.
                </p>
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <ScrollReveal delay={0}>
                <Link href="/cfb/transfer-portal" className="block group">
                  <Card variant="hover" padding="lg" className="h-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-burnt-orange to-ember opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-10 h-10 mb-4 bg-burnt-orange/15 rounded-sm flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-burnt-orange fill-none stroke-[1.5]">
                        <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-text-primary mb-2 group-hover:text-burnt-orange transition-colors">Transfer Portal</h3>
                    <p className="text-text-tertiary text-sm leading-relaxed">
                      The portal never stops. Track who entered, who committed, and which programs are winning the offseason arms race.
                    </p>
                    <Badge variant="success" className="mt-3">Live Tracking</Badge>
                  </Card>
                </Link>
              </ScrollReveal>
              <ScrollReveal delay={100}>
                <Link href="/cfb/scores" className="block group">
                  <Card variant="hover" padding="lg" className="h-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-burnt-orange to-ember opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-10 h-10 mb-4 bg-burnt-orange/15 rounded-sm flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-burnt-orange fill-none stroke-[1.5]">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-text-primary mb-2 group-hover:text-burnt-orange transition-colors">Rivalry Watch</h3>
                    <p className="text-text-tertiary text-sm leading-relaxed">
                      The matchups that define the sport. Iron Bowl, Red River, The Game — every rivalry result and storyline.
                    </p>
                    <Badge variant="primary" className="mt-3">In-Season</Badge>
                  </Card>
                </Link>
              </ScrollReveal>
              <ScrollReveal delay={200}>
                <Link href="/cfb/standings" className="block group">
                  <Card variant="hover" padding="lg" className="h-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-burnt-orange to-ember opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-10 h-10 mb-4 bg-burnt-orange/15 rounded-sm flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-burnt-orange fill-none stroke-[1.5]">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="3" y1="9" x2="21" y2="9" />
                        <line x1="9" y1="21" x2="9" y2="9" />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-text-primary mb-2 group-hover:text-burnt-orange transition-colors">Playoff Picture</h3>
                    <p className="text-text-tertiary text-sm leading-relaxed">
                      12 teams, 4 byes, 2 new conferences in the mix. Who is in, who is on the bubble, and who controls their destiny.
                    </p>
                    <Badge variant="warning" className="mt-3">12-Team Playoff</Badge>
                  </Card>
                </Link>
              </ScrollReveal>
              <ScrollReveal delay={300}>
                <Link href="/cfb/teams" className="block group">
                  <Card variant="hover" padding="lg" className="h-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-burnt-orange to-ember opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-10 h-10 mb-4 bg-burnt-orange/15 rounded-sm flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-burnt-orange fill-none stroke-[1.5]">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-text-primary mb-2 group-hover:text-burnt-orange transition-colors">Conference Power</h3>
                    <p className="text-text-tertiary text-sm leading-relaxed">
                      SEC vs. Big Ten is the headliner, but the Big 12 and ACC are deeper than the narratives suggest. Data tells the story.
                    </p>
                    <Badge variant="primary" className="mt-3">All 10 Conferences</Badge>
                  </Card>
                </Link>
              </ScrollReveal>
            </div>
          </Container>
        </Section>

        {/* Tabs and Content */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <TabBar tabs={tabs} active={activeTab} onChange={(id) => setActiveTab(id as TabType)} size="sm" />
            {/* Secondary nav — editorial monospace strip */}
            <div className="flex gap-1 mb-8 overflow-x-auto pb-1 scrollbar-hide">
              {[
                { label: 'Scores', href: '/cfb/scores' },
                { label: 'Standings', href: '/cfb/standings' },
                { label: 'Portal', href: '/cfb/transfer-portal' },
                { label: 'Teams', href: '/cfb/teams' },
                { label: 'Players', href: '/cfb/players' },
                { label: 'Schedule', href: '/cfb/schedule' },
              ].map((link, i) => (
                <Link key={link.href} href={link.href}
                  className={`px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-text-muted hover:text-burnt-orange transition-colors whitespace-nowrap ${
                    i === 0 ? 'border-l-2 border-burnt-orange/40 pl-3' : ''
                  }`}>
                  {link.label}
                </Link>
              ))}
            </div>

            <DataErrorBoundary>
            {/* Rankings Tab */}
            <TabPanel id="rankings" activeTab={activeTab}>
                {loading ? (
                  <Card variant="default" padding="lg">
                    <CardHeader><Skeleton variant="text" width={200} height={24} /></CardHeader>
                    <CardContent>
                      <table className="w-full"><tbody>{Array.from({ length: 25 }).map((_, i) => <SkeletonTableRow key={i} columns={4} />)}</tbody></table>
                    </CardContent>
                  </Card>
                ) : (
                  <ScrollReveal>
                    <Card variant="default" padding="lg">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Image src="/icons/football.svg" alt="" width={20} height={20} className="opacity-60" aria-hidden="true" />
                            AP Top 25 Rankings
                          </div>
                          <Badge variant="primary">2025-26 Season</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b-2 border-burnt-orange">
                                {['Rank', 'Team', 'Conference', 'Record'].map((h) => (
                                  <th key={h} className="text-left p-3 text-text-muted font-semibold text-xs">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {rankings.map((team) => (
                                <tr key={team.rank} className="border-b border-border-subtle hover:bg-surface-dugout transition-colors">
                                  <td className="p-3 text-burnt-orange font-bold text-lg">{team.rank}</td>
                                  <td className="p-3 font-semibold text-text-primary">{team.team}</td>
                                  <td className="p-3 text-text-secondary">{team.conference}</td>
                                  <td className="p-3 text-text-secondary">{team.record || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {rankings.length === 0 && error && (
                          <div className="text-center py-8">
                            <p className="text-text-secondary mb-4">{error}</p>
                            <Button variant="primary" size="sm" onClick={retryRankings}>Retry</Button>
                          </div>
                        )}
                        <div className="mt-4 pt-4 border-t border-border-vintage">
                          <DataSourceBadge source="SportsDataIO (Derived Rankings)" timestamp={formatTimestamp(lastUpdated)} />
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                )}
            </TabPanel>

            {/* Conferences Tab */}
            <TabPanel id="conferences" activeTab={activeTab}>
              <ScrollReveal>
                <p className="text-text-secondary text-sm mb-6 max-w-2xl">
                  The 2025-26 FBS landscape: four Power conferences, the rebuilt Pac-12, and five Group of 5 leagues. 134 programs, 10 conferences, all tracked.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {conferences.map((conf) => (
                    <Link key={conf.name} href={`/cfb/standings?conference=${conf.name.toLowerCase().replace(/\s+/g, '-')}`}>
                      <Card variant="hover" padding="lg" className="text-center h-full group">
                        <div className="font-display text-lg font-bold uppercase tracking-wide text-text-primary group-hover:text-burnt-orange transition-colors">{conf.name}</div>
                        <div className="text-sm text-text-muted mt-1">{conf.description}</div>
                        <div className="text-xs text-burnt-orange mt-3 font-semibold">{conf.teams} Teams</div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </ScrollReveal>
            </TabPanel>

            {/* Transfer Portal Tab */}
            <TabPanel id="portal" activeTab={activeTab}>
              <Card variant="default" padding="lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Transfer Portal</span>
                    <Link href="/cfb/transfer-portal">
                      <Button variant="secondary" size="sm">Full Portal</Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {portalLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="h-10 skeleton" />
                      ))}
                    </div>
                  ) : portalError ? (
                    <div className="text-center py-8">
                      <p className="text-text-secondary mb-4">Unable to load transfer portal data.</p>
                      <Link href="/cfb/transfer-portal">
                        <Button variant="primary">View Transfer Portal Page</Button>
                      </Link>
                    </div>
                  ) : portalEntries.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-text-secondary mb-4">No transfer portal entries available yet.</p>
                      <Link href="/cfb/transfer-portal">
                        <Button variant="primary">View Transfer Portal</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-burnt-orange">
                            {['Player', 'Pos', 'From', 'To', 'Status'].map((h) => (
                              <th key={h} className="text-left p-3 text-text-muted font-semibold text-xs">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {portalEntries.slice(0, 25).map((entry, i) => (
                            <tr key={`${entry.name}-${i}`} className="border-b border-border-subtle hover:bg-surface-dugout transition-colors">
                              <td className="p-3 font-semibold text-text-primary">{entry.name}</td>
                              <td className="p-3 text-text-secondary">{entry.position}</td>
                              <td className="p-3 text-text-secondary">{entry.fromSchool}</td>
                              <td className="p-3 text-text-secondary">{entry.toSchool || 'Undecided'}</td>
                              <td className="p-3">
                                <Badge variant={entry.toSchool ? 'success' : 'warning'}>
                                  {entry.status || (entry.toSchool ? 'Committed' : 'In Portal')}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabPanel>
            </DataErrorBoundary>

          </Container>
        </Section>
        {/* Feature Cards — Data Hub */}
        <Section padding="lg" background="midnight" borderTop>
          <Container>
            <ScrollReveal>
              <div className="text-center mb-12">
                <span className="kicker">All 134 FBS Programs</span>
                <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display mt-2">
                  The Data You <span className="text-gradient-blaze">Actually Need</span>
                </h2>
                <p className="text-text-secondary mt-4 max-w-2xl mx-auto">
                  Scores, standings, portal intel, and team profiles — straight from the source, no middleman.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {cfbFeatures.map((feature, index) => (
                <ScrollReveal key={feature.title} delay={index * 100}>
                  <Link href={feature.href} className="block group">
                    <Card variant="hover" padding="lg" className="h-full relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-burnt-orange to-ember opacity-0 group-hover:opacity-100 transition-opacity" />
                      <h3 className="text-lg font-semibold text-text-primary mb-3">{feature.title}</h3>
                      <p className="text-text-tertiary text-sm leading-relaxed mb-4">
                        {feature.description}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                        <Badge variant={feature.badgeVariant}>{feature.badge}</Badge>
                        <span className="text-burnt-orange text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                          View
                          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </Card>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* Film & Tracking Technology */}
        <Section padding="lg" background="midnight" borderTop>
          <Container>
            <SportInfoCard
              icon={
                <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-burnt-orange fill-none stroke-[1.5]">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              }
              title="Film &amp; Tracking Technology"
              subtitle="How college football uses tracking data"
              bullets={TRACKING_BULLETS}
              actions={[
                { label: 'Full Vision AI Landscape \u2192', href: '/vision-ai', variant: 'ghost' },
              ]}
            />
          </Container>
        </Section>
        </div>
      </>
    </div>
    </ErrorBoundary>
  );
}
