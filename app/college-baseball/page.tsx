'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSportData } from '@/lib/hooks/useSportData';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { SkeletonTableRow, SkeletonScoreCard } from '@/components/ui/Skeleton';
import { DataFreshnessIndicator } from '@/components/ui/DataFreshnessIndicator';
import { preseason2026 } from '@/lib/data/preseason-2026';
import { formatTimestamp, formatScheduleDate, getDateOffset } from '@/lib/utils/timezone';
import { teamMetadata } from '@/lib/data/team-metadata';

interface RankedTeam {
  rank: number;
  team: string;
  conference: string;
  record?: string;
}

interface StandingsTeam {
  teamName: string;
  wins: number;
  losses: number;
  conferenceWins?: number;
  conferenceLosses?: number;
  conference?: string;
}

interface ScheduleGame {
  id: string;
  date: string;
  time: string;
  status: 'scheduled' | 'live' | 'final' | 'postponed' | 'canceled';
  inning?: number;
  homeTeam: {
    id: string;
    name: string;
    shortName: string;
    conference: string;
    score: number | null;
    record: { wins: number; losses: number };
  };
  awayTeam: {
    id: string;
    name: string;
    shortName: string;
    conference: string;
    score: number | null;
    record: { wins: number; losses: number };
  };
  venue: string;
  tv?: string;
}

type TabType = 'rankings' | 'standings' | 'schedule' | 'teams' | 'players';

/** Preseason fallback — derived from preseason-2026.ts, never hardcoded. Top 25 only. */
const preseasonRankings: RankedTeam[] = Object.entries(preseason2026)
  .sort(([, a], [, b]) => a.rank - b.rank)
  .slice(0, 25)
  .map(([slug, data]) => ({
    rank: data.rank,
    team: teamMetadata[slug]?.shortName || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    conference: data.conference,
    record: data.record2025,
  }));

const conferenceList = [
  { name: 'SEC', teams: 16, href: '/college-baseball/standings?conference=sec' },
  { name: 'ACC', teams: 14, href: '/college-baseball/standings?conference=acc' },
  { name: 'Big 12', teams: 16, href: '/college-baseball/standings?conference=big12' },
  { name: 'Big Ten', teams: 13, href: '/college-baseball/standings?conference=bigten' },
  { name: 'Pac-12', teams: 4, href: '/college-baseball/standings?conference=pac12' },
  { name: 'Sun Belt', teams: 14, href: '/college-baseball/standings?conference=sunbelt' },
  { name: 'AAC', teams: 11, href: '/college-baseball/standings?conference=aac' },
  { name: 'All Conferences', teams: 32, href: '/college-baseball/standings' },
];

const scheduleConferences = ['All', 'SEC', 'ACC', 'Big 12', 'Big Ten', 'Pac-12', 'Sun Belt', 'AAC'];

// formatTimestamp, formatScheduleDate, getDateOffset imported from lib/utils/timezone

export default function CollegeBaseballPage() {
  const [activeTab, setActiveTab] = useState<TabType>('rankings');
  const [selectedDate, setSelectedDate] = useState<string>("");
  useEffect(() => { if (!selectedDate) setSelectedDate(getDateOffset(0)); }, []);
  const [selectedConference, setSelectedConference] = useState('All');
  const [liveGamesDetected, setLiveGamesDetected] = useState(false);
  const hasAutoAdvanced = useRef(false);

  // Rankings — fetched when rankings tab is active
  const rankingsUrl = activeTab === 'rankings' ? '/api/ncaa/rankings?sport=baseball' : null;
  const { data: rankingsRaw, loading: rankingsLoading } =
    useSportData<{ rankings?: RankedTeam[]; meta?: { lastUpdated?: string; dataSource?: string } }>(rankingsUrl);
  const rankings = rankingsRaw?.rankings?.length ? rankingsRaw.rankings : preseasonRankings;

  // Standings — fetched when standings tab is active
  const standingsUrl = activeTab === 'standings' ? '/api/college-baseball/standings' : null;
  const { data: standingsRaw, loading: standingsLoading, error: standingsError, retry: retryStandings } =
    useSportData<{ standings?: StandingsTeam[]; teams?: StandingsTeam[]; meta?: { lastUpdated?: string; dataSource?: string } }>(standingsUrl);
  const standings = (standingsRaw?.standings || standingsRaw?.teams || []) as StandingsTeam[];

  // Schedule — fetched when schedule tab is active, auto-refreshes when live
  const scheduleUrl = activeTab === 'schedule' ? `/api/college-baseball/schedule?date=${selectedDate}` : null;
  const { data: scheduleRaw, loading: scheduleLoading, error: scheduleError, retry: retrySchedule } =
    useSportData<{
      success?: boolean;
      data?: ScheduleGame[];
      games?: ScheduleGame[];
      live?: boolean;
      meta?: { dataSource?: string; lastUpdated?: string };
      timestamp?: string;
      message?: string;
    }>(scheduleUrl, {
      refreshInterval: 30000,
      refreshWhen: liveGamesDetected,
    });

  const scheduleGames = useMemo(() => scheduleRaw?.data || scheduleRaw?.games || [], [scheduleRaw]);
  const hasLiveGames = useMemo(() => scheduleGames.some((g) => g.status === 'live'), [scheduleGames]);
  useEffect(() => { setLiveGamesDetected(hasLiveGames); }, [hasLiveGames]);

  // Derived shared state
  const loading = rankingsLoading || standingsLoading;
  const error = standingsError;
  const dataSource = rankingsRaw?.meta?.dataSource || standingsRaw?.meta?.dataSource || scheduleRaw?.meta?.dataSource || 'ESPN';
  const lastUpdated = rankingsRaw?.meta?.lastUpdated || standingsRaw?.meta?.lastUpdated || scheduleRaw?.timestamp || scheduleRaw?.meta?.lastUpdated || '';

  // Smart date initialization: auto-advance to next game day if today has no games
  useEffect(() => {
    if (activeTab !== 'schedule' || hasAutoAdvanced.current) return;
    hasAutoAdvanced.current = true;

    async function findNextGameDay() {
      for (let i = 0; i <= 7; i++) {
        const date = getDateOffset(i);
        try {
          const res = await fetch(`/api/college-baseball/schedule?date=${date}`);
          const data = await res.json() as { data?: unknown[]; games?: unknown[] };
          const games = data.data || data.games || [];
          if (games.length > 0) {
            setSelectedDate(date);
            return;
          }
        } catch {
          continue;
        }
      }
    }
    findNextGameDay();
  }, [activeTab]);

  // Client-side conference filter
  const filteredGames = selectedConference === 'All'
    ? scheduleGames
    : scheduleGames.filter(
        (g) =>
          g.homeTeam.conference === selectedConference ||
          g.awayTeam.conference === selectedConference
      );

  const dateOptions = [
    { offset: -2, label: formatScheduleDate(getDateOffset(-2)) },
    { offset: -1, label: 'Yesterday' },
    { offset: 0, label: 'Today' },
    { offset: 1, label: 'Tomorrow' },
    { offset: 2, label: formatScheduleDate(getDateOffset(2)) },
  ];

  const tabs: { id: TabType; label: string }[] = [
    { id: 'rankings', label: 'Rankings' },
    { id: 'standings', label: 'Standings' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'teams', label: 'Teams' },
    { id: 'players', label: 'Players' },
  ];

  return (
    <div className="bsi-theme-baseball">
      <>
        <main id="main-content">
        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/15 via-transparent to-transparent pointer-events-none" />
          <Container center>
            <ScrollReveal direction="up">
              <Badge variant="success" className="mb-4">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
                NCAA Division I Baseball
              </Badge>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-center uppercase tracking-wide mb-4">
                NCAA Division I <span className="text-gradient-blaze">Baseball</span>
              </h1>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={120}>
              <DataFreshnessIndicator
                lastUpdated={lastUpdated ? new Date(lastUpdated) : undefined}
                source={dataSource}
                refreshInterval={30}
              />
            </ScrollReveal>
            <ScrollReveal direction="up" delay={150}>
              <p className="text-[#C9A227] font-semibold text-lg tracking-wide text-center mb-4">
                Coverage this sport has always deserved.
              </p>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={200}>
              <p className="text-white/60 text-center max-w-2xl mx-auto mb-8">
                Complete box scores with batting lines, pitching stats, and play-by-play for every D1 game.
                SEC, Big 12, ACC -- all 300+ programs, covered like they matter. Because they do.
              </p>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={250}>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/college-baseball/games"><Button variant="primary" size="lg">View Live Games</Button></Link>
                <Link href="/college-baseball/standings"><Button variant="secondary" size="lg">Conference Standings</Button></Link>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={300}>
              <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl">
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-burnt-orange">300+</div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mt-1">Division I Teams</div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-burnt-orange">32</div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mt-1">Conferences</div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-burnt-orange">Live</div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mt-1">Real-Time Scores</div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-burnt-orange">RPI</div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mt-1">Advanced Data</div>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Editorial CTA */}
        <Section padding="sm" className="py-4">
          <Container>
            <div className="space-y-3">
              <Link href="/college-baseball/editorial/texas-2026">
                <div className="bg-gradient-to-r from-burnt-orange/20 to-[#500000]/20 border border-burnt-orange/30 rounded-xl p-4 md:p-6 hover:border-burnt-orange/60 transition-all group cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant="primary" className="mb-2">Featured</Badge>
                      <h3 className="font-display text-lg md:text-xl font-bold text-white uppercase tracking-wide group-hover:text-burnt-orange transition-colors">
                        Texas Longhorns: 2026 Season Preview
                      </h3>
                      <p className="text-white/50 text-sm mt-1">
                        3,818 wins. 130 years. The definitive deep dive on the #1 team in college baseball.
                      </p>
                    </div>
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-burnt-orange flex-shrink-0 ml-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </div>
              </Link>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Link href="/college-baseball/editorial/week-1-recap">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 hover:border-burnt-orange/40 transition-all group cursor-pointer h-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge variant="secondary" className="mb-1">New</Badge>
                        <h4 className="font-display text-sm font-bold text-white uppercase tracking-wide group-hover:text-burnt-orange transition-colors">
                          Week 1 Recap
                        </h4>
                        <p className="text-white/40 text-xs mt-0.5">Three grand slams. One record book.</p>
                      </div>
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/20 flex-shrink-0 ml-3" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </div>
                </Link>
                <Link href="/college-baseball/editorial/sec-opening-weekend">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 hover:border-burnt-orange/40 transition-all group cursor-pointer h-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-display text-sm font-bold text-white uppercase tracking-wide group-hover:text-burnt-orange transition-colors">
                          SEC Conference Preview
                        </h4>
                        <p className="text-white/40 text-xs mt-0.5">13 ranked teams. The deepest conference.</p>
                      </div>
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/20 flex-shrink-0 ml-3" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </div>
                </Link>
                <Link href="/college-baseball/compare">
                  <div className="bg-gradient-to-r from-burnt-orange/10 to-ember/10 border border-burnt-orange/20 rounded-xl p-3 md:p-4 hover:border-burnt-orange/40 transition-all group cursor-pointer h-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-display text-sm font-bold text-burnt-orange uppercase tracking-wide group-hover:text-ember transition-colors">
                          Compare Teams
                        </h4>
                        <p className="text-white/40 text-xs mt-0.5">Head-to-head Power 25 rivalry cards.</p>
                      </div>
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-burnt-orange/40 flex-shrink-0 ml-3" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </Container>
        </Section>

        {/* Tabs */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <div className="flex gap-2 mb-2 border-b border-white/10 overflow-x-auto pb-px">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    activeTab === tab.id ? 'text-burnt-orange border-burnt-orange' : 'text-white/40 border-transparent hover:text-white'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Secondary nav — pages not covered by tabs */}
            <div className="flex gap-3 mb-8 overflow-x-auto pb-1">
              {[
                { label: 'Editorial', href: '/college-baseball/editorial' },
                { label: 'News', href: '/college-baseball/news' },
                { label: 'Compare', href: '/college-baseball/compare' },
                { label: 'Conferences', href: '/college-baseball/conferences' },
                { label: 'Scores', href: '/college-baseball/scores' },
              ].map((link) => (
                <Link key={link.href} href={link.href}
                  className="px-3 py-1.5 text-xs font-medium text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all whitespace-nowrap">
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Rankings Tab */}
            {activeTab === 'rankings' && (
              <ScrollReveal>
                <Card variant="default" padding="lg">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Image src="/icons/baseball.svg" alt="" width={20} height={20} className="opacity-60" />
                        2026 Preseason Top 25
                      </div>
                      <Badge variant="primary">D1Baseball</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <table className="w-full"><tbody>{Array.from({ length: 25 }).map((_, i) => <SkeletonTableRow key={i} columns={4} />)}</tbody></table>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b-2 border-burnt-orange">
                              {['Rank', 'Team', 'Conference', 'Record'].map((h) => (
                                <th key={h} className="text-left p-3 text-white/40 font-semibold text-xs">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rankings.map((team) => (
                              <tr key={team.rank} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="p-3 text-burnt-orange font-bold text-lg">{team.rank}</td>
                                <td className="p-3 font-semibold text-white">{team.team}</td>
                                <td className="p-3 text-white/60">{team.conference}</td>
                                <td className="p-3 text-white/60">{team.record || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                      <DataSourceBadge source="D1Baseball / NCAA" timestamp={formatTimestamp(lastUpdated)} />
                      <Link href="/college-baseball/rankings" className="text-sm text-burnt-orange hover:text-ember transition-colors">
                        Full Rankings →
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            )}

            {/* Standings Tab */}
            {activeTab === 'standings' && (
              <>
                {loading ? (
                  <Card variant="default" padding="lg">
                    <CardContent><table className="w-full"><tbody>{Array.from({ length: 10 }).map((_, i) => <SkeletonTableRow key={i} columns={6} />)}</tbody></table></CardContent>
                  </Card>
                ) : error ? (
                  <Card variant="default" padding="lg" className="bg-red-500/10 border-red-500/30">
                    <p className="text-red-400 font-semibold">Data Unavailable</p>
                    <p className="text-white/60 text-sm mt-1">{error}</p>
                    <button onClick={retryStandings} className="mt-4 px-4 py-2 bg-burnt-orange text-white rounded-lg">Retry</button>
                  </Card>
                ) : standings.length === 0 ? (
                  <div>
                    <Card variant="default" padding="lg" className="mb-6">
                      <div className="text-center py-8">
                        <p className="text-white/60">Season hasn&apos;t started yet. Browse conferences below.</p>
                      </div>
                    </Card>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {conferenceList.map((conf) => (
                        <Link key={conf.name} href={conf.href}>
                          <Card variant="hover" padding="md" className="text-center h-full">
                            <div className="font-semibold text-white">{conf.name}</div>
                            <div className="text-xs text-white/40 mt-1">{conf.teams} Teams</div>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <ScrollReveal>
                    <Card variant="default" padding="lg">
                      <CardHeader><CardTitle>Conference Standings</CardTitle></CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b-2 border-burnt-orange">
                                {['#', 'Team', 'Conf', 'W', 'L', 'Conf W-L'].map((h) => (
                                  <th key={h} className="text-left p-3 text-white/40 font-semibold text-xs">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {standings.map((team, idx) => (
                                <tr key={team.teamName} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                  <td className="p-3 text-burnt-orange font-bold">{idx + 1}</td>
                                  <td className="p-3 font-semibold text-white">{team.teamName}</td>
                                  <td className="p-3 text-white/60">{team.conference || '-'}</td>
                                  <td className="p-3 text-white/60">{team.wins}</td>
                                  <td className="p-3 text-white/60">{team.losses}</td>
                                  <td className="p-3 text-white/60">{team.conferenceWins != null ? `${team.conferenceWins}-${team.conferenceLosses}` : '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <DataSourceBadge source="NCAA / D1Baseball" timestamp={formatTimestamp(lastUpdated)} />
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                )}
              </>
            )}

            {/* Schedule Tab */}
            {activeTab === 'schedule' && (
              <>
                {/* Date Navigation */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                  <button
                    onClick={() => setSelectedDate(getDateOffset(
                      Math.round((new Date(selectedDate).getTime() - new Date().getTime()) / 86400000) - 3
                    ))}
                    className="p-2 text-white/40 hover:text-white transition-colors flex-shrink-0"
                    aria-label="Previous days"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>

                  {dateOptions.map((option) => {
                    const dateValue = getDateOffset(option.offset);
                    const isSelected = selectedDate === dateValue;
                    return (
                      <button
                        key={option.offset}
                        onClick={() => setSelectedDate(dateValue)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all flex-shrink-0 ${
                          isSelected
                            ? 'bg-burnt-orange text-white'
                            : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setSelectedDate(getDateOffset(
                      Math.round((new Date(selectedDate).getTime() - new Date().getTime()) / 86400000) + 3
                    ))}
                    className="p-2 text-white/40 hover:text-white transition-colors flex-shrink-0"
                    aria-label="Next days"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>

                {/* Conference Filter */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {scheduleConferences.map((conf) => (
                    <button
                      key={conf}
                      onClick={() => setSelectedConference(conf)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedConference === conf
                          ? 'bg-burnt-orange text-white'
                          : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {conf}
                    </button>
                  ))}
                </div>

                {scheduleLoading ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonScoreCard key={i} />)}
                  </div>
                ) : scheduleError ? (
                  <Card variant="default" padding="lg" className="bg-red-500/10 border-red-500/30">
                    <p className="text-red-400 font-semibold">Data Unavailable</p>
                    <p className="text-white/60 text-sm mt-1">{scheduleError}</p>
                    <button onClick={retrySchedule} className="mt-4 px-4 py-2 bg-burnt-orange text-white rounded-lg">Retry</button>
                  </Card>
                ) : filteredGames.length === 0 ? (
                  <Card variant="default" padding="lg">
                    <div className="text-center py-8">
                      <svg viewBox="0 0 24 24" className="w-16 h-16 text-white/20 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <p className="text-white/60">No games scheduled for {formatScheduleDate(selectedDate)}</p>
                      <p className="text-white/30 text-sm mt-2">
                        D1 baseball season runs February through June. Try navigating to a game day.
                      </p>
                    </div>
                  </Card>
                ) : (
                  <>
                    {/* Live Games */}
                    {filteredGames.some((g) => g.status === 'live') && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          Live Games
                        </h3>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {filteredGames.filter((g) => g.status === 'live').map((game) => (
                            <ScheduleGameCard key={game.id} game={game} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upcoming Games */}
                    {filteredGames.some((g) => g.status === 'scheduled') && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-white mb-3">Upcoming</h3>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {filteredGames.filter((g) => g.status === 'scheduled').map((game) => (
                            <ScheduleGameCard key={game.id} game={game} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Final Games */}
                    {filteredGames.some((g) => g.status === 'final') && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-white/60 mb-3">Final</h3>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {filteredGames.filter((g) => g.status === 'final').map((game) => (
                            <ScheduleGameCard key={game.id} game={game} />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-4">
                      <DataSourceBadge
                        source={dataSource || 'ESPN College Baseball API'}
                        timestamp={formatTimestamp(lastUpdated)}
                      />
                      <Link href="/college-baseball/scores" className="text-sm text-burnt-orange hover:text-ember transition-colors">
                        View Full Scoreboard →
                      </Link>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Teams Tab */}
            {activeTab === 'teams' && (
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  {conferenceList.map((conf) => (
                    <Link key={conf.name} href={conf.href}>
                      <Card variant="hover" padding="md" className="text-center h-full">
                        <div className="font-semibold text-white">{conf.name}</div>
                        <div className="text-xs text-white/40 mt-1">
                          {conf.name === 'All Conferences' ? `View All ${conf.teams}` : `${conf.teams} Teams`}
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
                <div className="text-center">
                  <Link href="/college-baseball/teams"><Button variant="primary">Browse All Teams</Button></Link>
                </div>
              </div>
            )}

            {/* Players Tab */}
            {activeTab === 'players' && (
              <Card variant="default" padding="lg">
                <CardHeader><CardTitle>Player Statistics</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-white/60 mb-4">Search D1 baseball players for stats, draft projections, and transfer portal activity.</p>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/college-baseball/players"><Button variant="primary">Browse Players</Button></Link>
                    <Link href="/college-baseball/transfer-portal"><Button variant="secondary">Transfer Portal</Button></Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </Container>
        </Section>

        {/* Scouting Technology Section */}
        <Section padding="lg" background="midnight" borderTop>
          <Container>
            <ScrollReveal>
              <Card variant="default" padding="lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-burnt-orange/15 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-burnt-orange fill-none stroke-[1.5]">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle size="md">Scouting Technology</CardTitle>
                    <p className="text-text-tertiary text-xs mt-0.5">The tracking gap in college baseball</p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-text-secondary">
                  <li className="flex gap-2">
                    <span className="text-burnt-orange mt-1 shrink-0">&bull;</span>
                    <span><strong className="text-white">No league-wide tracking</strong> — unlike MLB&apos;s Statcast, college baseball has no standardized optical tracking infrastructure</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-burnt-orange mt-1 shrink-0">&bull;</span>
                    <span><strong className="text-white">KinaTrax at 7 NCAA programs</strong> (~$500K per install) — markerless 3D motion capture for pitching biomechanics</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-burnt-orange mt-1 shrink-0">&bull;</span>
                    <span><strong className="text-white">Rapsodo units at mid-tier programs</strong> ($3K-$5K vs TrackMan at $20K+) — pitch tracking becoming accessible</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-burnt-orange mt-1 shrink-0">&bull;</span>
                    <span><strong className="text-white">Synergy Sports covers ~90% of D1 baseball</strong> — comprehensive play-type tagging from game film</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-burnt-orange mt-1 shrink-0">&bull;</span>
                    <span><strong className="text-white">SkillCorner + broadcast-derived tracking</strong> emerging — could bring positional data to any streamed game</span>
                  </li>
                </ul>
                <div className="mt-5 pt-4 border-t border-white/5">
                  <Link href="/vision-ai">
                    <Button variant="ghost" size="sm">Full Vision AI Landscape &rarr;</Button>
                  </Link>
                </div>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>
      </main>
        <Footer />
      </>
    </div>
  );
}

function ScheduleGameCard({ game }: { game: ScheduleGame }) {
  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';
  const isScheduled = game.status === 'scheduled';
  const awayWon = isFinal && (game.awayTeam.score ?? 0) > (game.homeTeam.score ?? 0);
  const homeWon = isFinal && (game.homeTeam.score ?? 0) > (game.awayTeam.score ?? 0);

  return (
    <Link href={`/college-baseball/game/${game.id}`} className="block">
      <div className={`bg-white/5 rounded-lg border transition-all hover:border-burnt-orange hover:bg-white/[0.07] ${
        isLive ? 'border-green-500/30' : 'border-white/10'
      }`}>
        {/* Status Bar */}
        <div className={`px-3 py-1.5 rounded-t-lg flex items-center justify-between ${
          isLive ? 'bg-green-500/10' : isFinal ? 'bg-white/5' : 'bg-burnt-orange/10'
        }`}>
          <span className={`text-xs font-semibold uppercase ${
            isLive ? 'text-green-400' : isFinal ? 'text-white/30' : 'text-burnt-orange'
          }`}>
            {isLive ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                {game.inning ? `Inn ${game.inning}` : 'Live'}
              </span>
            ) : isFinal ? 'Final' : game.time}
          </span>
          <span className="text-[10px] text-white/30 font-medium">
            {game.homeTeam.conference || game.awayTeam.conference || 'NCAA'}
          </span>
        </div>

        {/* Teams */}
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 bg-white/5 rounded-full flex items-center justify-center text-[10px] font-bold text-burnt-orange flex-shrink-0">
                {game.awayTeam.shortName?.slice(0, 3).toUpperCase() || 'AWY'}
              </div>
              <span className={`font-semibold text-sm truncate ${awayWon ? 'text-white' : 'text-white/70'}`}>
                {game.awayTeam.name}
              </span>
            </div>
            <span className={`text-lg font-bold font-mono ml-2 ${
              isScheduled ? 'text-white/20' : awayWon ? 'text-white' : 'text-white/50'
            }`}>
              {game.awayTeam.score !== null ? game.awayTeam.score : '-'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 bg-white/5 rounded-full flex items-center justify-center text-[10px] font-bold text-burnt-orange flex-shrink-0">
                {game.homeTeam.shortName?.slice(0, 3).toUpperCase() || 'HME'}
              </div>
              <span className={`font-semibold text-sm truncate ${homeWon ? 'text-white' : 'text-white/70'}`}>
                {game.homeTeam.name}
              </span>
            </div>
            <span className={`text-lg font-bold font-mono ml-2 ${
              isScheduled ? 'text-white/20' : homeWon ? 'text-white' : 'text-white/50'
            }`}>
              {game.homeTeam.score !== null ? game.homeTeam.score : '-'}
            </span>
          </div>
        </div>

        {/* Venue */}
        {game.venue && game.venue !== 'TBD' && (
          <div className="px-3 pb-2 text-[10px] text-white/25 truncate">
            {game.venue}
          </div>
        )}
      </div>
    </Link>
  );
}
