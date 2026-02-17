'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge, LiveBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { SkeletonTableRow, SkeletonScoreCard } from '@/components/ui/Skeleton';
import { DataFreshnessIndicator } from '@/components/ui/DataFreshnessIndicator';
import { RefreshIndicator } from '@/components/ui/RefreshIndicator';
import { formatTimestamp } from '@/lib/utils/timezone';
import { getDateOffset, formatDate, shiftDate, findNextGameDay } from '@/lib/utils/date-helpers';
import { P4_TEAMS, isP4Team } from '@/lib/data/conferences';

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
  homeTeam: { id: string; name: string; shortName: string; conference: string; score: number | null; record: { wins: number; losses: number } };
  awayTeam: { id: string; name: string; shortName: string; conference: string; score: number | null; record: { wins: number; losses: number } };
  venue: string;
  tv?: string;
}

interface DataMeta {
  dataSource: string;
  lastUpdated: string;
  timezone: string;
}

type TabType = 'rankings' | 'standings' | 'schedule' | 'teams' | 'players';

const defaultRankings: RankedTeam[] = [
  { rank: 1, team: 'Texas A&M', conference: 'SEC' },
  { rank: 2, team: 'Florida', conference: 'SEC' },
  { rank: 3, team: 'LSU', conference: 'SEC' },
  { rank: 4, team: 'Texas', conference: 'SEC' },
  { rank: 5, team: 'Tennessee', conference: 'SEC' },
  { rank: 6, team: 'Georgia', conference: 'SEC' },
  { rank: 7, team: 'Virginia', conference: 'ACC' },
  { rank: 8, team: 'Arkansas', conference: 'SEC' },
  { rank: 9, team: 'Oregon State', conference: 'Pac-12' },
  { rank: 10, team: 'Vanderbilt', conference: 'SEC' },
  { rank: 11, team: 'NC State', conference: 'ACC' },
  { rank: 12, team: 'Florida State', conference: 'ACC' },
  { rank: 13, team: 'Wake Forest', conference: 'ACC' },
  { rank: 14, team: 'Clemson', conference: 'ACC' },
  { rank: 15, team: 'Stanford', conference: 'ACC' },
  { rank: 16, team: 'Texas Tech', conference: 'Big 12' },
  { rank: 17, team: 'Miami', conference: 'ACC' },
  { rank: 18, team: 'South Carolina', conference: 'SEC' },
  { rank: 19, team: 'Mississippi State', conference: 'SEC' },
  { rank: 20, team: 'TCU', conference: 'Big 12' },
  { rank: 21, team: 'Alabama', conference: 'SEC' },
  { rank: 22, team: 'UCLA', conference: 'Big Ten' },
  { rank: 23, team: 'Evansville', conference: 'MVC' },
  { rank: 24, team: 'Ole Miss', conference: 'SEC' },
  { rank: 25, team: 'Oklahoma State', conference: 'Big 12' },
];

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

const conferenceFilters = ['All P4', 'SEC', 'ACC', 'Big 12', 'Big Ten'] as const;

function matchesConferenceFilter(game: ScheduleGame, filter: string): boolean {
  if (filter === 'All P4') {
    return isP4Team(game.homeTeam?.name) || isP4Team(game.awayTeam?.name);
  }
  const teams = P4_TEAMS[filter];
  if (!teams) return true;
  return teams.includes(game.homeTeam?.name) || teams.includes(game.awayTeam?.name);
}

export default function CollegeBaseballPage() {
  const [activeTab, setActiveTab] = useState<TabType>('rankings');
  const [rankings, setRankings] = useState<RankedTeam[]>(defaultRankings);
  const [standings, setStandings] = useState<StandingsTeam[]>([]);
  const [scheduleGames, setScheduleGames] = useState<ScheduleGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [dataSource, setDataSource] = useState<string>('ESPN College Baseball');
  const [hasLiveGames, setHasLiveGames] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(getDateOffset(0));
  const [selectedConference, setSelectedConference] = useState<string>('All P4');
  const smartInitDone = useRef(false);

  const fetchRankings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ncaa/rankings?sport=baseball');
      if (!res.ok) throw new Error('Failed to fetch rankings');
      const data = await res.json() as { rankings?: RankedTeam[]; meta?: { lastUpdated?: string; dataSource?: string } };
      if (data.rankings?.length) setRankings(data.rankings);
      setLastUpdated(data.meta?.lastUpdated || '');
      if (data.meta?.dataSource) setDataSource(data.meta.dataSource);
    } catch (err) {
      console.error('[BSI:college-baseball] Rankings fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStandings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/college-baseball/standings');
      if (!res.ok) throw new Error('Failed to fetch standings');
      const data = await res.json() as { standings?: StandingsTeam[]; teams?: StandingsTeam[]; meta?: { lastUpdated?: string; dataSource?: string } };
      setStandings((data.standings || data.teams || []) as StandingsTeam[]);
      setLastUpdated(data.meta?.lastUpdated || '');
      if (data.meta?.dataSource) setDataSource(data.meta.dataSource);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSchedule = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/college-baseball/schedule?date=${date}&range=week`);
      if (!res.ok) throw new Error('Failed to fetch schedule');
      const data = await res.json() as {
        success?: boolean;
        data?: ScheduleGame[];
        games?: ScheduleGame[];
        meta?: DataMeta;
        timestamp?: string;
      };

      const games = (data.success && data.data) ? data.data : (data.games || []);
      setScheduleGames(games);
      setHasLiveGames(games.some((g) => g.status === 'live'));

      if (data.meta) {
        setDataSource(data.meta.dataSource);
        setLastUpdated(data.meta.lastUpdated);
      } else {
        setLastUpdated(data.timestamp || new Date().toISOString());
      }

      // Smart init: on first load, auto-advance to first day with P4 games
      if (!smartInitDone.current) {
        smartInitDone.current = true;
        const nextDay = findNextGameDay(
          games,
          date,
          7,
          (g) => isP4Team(g.homeTeam?.name || '') || isP4Team(g.awayTeam?.name || ''),
        );
        if (nextDay && nextDay !== date) {
          setSelectedDate(nextDay);
          return;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'rankings') fetchRankings();
    else if (activeTab === 'standings') fetchStandings();
    else if (activeTab === 'schedule') fetchSchedule(selectedDate);
  }, [activeTab, selectedDate, fetchRankings, fetchStandings, fetchSchedule]);

  useEffect(() => {
    if (activeTab === 'schedule' && hasLiveGames) {
      const interval = setInterval(() => fetchSchedule(selectedDate), 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab, hasLiveGames, selectedDate, fetchSchedule]);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'rankings', label: 'Rankings' },
    { id: 'standings', label: 'Standings' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'teams', label: 'Teams' },
    { id: 'players', label: 'Players' },
  ];

  // Date chips centered on selectedDate
  const today = getDateOffset(0);
  const dateOptions = [
    { date: shiftDate(selectedDate, -2), label: formatDate(shiftDate(selectedDate, -2)) },
    { date: shiftDate(selectedDate, -1), label: shiftDate(selectedDate, -1) === today ? 'Today' : formatDate(shiftDate(selectedDate, -1)) },
    { date: selectedDate, label: selectedDate === today ? 'Today' : formatDate(selectedDate) },
    { date: shiftDate(selectedDate, 1), label: shiftDate(selectedDate, 1) === today ? 'Today' : formatDate(shiftDate(selectedDate, 1)) },
    { date: shiftDate(selectedDate, 2), label: formatDate(shiftDate(selectedDate, 2)) },
  ];

  // Filter games by selected date and conference
  const filteredGames = scheduleGames.filter((g) => {
    if (g.date !== selectedDate) return false;
    if (selectedConference === 'All P4') return matchesConferenceFilter(g, 'All P4');
    return matchesConferenceFilter(g, selectedConference);
  });

  const liveGames = filteredGames.filter((g) => g.status === 'live');
  const finalGames = filteredGames.filter((g) => g.status === 'final');
  const upcomingGames = filteredGames.filter((g) => g.status === 'scheduled');

  return (
    <div className="bsi-theme-baseball">
      <>
        <main id="main-content">
        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-[#BF5700]/15 via-transparent to-transparent pointer-events-none" />
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
                <Link href="/college-baseball/scores"><Button variant="primary" size="lg">View Live Games</Button></Link>
                <Link href="/college-baseball/standings"><Button variant="secondary" size="lg">Conference Standings</Button></Link>
              </div>
            </ScrollReveal>

            {/* Editorial CTA */}
            <ScrollReveal direction="up" delay={280}>
              <Link href="/college-baseball/editorial/week-1-preview" className="block mt-6">
                <div className="bg-gradient-to-r from-[#BF5700]/20 to-[#FF6B35]/10 border border-[#BF5700]/30 rounded-xl px-6 py-4 text-center hover:border-[#BF5700]/60 transition-colors">
                  <span className="text-[#FF6B35] font-semibold text-sm uppercase tracking-wide">Opening Weekend Preview</span>
                  <p className="text-white/80 text-sm mt-1">Week 1 breakdown: key matchups, power rankings, breakout stars</p>
                </div>
              </Link>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={300}>
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl">
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-[#BF5700]">300+</div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mt-1">Division I Teams</div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-[#BF5700]">32</div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mt-1">Conferences</div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-[#BF5700]">Live</div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mt-1">Real-Time Scores</div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-[#BF5700]">RPI</div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mt-1">Advanced Data</div>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Tabs */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <div className="flex gap-2 mb-8 border-b border-white/10 overflow-x-auto pb-px">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    activeTab === tab.id ? 'text-[#BF5700] border-[#BF5700]' : 'text-white/40 border-transparent hover:text-white'
                  }`}>
                  {tab.label}
                </button>
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
                            <tr className="border-b-2 border-[#BF5700]">
                              {['Rank', 'Team', 'Conference', 'Record'].map((h) => (
                                <th key={h} className="text-left p-3 text-white/40 font-semibold text-xs">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rankings.map((team) => (
                              <tr key={team.rank} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="p-3 text-[#BF5700] font-bold text-lg">{team.rank}</td>
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
                      <Link href="/baseball/rankings" className="text-sm text-[#BF5700] hover:text-[#FF6B35] transition-colors">
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
                    <button onClick={fetchStandings} className="mt-4 px-4 py-2 bg-[#BF5700] text-white rounded-lg">Retry</button>
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
                              <tr className="border-b-2 border-[#BF5700]">
                                {['#', 'Team', 'Conf', 'W', 'L', 'Conf W-L'].map((h) => (
                                  <th key={h} className="text-left p-3 text-white/40 font-semibold text-xs">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {standings.map((team, idx) => (
                                <tr key={team.teamName} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                  <td className="p-3 text-[#BF5700] font-bold">{idx + 1}</td>
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
                          <DataSourceBadge source={dataSource || 'NCAA / D1Baseball'} timestamp={formatTimestamp(lastUpdated)} />
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
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                  <button
                    onClick={() => setSelectedDate(shiftDate(selectedDate, -3))}
                    className="p-2 text-white/40 hover:text-white transition-colors"
                    aria-label="Previous days"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>

                  {dateOptions.map((opt) => (
                    <button
                      key={opt.date}
                      onClick={() => setSelectedDate(opt.date)}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                        selectedDate === opt.date
                          ? 'bg-[#BF5700] text-white'
                          : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}

                  {selectedDate !== today && (
                    <button
                      onClick={() => setSelectedDate(today)}
                      className="px-3 py-2 rounded-lg text-sm font-medium text-[#BF5700] hover:bg-[#BF5700]/10 transition-colors whitespace-nowrap"
                    >
                      Today
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedDate(shiftDate(selectedDate, 3))}
                    className="p-2 text-white/40 hover:text-white transition-colors"
                    aria-label="Next days"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>

                {/* Conference Filter */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {conferenceFilters.map((conf) => (
                    <button
                      key={conf}
                      onClick={() => setSelectedConference(conf)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedConference === conf
                          ? 'bg-[#BF5700] text-white'
                          : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {conf}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <div className="space-y-4">{[1, 2, 3, 4].map((i) => <SkeletonScoreCard key={i} />)}</div>
                ) : error ? (
                  <Card variant="default" padding="lg" className="bg-red-500/10 border-red-500/30">
                    <p className="text-red-400 font-semibold">Data Unavailable</p>
                    <p className="text-white/60 text-sm mt-1">{error}</p>
                    <button onClick={() => fetchSchedule(selectedDate)} className="mt-4 px-4 py-2 bg-[#BF5700] text-white rounded-lg">Retry</button>
                  </Card>
                ) : filteredGames.length === 0 ? (
                  <Card variant="default" padding="lg">
                    <div className="text-center py-8">
                      <p className="text-white/60">No {selectedConference !== 'All P4' ? selectedConference + ' ' : 'P4 '}games on {formatDate(selectedDate)}.</p>
                      <p className="text-white/30 text-sm mt-2">Use the date arrows to find upcoming games, or try a different conference filter.</p>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {/* Live Games */}
                    {liveGames.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          Live
                          <RefreshIndicator active={true} intervalSeconds={30} />
                        </h3>
                        <div className="space-y-3">
                          {liveGames.map((game) => (
                            <Link key={game.id} href={`/college-baseball/game/${game.id}`} className="block">
                              <div className="bg-white/5 rounded-lg p-4 flex justify-between items-center border border-green-500/30 hover:border-[#BF5700] transition-colors">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-semibold text-white text-sm">{game.awayTeam.name}</span>
                                    <span className="ml-auto text-[#BF5700] font-bold text-lg">{game.awayTeam.score ?? '-'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-white text-sm">{game.homeTeam.name}</span>
                                    <span className="ml-auto text-[#BF5700] font-bold text-lg">{game.homeTeam.score ?? '-'}</span>
                                  </div>
                                </div>
                                <div className="ml-4 text-right">
                                  <LiveBadge />
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Final Games */}
                    {finalGames.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-white/60 mb-3">Final</h3>
                        <div className="space-y-3">
                          {finalGames.map((game) => (
                            <Link key={game.id} href={`/college-baseball/game/${game.id}`} className="block">
                              <div className="bg-white/5 rounded-lg p-4 flex justify-between items-center border border-transparent hover:border-[#BF5700] transition-colors">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className={`font-semibold text-sm ${(game.awayTeam.score ?? 0) > (game.homeTeam.score ?? 0) ? 'text-white' : 'text-white/40'}`}>{game.awayTeam.name}</span>
                                    <span className="ml-auto text-[#BF5700] font-bold text-lg">{game.awayTeam.score ?? 0}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`font-semibold text-sm ${(game.homeTeam.score ?? 0) > (game.awayTeam.score ?? 0) ? 'text-white' : 'text-white/40'}`}>{game.homeTeam.name}</span>
                                    <span className="ml-auto text-[#BF5700] font-bold text-lg">{game.homeTeam.score ?? 0}</span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <span className="text-white/30 font-semibold text-sm">Final</span>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upcoming Games */}
                    {upcomingGames.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-white/60 mb-3">Upcoming</h3>
                        <div className="space-y-3">
                          {upcomingGames.map((game) => (
                            <Link key={game.id} href={`/college-baseball/game/${game.id}`} className="block">
                              <div className="bg-white/5 rounded-lg p-4 flex justify-between items-center border border-transparent hover:border-[#BF5700] transition-colors">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-semibold text-white text-sm">{game.awayTeam.name}</span>
                                    <span className="ml-auto text-white/30 font-bold text-lg">-</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-white text-sm">{game.homeTeam.name}</span>
                                    <span className="ml-auto text-white/30 font-bold text-lg">-</span>
                                  </div>
                                </div>
                                <div className="ml-4 text-right">
                                  <span className="text-[#BF5700] font-semibold text-sm">{game.time}</span>
                                  {game.venue && game.venue !== 'TBD' && (
                                    <p className="text-white/20 text-xs mt-1">{game.venue}</p>
                                  )}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                      <DataSourceBadge source={dataSource} timestamp={formatTimestamp(lastUpdated)} />
                    </div>
                  </div>
                )}

                {/* Full Scoreboard CTA */}
                <div className="mt-6 text-center">
                  <Link href="/college-baseball/scores" className="text-sm text-[#BF5700] hover:text-[#FF6B35] transition-colors font-medium">
                    View Full Scoreboard →
                  </Link>
                </div>
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
      </main>
        <Footer />
      </>
    </div>
  );
}
