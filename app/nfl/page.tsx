'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSportData } from '@/lib/hooks/useSportData';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge, FreshnessBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { Skeleton, SkeletonTableRow, SkeletonScoreCard } from '@/components/ui/Skeleton';
import { TabBar, TabPanel } from '@/components/ui/TabBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { SportHero } from '@/components/sports/SportHero';
import { GameScoreCard } from '@/components/sports/GameScoreCard';
import { SportInfoCard } from '@/components/sports/SportInfoCard';
import { formatTimestamp } from '@/lib/utils/timezone';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import {
  type NFLApiConference,
  type NFLStandingsTeam,
  flattenNFLStandings,
  groupNFLByDivision,
  NFL_DIVISION_ORDER,
} from '@/lib/utils/standings';

interface Game {
  id: string | number;
  status: string;
  isLive: boolean;
  isFinal: boolean;
  detail?: string;
  away: { name: string; score: number };
  home: { name: string; score: number };
  venue?: string;
}

interface LeaderEntry {
  name: string;
  id?: string | number;
  team: string;
  teamId?: string | number;
  headshot?: string;
  value: string | number;
  stat: string;
}

interface LeaderCategory {
  name: string;
  abbreviation: string;
  leaders: LeaderEntry[];
}

type TabType = 'standings' | 'scores' | 'teams' | 'players';

const NFL_HERO_STATS = [
  { value: '32', label: 'NFL Teams' },
  { value: '18', label: 'Week Season' },
  { value: 'Live', label: 'Real-Time Scores' },
  { value: 'EPA', label: 'Advanced Data' },
];

const TRACKING_BULLETS = [
  { bold: 'Next Gen Stats', text: 'uses Zebra UWB RFID tags (not camera CV) — 10Hz positional data for every player' },
  { bold: 'NFL Digital Athlete:', text: '38 cameras, 5K video, enabling 83x faster helmet impact detection' },
  { bold: '17% concussion reduction', text: 'in 2024 — material harm reduction powered by computer vision' },
  { bold: 'SkillCorner', text: '+ broadcast-derived tracking emerging for speed, separation, and get-off time' },
];

const NEXT_GEN_STATS_EXPLAINERS = [
  {
    stat: 'EPA',
    name: 'Expected Points Added',
    description: 'Measures how much each play improves a team\'s expected scoring. A +0.3 EPA pass means the play added roughly a third of a point above average. The gold standard for play-by-play quarterback evaluation.',
  },
  {
    stat: 'CPOE',
    name: 'Completion % Over Expected',
    description: 'Adjusts completion percentage for throw difficulty — distance, coverage, pressure, receiver separation. A QB completing 65% of passes isn\'t impressive if his average throw difficulty predicts 70%.',
  },
  {
    stat: 'Separation',
    name: 'Avg. Receiver Separation',
    description: 'Distance in yards between the receiver and nearest defender at the point of arrival. Tracked via RFID chips at 10Hz. Elite route runners consistently create 3+ yards of cushion.',
  },
  {
    stat: 'Time to Throw',
    name: 'Avg. Time to Throw',
    description: 'Snap-to-release measured in seconds. League average hovers around 2.7s. Under 2.5s signals a quick-game offense; over 3.0s means the protection or the reads are stalling.',
  },
];

const LEAGUE_INTEL_CARDS = [
  {
    tag: 'Power Structure',
    title: 'Playoff Picture',
    description: 'Track the 14-team playoff race across both conferences. Wild card positioning, division clinch scenarios, and strength-of-schedule remaining.',
    href: '/nfl/standings',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-burnt-orange fill-none stroke-[1.5]">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    tag: 'Personnel',
    title: 'Roster Moves & Free Agency',
    description: 'Cuts, signings, practice squad elevations, and IR designations that reshape depth charts week to week. The transactions that don\'t make SportsCenter but decide games.',
    href: '/nfl/news',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-burnt-orange fill-none stroke-[1.5]">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    ),
  },
  {
    tag: 'Draft Intel',
    title: '2026 NFL Draft Board',
    description: 'Prospect rankings, combine measurables, and positional value analysis. Which teams are drafting for need vs. best-player-available — and why it matters for next season.',
    href: '/nfl/news',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-burnt-orange fill-none stroke-[1.5]">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    tag: 'Matchups',
    title: 'Rivalry Watch',
    description: 'Division rivalry history, head-to-head records, and the stylistic matchups that make AFC North slugfests and NFC West shootouts different animals entirely.',
    href: '/nfl/games',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-burnt-orange fill-none stroke-[1.5]">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
  },
];

/** Map leader abbreviation to a display-friendly category label */
const LEADER_CATEGORY_MAP: Record<string, { label: string; unit: string }> = {
  'PYDS': { label: 'Passing Yards', unit: 'YDS' },
  'RYDS': { label: 'Rushing Yards', unit: 'YDS' },
  'RECYDS': { label: 'Receiving Yards', unit: 'YDS' },
  'TD': { label: 'Touchdowns', unit: 'TD' },
  'RECTD': { label: 'Receiving TDs', unit: 'TD' },
  'INT': { label: 'Interceptions', unit: 'INT' },
  'SACKS': { label: 'Sacks', unit: 'SACK' },
  'QBR': { label: 'Quarterback Rating', unit: 'QBR' },
  'COMPLETIONS': { label: 'Completions', unit: 'CMP' },
  'RYDS/G': { label: 'Rush Yards/Game', unit: 'YPG' },
  'RECYDS/G': { label: 'Rec Yards/Game', unit: 'YPG' },
  'PYDS/G': { label: 'Pass Yards/Game', unit: 'YPG' },
};

export default function NFLPage() {
  const [activeTab, setActiveTab] = useState<TabType>('standings');
  const [liveGamesDetected, setLiveGamesDetected] = useState(false);

  // Standings — fetched when standings or teams tab is active
  const standingsUrl = (activeTab === 'standings' || activeTab === 'teams') ? '/api/nfl/standings' : null;
  const { data: standingsRaw, loading: standingsLoading, error: standingsError, retry: retryStandings } =
    useSportData<{ standings?: NFLApiConference[]; meta?: { lastUpdated?: string } }>(standingsUrl);

  // Flatten nested conference/division structure using shared utility
  const standings = useMemo<NFLStandingsTeam[]>(
    () => flattenNFLStandings(standingsRaw?.standings || []),
    [standingsRaw],
  );

  // Scores — fetched when scores tab is active, auto-refreshes when live
  const scoresUrl = activeTab === 'scores' ? '/api/nfl/scores' : null;
  const { data: scoresRaw, loading: scoresLoading, error: scoresError, retry: retryScores } =
    useSportData<{ games?: Record<string, unknown>[]; meta?: { lastUpdated?: string } }>(scoresUrl, {
      refreshInterval: 30000,
      refreshWhen: liveGamesDetected,
    });

  // Normalize raw API games into typed Game[]
  const games = useMemo(() => {
    const rawGames = scoresRaw?.games || [];
    return rawGames.map((g, i) => {
      const teams = g.teams as Record<string, Record<string, unknown>> | undefined;
      const status = g.status as Record<string, unknown> | string | undefined;
      const isLive = typeof status === 'object'
        ? (status?.type as Record<string, unknown>)?.state === 'in' || status?.isLive === true
        : typeof status === 'string' && status.toLowerCase().includes('in progress');
      const isFinal = typeof status === 'object'
        ? status?.isFinal === true
        : typeof status === 'string' && status.toLowerCase().includes('final');
      return {
        id: (g.id as string | number) || i,
        away: { name: (teams?.away?.name as string) || 'Away', score: Number(teams?.away?.score ?? 0) },
        home: { name: (teams?.home?.name as string) || 'Home', score: Number(teams?.home?.score ?? 0) },
        status: typeof status === 'object' ? ((status?.detailedState as string) || 'Scheduled') : ((status as string) || 'Scheduled'),
        isLive: Boolean(isLive),
        isFinal: Boolean(isFinal),
        detail: typeof status === 'object' && status?.period ? `Q${status.period}` : undefined,
        venue: (g.venue as Record<string, unknown>)?.name as string || undefined,
      } as Game;
    });
  }, [scoresRaw]);

  const hasLiveGames = useMemo(() => games.some((g) => g.isLive), [games]);
  useEffect(() => { setLiveGamesDetected(hasLiveGames); }, [hasLiveGames]);

  // Leaders — always fetch for the hub page
  const { data: leadersRaw, loading: leadersLoading } =
    useSportData<{ categories?: LeaderCategory[]; meta?: { source?: string; fetched_at?: string } }>('/api/nfl/leaders');

  const leaderCategories = useMemo(() => {
    const cats = leadersRaw?.categories || [];
    // Show the first 3 categories with data (typically passing, rushing, receiving)
    return cats.filter((c) => c.leaders?.length > 0).slice(0, 3);
  }, [leadersRaw]);

  // Derived shared state
  const loading = standingsLoading || scoresLoading;
  const error = standingsError || scoresError;
  const lastUpdated = standingsRaw?.meta?.lastUpdated || scoresRaw?.meta?.lastUpdated || '';

  const standingsByDivision = useMemo(() => groupNFLByDivision(standings), [standings]);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'standings', label: 'Standings' },
    { id: 'scores', label: 'Scores' },
    { id: 'teams', label: 'Teams' },
    { id: 'players', label: 'Players' },
  ];

  return (
    <div className="bsi-theme-football">
      <>
        <div>
        {/* Hero */}
        <SportHero
          sport="NFL"
          leagueName="National Football League"
          tagline="Titans. Cowboys. Chiefs. Every game, every stat, no network filter."
          description="Live scores, conference standings, and analytics for all 32 teams."
          dataSource="SportsDataIO"
          primaryCta={{ label: 'View Standings', href: '/nfl/standings' }}
          secondaryCta={{ label: 'Game Scores', href: '/nfl/games' }}
          stats={NFL_HERO_STATS}
        />

        {/* League Leaders */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal>
              <div className="mb-8">
                <span className="text-burnt-orange text-xs font-semibold uppercase tracking-widest">Statistical Leaders</span>
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-display mt-1">
                  Player <span className="text-gradient-blaze">Leaders</span>
                </h2>
              </div>
            </ScrollReveal>

            {leadersLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} variant="default" padding="lg">
                    <Skeleton variant="text" width={140} height={20} />
                    <div className="mt-4 space-y-3">
                      {[1, 2, 3, 4, 5].map((j) => (
                        <div key={j} className="flex items-center gap-3">
                          <Skeleton variant="text" width={24} height={24} />
                          <Skeleton variant="text" width={120} height={16} />
                          <div className="ml-auto"><Skeleton variant="text" width={50} height={16} /></div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            ) : leaderCategories.length === 0 ? (
              <Card variant="default" padding="lg">
                <EmptyState type="offseason" sport="NFL" />
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {leaderCategories.map((category, catIdx) => {
                  const catInfo = LEADER_CATEGORY_MAP[category.abbreviation] || { label: category.name, unit: category.abbreviation };
                  return (
                    <ScrollReveal key={category.abbreviation || catIdx} delay={catIdx * 100}>
                      <Card variant="default" padding="lg" className="h-full">
                        <CardHeader>
                          <CardTitle size="sm" className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-burnt-orange inline-block" />
                            {catInfo.label}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {category.leaders.slice(0, 5).map((player, idx) => (
                              <div
                                key={`${player.name}-${idx}`}
                                className="flex items-center gap-3 py-2 border-b border-border-subtle last:border-0 group hover:bg-surface-light/50 transition-colors rounded px-1 -mx-1"
                              >
                                <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                                  idx === 0 ? 'bg-burnt-orange text-white' : 'bg-burnt-orange/15 text-burnt-orange'
                                }`}>
                                  {idx + 1}
                                </span>
                                {player.headshot && (
                                  <Image
                                    src={player.headshot}
                                    alt={player.name}
                                    width={32}
                                    height={32}
                                    className="rounded-full object-cover shrink-0"
                                    unoptimized
                                  />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-text-primary truncate">{player.name}</p>
                                  <p className="text-xs text-text-tertiary">{player.team}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className={`text-sm font-bold ${idx === 0 ? 'text-burnt-orange' : 'text-text-primary'}`}>
                                    {player.value}
                                  </p>
                                  <p className="text-[10px] text-text-tertiary uppercase">{catInfo.unit}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 pt-3 border-t border-border-subtle">
                            <Link href="/nfl/players" className="text-burnt-orange text-xs font-semibold hover:text-ember transition-colors inline-flex items-center gap-1">
                              Full Leaderboard
                              <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    </ScrollReveal>
                  );
                })}
              </div>
            )}

            {leadersRaw?.meta && (
              <div className="mt-4">
                <DataSourceBadge source={leadersRaw.meta.source || 'ESPN'} timestamp={formatTimestamp(leadersRaw.meta.fetched_at)} />
              </div>
            )}
          </Container>
        </Section>

        {/* League Intel */}
        <Section padding="lg" background="midnight" borderTop>
          <Container>
            <ScrollReveal>
              <div className="mb-8">
                <span className="text-burnt-orange text-xs font-semibold uppercase tracking-widest">Intelligence</span>
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-display mt-1">
                  League <span className="text-gradient-blaze">Intel</span>
                </h2>
                <p className="text-text-secondary text-sm mt-2 max-w-xl">
                  The storylines and structural shifts shaping the league right now.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {LEAGUE_INTEL_CARDS.map((card, idx) => (
                <ScrollReveal key={card.title} delay={idx * 80}>
                  <Link href={card.href} className="block group h-full">
                    <Card variant="hover" padding="lg" className="h-full relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-burnt-orange to-ember opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-burnt-orange/15 flex items-center justify-center shrink-0">
                          {card.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Badge variant="secondary" className="text-[10px] mb-2">{card.tag}</Badge>
                          <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-burnt-orange transition-colors">
                            {card.title}
                          </h3>
                          <p className="text-text-tertiary text-sm leading-relaxed">
                            {card.description}
                          </p>
                          <span className="text-burnt-orange text-xs font-semibold mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                            Explore
                            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* Tabs and Content */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <TabBar tabs={tabs} active={activeTab} onChange={(id) => setActiveTab(id as TabType)} size="sm" />

            {/* Standings Tab */}
            <TabPanel id="standings" activeTab={activeTab}>
              <DataErrorBoundary name="NFL Standings">
              {loading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} variant="default" padding="lg">
                      <CardHeader><Skeleton variant="text" width={200} height={24} /></CardHeader>
                      <CardContent>
                        <table className="w-full"><thead><tr className="border-b-2 border-burnt-orange">
                          {['#', 'Team', 'W', 'L', 'T', 'PCT', 'PF', 'PA'].map((h) => (
                            <th key={h} className="text-left p-3 text-text-tertiary font-semibold text-xs">{h}</th>
                          ))}
                        </tr></thead><tbody>{[1, 2, 3, 4].map((j) => <SkeletonTableRow key={j} columns={8} />)}</tbody></table>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : error ? (
                <Card variant="default" padding="lg">
                  <EmptyState type="error" onRetry={retryStandings} />
                </Card>
              ) : standings.length === 0 ? (
                <Card variant="default" padding="lg">
                  <EmptyState type="offseason" sport="NFL" />
                </Card>
              ) : (
                NFL_DIVISION_ORDER.filter((div) => standingsByDivision[div]?.length > 0).map((division) => (
                  <ScrollReveal key={division}>
                    <Card variant="default" padding="lg" className="mb-6">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <Image src="/icons/football.svg" alt="" width={20} height={20} className="opacity-60" />
                          {division}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b-2 border-burnt-orange">
                                {['#', 'Team', 'W', 'L', 'T', 'PCT', 'PF', 'PA'].map((h) => (
                                  <th key={h} className="text-left p-3 text-text-tertiary font-semibold text-xs">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {standingsByDivision[division].map((team, idx) => (
                                <tr key={team.teamName} className="border-b border-border-subtle hover:bg-surface-light transition-colors">
                                  <td className="p-3 text-burnt-orange font-bold">{idx + 1}</td>
                                  <td className="p-3 font-semibold text-text-primary">{team.teamName}</td>
                                  <td className="p-3 text-text-secondary">{team.wins}</td>
                                  <td className="p-3 text-text-secondary">{team.losses}</td>
                                  <td className="p-3 text-text-secondary">{team.ties || 0}</td>
                                  <td className="p-3 text-text-secondary">{team.winPercentage.toFixed(3).replace('0.', '.')}</td>
                                  <td className="p-3 text-text-secondary">{team.pointsFor || '-'}</td>
                                  <td className="p-3 text-text-secondary">{team.pointsAgainst || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border-subtle">
                          <DataSourceBadge source="SportsDataIO" timestamp={formatTimestamp(lastUpdated)} />
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                ))
              )}
              </DataErrorBoundary>
            </TabPanel>

            {/* Scores Tab */}
            <TabPanel id="scores" activeTab={activeTab}>
              <DataErrorBoundary name="NFL Scores">
              {loading ? (
                <div className="space-y-4">{[1, 2, 3, 4].map((i) => <SkeletonScoreCard key={i} />)}</div>
              ) : error ? (
                <Card variant="default" padding="lg">
                  <EmptyState type="error" onRetry={retryScores} />
                </Card>
              ) : games.length === 0 ? (
                <Card variant="default" padding="lg">
                  <EmptyState type="no-games" sport="NFL" />
                </Card>
              ) : (
                <ScrollReveal>
                  <Card variant="default" padding="lg">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>This Week&apos;s Games</span>
                        {hasLiveGames && <FreshnessBadge isLive fetchedAt={lastUpdated} />}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {games.map((game) => (
                          <GameScoreCard
                            key={game.id}
                            game={game}
                          />
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-border-subtle">
                        <DataSourceBadge source="SportsDataIO" timestamp={formatTimestamp(lastUpdated)} />
                        {hasLiveGames && <span className="text-xs text-text-tertiary ml-4">Auto-refreshing every 30 seconds</span>}
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              )}
              </DataErrorBoundary>
            </TabPanel>

            {/* Teams Tab */}
            <TabPanel id="teams" activeTab={activeTab}>
              <div className="grid gap-6 md:grid-cols-2">
                {['AFC', 'NFC'].map((conf) => (
                  <div key={conf}>
                    <h3 className="text-xl font-display font-bold text-burnt-orange mb-4 flex items-center gap-2">
                      <Image src="/icons/football.svg" alt="" width={18} height={18} className="opacity-60" />
                      {conf}
                    </h3>
                    <div className="space-y-3">
                      {NFL_DIVISION_ORDER.filter((d) => d.startsWith(conf)).map((div) => {
                        const divTeams = standingsByDivision[div] || [];
                        return (
                          <Card key={div} variant="default" padding="md">
                            <h4 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-3">{div}</h4>
                            <div className="space-y-2">
                              {divTeams.map((team, idx) => {
                                const pDiff = (team.pointsFor || 0) - (team.pointsAgainst || 0);
                                const isLeader = idx === 0 && team.wins > 0;
                                return (
                                  <Link key={team.teamName} href={`/nfl/teams/${team.teamName.toLowerCase().replace(/\s+/g, '-')}`} className="block group">
                                    <div className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${
                                      isLeader ? 'bg-burnt-orange/10 border border-burnt-orange/20' : 'hover:bg-surface-light'
                                    }`}>
                                      <div className="flex items-center gap-3 min-w-0">
                                        <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${
                                          isLeader ? 'bg-burnt-orange text-white' : 'bg-surface-light text-text-tertiary'
                                        }`}>
                                          {idx + 1}
                                        </span>
                                        <span className="text-sm font-semibold text-text-primary truncate group-hover:text-burnt-orange transition-colors">
                                          {team.teamName}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-xs text-text-secondary font-mono">
                                          {team.wins}-{team.losses}{team.ties ? `-${team.ties}` : ''}
                                        </span>
                                        {pDiff !== 0 && (
                                          <span className={`text-[10px] font-mono ${pDiff > 0 ? 'text-success' : 'text-error'}`}>
                                            {pDiff > 0 ? '+' : ''}{pDiff}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/nfl/standings"><Button variant="primary" size="sm">Full Standings</Button></Link>
                <Link href="/nfl/games"><Button variant="secondary" size="sm">This Week&apos;s Games</Button></Link>
              </div>
            </TabPanel>

            {/* Players Tab */}
            <TabPanel id="players" activeTab={activeTab}>
              <div className="space-y-6">
                <Card variant="default" padding="lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-burnt-orange fill-none stroke-[1.5]">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      Player Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-text-secondary mb-6">
                      Search NFL players for detailed stats, Next Gen metrics, and performance profiles across all 32 rosters.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      {[
                        { label: 'Quarterbacks', desc: 'Pass yards, TDs, QBR, CPOE', href: '/nfl/players' },
                        { label: 'Running Backs', desc: 'Rush yards, YPC, broken tackles', href: '/nfl/players' },
                        { label: 'Wide Receivers', desc: 'Targets, receptions, separation', href: '/nfl/players' },
                        { label: 'Defenders', desc: 'Sacks, INTs, PFF grade', href: '/nfl/players' },
                      ].map((cat) => (
                        <Link key={cat.label} href={cat.href} className="group block">
                          <div className="bg-background-tertiary rounded-lg p-4 border border-border-subtle hover:border-burnt-orange transition-colors h-full">
                            <h4 className="text-sm font-semibold text-text-primary group-hover:text-burnt-orange transition-colors">
                              {cat.label}
                            </h4>
                            <p className="text-[11px] text-text-tertiary mt-1 leading-snug">{cat.desc}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Link href="/nfl/players"><Button variant="primary" size="sm">Browse All Players</Button></Link>
                      <Link href="/nfl/news"><Button variant="secondary" size="sm">Latest News</Button></Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick leader preview in players tab */}
                {leaderCategories.length > 0 && (
                  <Card variant="default" padding="lg">
                    <CardHeader>
                      <CardTitle size="sm">Top Performers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {leaderCategories.slice(0, 3).map((cat) => {
                          const topPlayer = cat.leaders[0];
                          if (!topPlayer) return null;
                          const catInfo = LEADER_CATEGORY_MAP[cat.abbreviation] || { label: cat.name, unit: cat.abbreviation };
                          return (
                            <div key={cat.abbreviation} className="bg-background-tertiary rounded-lg p-4 border border-border-subtle">
                              <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-2">{catInfo.label} Leader</p>
                              <div className="flex items-center gap-3">
                                {topPlayer.headshot && (
                                  <Image
                                    src={topPlayer.headshot}
                                    alt={topPlayer.name}
                                    width={40}
                                    height={40}
                                    className="rounded-full object-cover shrink-0"
                                    unoptimized
                                  />
                                )}
                                <div>
                                  <p className="text-sm font-semibold text-text-primary">{topPlayer.name}</p>
                                  <p className="text-xs text-text-tertiary">{topPlayer.team}</p>
                                </div>
                              </div>
                              <p className="text-2xl font-bold text-burnt-orange mt-2">{topPlayer.value}</p>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabPanel>
          </Container>
        </Section>

        {/* Tracking & Player Safety Section */}
        <Section padding="lg" background="midnight" borderTop>
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SportInfoCard
                icon={
                  <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-burnt-orange fill-none stroke-[1.5]">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                }
                title="Tracking &amp; Player Safety"
                subtitle="How the NFL uses tracking technology"
                bullets={TRACKING_BULLETS}
                actions={[
                  { label: 'Full Vision AI Landscape →', href: '/vision-ai', variant: 'ghost' },
                ]}
              />

              <ScrollReveal delay={150}>
                <Card variant="default" padding="lg" className="h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-burnt-orange/15 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-burnt-orange fill-none stroke-[1.5]">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                    </div>
                    <div>
                      <CardTitle size="md">Next Gen Stats Glossary</CardTitle>
                      <p className="text-text-tertiary text-xs mt-0.5">What the advanced numbers actually mean</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {NEXT_GEN_STATS_EXPLAINERS.map((item) => (
                      <div key={item.stat} className="border-b border-border-subtle last:border-0 pb-3 last:pb-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-[10px] font-mono">{item.stat}</Badge>
                          <span className="text-sm font-semibold text-text-primary">{item.name}</span>
                        </div>
                        <p className="text-text-tertiary text-xs leading-relaxed">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </ScrollReveal>
            </div>
          </Container>
        </Section>
      </div>
        <Footer />
      </>
    </div>
  );
}
