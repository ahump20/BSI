'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { SkeletonTableRow, SkeletonScoreCard } from '@/components/ui/Skeleton';
import { DataFreshnessIndicator } from '@/components/ui/DataFreshnessIndicator';
import { RefreshIndicator } from '@/components/ui/RefreshIndicator';
import { formatTimestamp } from '@/lib/utils/timezone';
import {
  filterGamesByConference,
  findNextGameDate,
  formatDatePill,
  groupGamesByStatus,
  normalizeSchedulePayload,
  shiftIsoDate,
  toIsoDate,
  type NormalizedSchedulePayload,
  type PowerConference,
  type ScheduleGame,
  type ScheduleMeta,
} from '@/lib/college-baseball/schedule-utils';

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

type TabType = 'rankings' | 'standings' | 'schedule' | 'teams' | 'players';

const defaultRankings: RankedTeam[] = [
  { rank: 1, team: 'Texas', conference: 'SEC' },
  { rank: 2, team: 'Texas A&M', conference: 'SEC' },
  { rank: 3, team: 'Florida', conference: 'SEC' },
  { rank: 4, team: 'Wake Forest', conference: 'ACC' },
  { rank: 5, team: 'LSU', conference: 'SEC' },
  { rank: 6, team: 'Virginia', conference: 'ACC' },
  { rank: 7, team: 'Arkansas', conference: 'SEC' },
  { rank: 8, team: 'Tennessee', conference: 'SEC' },
  { rank: 9, team: 'Stanford', conference: 'ACC' },
  { rank: 10, team: 'Oregon State', conference: 'Pac-12' },
  { rank: 11, team: 'Vanderbilt', conference: 'SEC' },
  { rank: 12, team: 'TCU', conference: 'Big 12' },
  { rank: 13, team: 'Clemson', conference: 'ACC' },
  { rank: 14, team: 'North Carolina', conference: 'ACC' },
  { rank: 15, team: 'Kentucky', conference: 'SEC' },
  { rank: 16, team: 'Georgia', conference: 'SEC' },
  { rank: 17, team: 'Oklahoma', conference: 'SEC' },
  { rank: 18, team: 'South Carolina', conference: 'SEC' },
  { rank: 19, team: 'Florida State', conference: 'ACC' },
  { rank: 20, team: 'Ole Miss', conference: 'SEC' },
  { rank: 21, team: 'NC State', conference: 'ACC' },
  { rank: 22, team: 'Alabama', conference: 'SEC' },
  { rank: 23, team: 'Dallas Baptist', conference: 'WAC' },
  { rank: 24, team: 'Cal', conference: 'ACC' },
  { rank: 25, team: 'Arizona', conference: 'Big 12' },
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

const scheduleConferenceFilters: PowerConference[] = [
  'All P4',
  'SEC',
  'ACC',
  'Big 12',
  'Big Ten',
];

function parseScheduleMeta(
  payload: unknown,
  normalized: NormalizedSchedulePayload,
  headers: Headers
): ScheduleMeta {
  const bodyMeta =
    payload && typeof payload === 'object' && 'meta' in payload
      ? (payload.meta as Record<string, unknown>)
      : undefined;

  const bodySource = typeof bodyMeta?.dataSource === 'string' ? bodyMeta.dataSource : undefined;
  const bodyLastUpdated =
    typeof bodyMeta?.lastUpdated === 'string' ? bodyMeta.lastUpdated : undefined;

  return {
    dataSource: bodySource || headers.get('x-data-source') || normalized.meta.dataSource || 'NCAA/ESPN',
    lastUpdated:
      bodyLastUpdated ||
      headers.get('x-last-updated') ||
      normalized.meta.lastUpdated ||
      new Date().toISOString(),
    timezone: 'America/Chicago',
  };
}

function getRelativeDateLabel(isoDate: string): string {
  const today = toIsoDate(new Date());
  if (isoDate === today) return 'Today';
  if (isoDate === shiftIsoDate(today, -1)) return 'Yesterday';
  if (isoDate === shiftIsoDate(today, 1)) return 'Tomorrow';
  return formatDatePill(isoDate);
}

function ScheduleGameCard({ game }: { game: ScheduleGame }) {
  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';
  const isScheduled = game.status === 'scheduled';
  const awayWon = isFinal && (game.awayTeam.score ?? 0) > (game.homeTeam.score ?? 0);
  const homeWon = isFinal && (game.homeTeam.score ?? 0) > (game.awayTeam.score ?? 0);

  return (
    <Link href={`/college-baseball/game/${game.id}`} className="block">
      <div
        className={`bg-graphite rounded-lg border transition-all hover:border-burnt-orange hover:bg-white/5 ${
          isLive ? 'border-success' : 'border-border-subtle'
        }`}
      >
        <div
          className={`px-4 py-2 rounded-t-lg flex items-center justify-between ${
            isLive ? 'bg-success/20' : isFinal ? 'bg-charcoal' : 'bg-burnt-orange/20'
          }`}
        >
          <span
            className={`text-xs font-semibold uppercase ${
              isLive ? 'text-success' : isFinal ? 'text-text-tertiary' : 'text-burnt-orange'
            }`}
          >
            {isLive ? (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                {game.situation || 'Live'}
              </span>
            ) : isFinal ? (
              'Final'
            ) : game.status === 'postponed' ? (
              'Postponed'
            ) : game.status === 'canceled' ? (
              'Canceled'
            ) : (
              game.time
            )}
          </span>
          <Badge variant="default" className="text-xs">
            {game.homeTeam.conference || game.awayTeam.conference || 'NCAA'}
          </Badge>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-charcoal rounded-full flex items-center justify-center text-xs font-bold text-burnt-orange">
                {game.awayTeam.shortName?.slice(0, 3).toUpperCase() || 'AWY'}
              </div>
              <div>
                <p className={`font-semibold ${awayWon ? 'text-white' : 'text-text-secondary'}`}>
                  {game.awayTeam.name}
                </p>
                <p className="text-xs text-text-tertiary">
                  {game.awayTeam.record.wins}-{game.awayTeam.record.losses}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {awayWon && (
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-success" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              )}
              <span
                className={`text-2xl font-bold font-mono ${
                  isScheduled
                    ? 'text-text-tertiary'
                    : awayWon
                      ? 'text-white'
                      : 'text-text-secondary'
                }`}
              >
                {game.awayTeam.score !== null ? game.awayTeam.score : '-'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-charcoal rounded-full flex items-center justify-center text-xs font-bold text-burnt-orange">
                {game.homeTeam.shortName?.slice(0, 3).toUpperCase() || 'HME'}
              </div>
              <div>
                <p className={`font-semibold ${homeWon ? 'text-white' : 'text-text-secondary'}`}>
                  {game.homeTeam.name}
                </p>
                <p className="text-xs text-text-tertiary">
                  {game.homeTeam.record.wins}-{game.homeTeam.record.losses}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {homeWon && (
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-success" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              )}
              <span
                className={`text-2xl font-bold font-mono ${
                  isScheduled
                    ? 'text-text-tertiary'
                    : homeWon
                      ? 'text-white'
                      : 'text-text-secondary'
                }`}
              >
                {game.homeTeam.score !== null ? game.homeTeam.score : '-'}
              </span>
            </div>
          </div>
        </div>

        {game.venue && game.venue !== 'TBD' && (
          <div className="px-4 pb-3 text-xs text-text-tertiary border-t border-border-subtle pt-3">
            {game.venue}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function CollegeBaseballPage() {
  const [activeTab, setActiveTab] = useState<TabType>('rankings');
  const [rankings, setRankings] = useState<RankedTeam[]>(defaultRankings);
  const [standings, setStandings] = useState<StandingsTeam[]>([]);
  const [scheduleGames, setScheduleGames] = useState<ScheduleGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [scheduleMeta, setScheduleMeta] = useState<ScheduleMeta | null>(null);
  const [hasLiveGames, setHasLiveGames] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(toIsoDate(new Date()));
  const [selectedConference, setSelectedConference] = useState<PowerConference>('All P4');
  const [scheduleInitialized, setScheduleInitialized] = useState(false);
  const scheduleCacheRef = useRef<Map<string, NormalizedSchedulePayload>>(new Map());

  const fetchRankings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ncaa/rankings?sport=baseball');
      if (!res.ok) throw new Error('Failed to fetch rankings');
      const data = (await res.json()) as { rankings?: RankedTeam[]; meta?: { lastUpdated?: string } };
      if (data.rankings?.length) setRankings(data.rankings);
      setLastUpdated(data.meta?.lastUpdated || '');
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
      const data = (await res.json()) as {
        standings?: StandingsTeam[];
        teams?: StandingsTeam[];
        meta?: { lastUpdated?: string };
      };
      setStandings((data.standings || data.teams || []) as StandingsTeam[]);
      setLastUpdated(data.meta?.lastUpdated || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadScheduleForDate = useCallback(async (date: string): Promise<NormalizedSchedulePayload> => {
    const cachedPayload = scheduleCacheRef.current.get(date);
    if (cachedPayload) return cachedPayload;

    const res = await fetch(`/api/college-baseball/schedule?date=${date}`);
    if (!res.ok) throw new Error('Failed to fetch schedule');

    const payload = (await res.json()) as unknown;
    const normalized = normalizeSchedulePayload(payload, res.headers);
    const finalMeta = parseScheduleMeta(payload, normalized, res.headers);

    const result: NormalizedSchedulePayload = {
      ...normalized,
      meta: finalMeta,
    };

    scheduleCacheRef.current.set(date, result);
    return result;
  }, []);

  const fetchSchedule = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const payload = await loadScheduleForDate(date);
      setScheduleGames(payload.games);
      setScheduleMeta(payload.meta);
      setHasLiveGames(payload.games.some((game) => game.status === 'live'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setScheduleGames([]);
      setHasLiveGames(false);
    } finally {
      setLoading(false);
    }
  }, [loadScheduleForDate]);

  useEffect(() => {
    if (activeTab === 'rankings') fetchRankings();
    else if (activeTab === 'standings') fetchStandings();
  }, [activeTab, fetchRankings, fetchStandings]);

  useEffect(() => {
    if (activeTab !== 'schedule' || scheduleInitialized) return;

    let mounted = true;
    const initSchedule = async () => {
      setLoading(true);
      setError(null);
      const today = toIsoDate(new Date());

      try {
        const firstDateWithGames = await findNextGameDate({
          startDate: today,
          maxDays: 7,
          loadGamesForDate: async (candidateDate) => {
            const payload = await loadScheduleForDate(candidateDate);
            return filterGamesByConference(payload.games, selectedConference);
          },
        });

        if (!mounted) return;
        setSelectedDate(firstDateWithGames);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!mounted) return;
        setScheduleInitialized(true);
        setLoading(false);
      }
    };

    initSchedule();

    return () => {
      mounted = false;
    };
  }, [activeTab, loadScheduleForDate, scheduleInitialized, selectedConference]);

  useEffect(() => {
    if (activeTab !== 'schedule' || !scheduleInitialized) return;
    fetchSchedule(selectedDate);
  }, [activeTab, fetchSchedule, scheduleInitialized, selectedDate]);

  useEffect(() => {
    if (activeTab !== 'schedule' || !hasLiveGames || !scheduleInitialized) return;

    const interval = setInterval(async () => {
      scheduleCacheRef.current.delete(selectedDate);
      await fetchSchedule(selectedDate);
    }, 30000);

    return () => clearInterval(interval);
  }, [activeTab, fetchSchedule, hasLiveGames, scheduleInitialized, selectedDate]);

  const dateOptions = useMemo(
    () =>
      [-2, -1, 0, 1, 2].map((offset) => {
        const date = shiftIsoDate(selectedDate, offset);
        return {
          offset,
          date,
          label: getRelativeDateLabel(date),
        };
      }),
    [selectedDate]
  );

  const filteredScheduleGames = useMemo(
    () => filterGamesByConference(scheduleGames, selectedConference),
    [scheduleGames, selectedConference]
  );

  const groupedScheduleGames = useMemo(
    () => groupGamesByStatus(filteredScheduleGames),
    [filteredScheduleGames]
  );

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
                  source={scheduleMeta?.dataSource || 'NCAA/ESPN'}
                  lastUpdated={
                    scheduleMeta?.lastUpdated ? new Date(scheduleMeta.lastUpdated) : undefined
                  }
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
                  <Link href="/college-baseball/games">
                    <Button variant="primary" size="lg">
                      View Live Games
                    </Button>
                  </Link>
                  <Link href="/college-baseball/standings">
                    <Button variant="secondary" size="lg">
                      Conference Standings
                    </Button>
                  </Link>
                </div>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={300}>
                <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl">
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

          <Section padding="lg" background="charcoal" borderTop>
            <Container>
              <div className="mb-8">
                <Link href="/college-baseball/editorial/week-1-preview" className="block">
                  <Card
                    variant="hover"
                    padding="lg"
                    className="border-[#BF5700]/30 bg-gradient-to-r from-[#BF5700]/20 via-[#BF5700]/10 to-transparent"
                  >
                    <div className="flex items-center justify-between gap-6 flex-wrap">
                      <div>
                        <Badge variant="primary" className="mb-3">
                          New Editorial
                        </Badge>
                        <h2 className="font-display text-2xl font-bold uppercase tracking-display text-white mb-2">
                          Opening Weekend Preview: Week 1 Power Moves
                        </h2>
                        <p className="text-white/70 max-w-3xl">
                          Shriner&apos;s Classic spotlight, Texas vs UC Davis, breakout stars, upset alerts, and
                          conference watchlists for the season launch.
                        </p>
                      </div>
                      <span className="text-[#BF5700] font-semibold">Read Feature →</span>
                    </div>
                  </Card>
                </Link>
              </div>

              <div className="flex gap-2 mb-8 border-b border-white/10 overflow-x-auto pb-px">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                      activeTab === tab.id
                        ? 'text-[#BF5700] border-[#BF5700]'
                        : 'text-white/40 border-transparent hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

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
                        <table className="w-full">
                          <tbody>
                            {Array.from({ length: 25 }).map((_, i) => (
                              <SkeletonTableRow key={i} columns={4} />
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b-2 border-[#BF5700]">
                                {['Rank', 'Team', 'Conference', 'Record'].map((h) => (
                                  <th key={h} className="text-left p-3 text-white/40 font-semibold text-xs">
                                    {h}
                                  </th>
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
                        <Link href="/college-baseball/preseason/power-25" className="text-sm text-[#BF5700] hover:text-[#FF6B35] transition-colors">
                          Full Rankings →
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              )}

              {activeTab === 'standings' && (
                <>
                  {loading ? (
                    <Card variant="default" padding="lg">
                      <CardContent>
                        <table className="w-full">
                          <tbody>
                            {Array.from({ length: 10 }).map((_, i) => (
                              <SkeletonTableRow key={i} columns={6} />
                            ))}
                          </tbody>
                        </table>
                      </CardContent>
                    </Card>
                  ) : error ? (
                    <Card variant="default" padding="lg" className="bg-red-500/10 border-red-500/30">
                      <p className="text-red-400 font-semibold">Data Unavailable</p>
                      <p className="text-white/60 text-sm mt-1">{error}</p>
                      <button onClick={fetchStandings} className="mt-4 px-4 py-2 bg-[#BF5700] text-white rounded-lg">
                        Retry
                      </button>
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
                        <CardHeader>
                          <CardTitle>Conference Standings</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b-2 border-[#BF5700]">
                                  {['#', 'Team', 'Conf', 'W', 'L', 'Conf W-L'].map((h) => (
                                    <th key={h} className="text-left p-3 text-white/40 font-semibold text-xs">
                                      {h}
                                    </th>
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
                                    <td className="p-3 text-white/60">
                                      {team.conferenceWins != null
                                        ? `${team.conferenceWins}-${team.conferenceLosses}`
                                        : '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <DataSourceBadge source="NCAA / ESPN" timestamp={formatTimestamp(lastUpdated)} />
                          </div>
                        </CardContent>
                      </Card>
                    </ScrollReveal>
                  )}
                </>
              )}

              {activeTab === 'schedule' && (
                <>
                  <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                    <button
                      onClick={() => setSelectedDate(shiftIsoDate(selectedDate, -1))}
                      className="p-2 text-text-tertiary hover:text-white transition-colors"
                      aria-label="Previous day"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>

                    {dateOptions.map((option) => (
                      <button
                        key={option.date}
                        onClick={() => setSelectedDate(option.date)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                          selectedDate === option.date
                            ? 'bg-burnt-orange text-white'
                            : 'bg-graphite text-text-secondary hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}

                    <button
                      onClick={() => setSelectedDate(shiftIsoDate(selectedDate, 1))}
                      className="p-2 text-text-tertiary hover:text-white transition-colors"
                      aria-label="Next day"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-8">
                    {scheduleConferenceFilters.map((conference) => (
                      <button
                        key={conference}
                        onClick={() => setSelectedConference(conference)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedConference === conference
                            ? 'bg-burnt-orange text-white'
                            : 'bg-graphite text-text-secondary hover:text-white hover:bg-slate'
                        }`}
                      >
                        {conference}
                      </button>
                    ))}
                  </div>

                  {loading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <SkeletonScoreCard key={i} />
                      ))}
                    </div>
                  ) : error ? (
                    <Card variant="default" padding="lg" className="bg-red-500/10 border-red-500/30">
                      <p className="text-red-400 font-semibold">Schedule Unavailable</p>
                      <p className="text-white/60 text-sm mt-1">{error}</p>
                      <button
                        onClick={() => fetchSchedule(selectedDate)}
                        className="mt-4 px-4 py-2 bg-[#BF5700] text-white rounded-lg"
                      >
                        Retry
                      </button>
                    </Card>
                  ) : filteredScheduleGames.length === 0 ? (
                    <Card variant="default" padding="lg">
                      <div className="text-center py-8">
                        <p className="text-white/60">No P4 games scheduled for this date.</p>
                        <p className="text-white/30 text-sm mt-2">
                          Try another date or switch conference filters.
                        </p>
                      </div>
                    </Card>
                  ) : (
                    <div className="space-y-8">
                      {groupedScheduleGames.live.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            Live
                          </h3>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {groupedScheduleGames.live.map((game) => (
                              <ScheduleGameCard key={game.id} game={game} />
                            ))}
                          </div>
                        </div>
                      )}

                      {groupedScheduleGames.upcoming.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-4">Upcoming</h3>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {groupedScheduleGames.upcoming.map((game) => (
                              <ScheduleGameCard key={game.id} game={game} />
                            ))}
                          </div>
                        </div>
                      )}

                      {groupedScheduleGames.final.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-4">Final</h3>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {groupedScheduleGames.final.map((game) => (
                              <ScheduleGameCard key={game.id} game={game} />
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-4">
                        <DataSourceBadge
                          source={scheduleMeta?.dataSource || 'NCAA/ESPN'}
                          timestamp={formatTimestamp(scheduleMeta?.lastUpdated)}
                        />
                        <div className="flex items-center gap-4">
                          {hasLiveGames && (
                            <RefreshIndicator active={hasLiveGames} intervalSeconds={30} />
                          )}
                          <Link
                            href="/college-baseball/scores"
                            className="text-sm text-[#BF5700] hover:text-[#FF6B35] transition-colors"
                          >
                            View Full Scoreboard →
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

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
                    <Link href="/college-baseball/teams">
                      <Button variant="primary">Browse All Teams</Button>
                    </Link>
                  </div>
                </div>
              )}

              {activeTab === 'players' && (
                <Card variant="default" padding="lg">
                  <CardHeader>
                    <CardTitle>Player Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/60 mb-4">
                      Search D1 baseball players for stats, draft projections, and transfer portal activity.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Link href="/college-baseball/players">
                        <Button variant="primary">Browse Players</Button>
                      </Link>
                      <Link href="/college-baseball/transfer-portal">
                        <Button variant="secondary">Transfer Portal</Button>
                      </Link>
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
