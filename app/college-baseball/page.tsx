'use client';

import { useState, useEffect, useCallback } from 'react';
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

interface Game {
  id: string | number;
  status: string;
  isLive: boolean;
  isFinal: boolean;
  away: { name: string; score: number };
  home: { name: string; score: number };
}

type TabType = 'rankings' | 'standings' | 'scores' | 'teams' | 'players';

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

function formatTimestamp(isoString?: string): string {
  const date = isoString ? new Date(isoString) : new Date();
  return (
    date.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    }) + ' CT'
  );
}

export default function CollegeBaseballPage() {
  const [activeTab, setActiveTab] = useState<TabType>('rankings');
  const [rankings, setRankings] = useState<RankedTeam[]>(defaultRankings);
  const [standings, setStandings] = useState<StandingsTeam[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [hasLiveGames, setHasLiveGames] = useState(false);

  const fetchRankings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ncaa/rankings?sport=baseball');
      if (!res.ok) throw new Error('Failed to fetch rankings');
      const data = await res.json() as { rankings?: RankedTeam[]; meta?: { lastUpdated?: string } };
      if (data.rankings?.length) setRankings(data.rankings);
      setLastUpdated(data.meta?.lastUpdated || new Date().toISOString());
    } catch {
      // Keep default rankings
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
      const data = await res.json() as { standings?: StandingsTeam[]; teams?: StandingsTeam[]; meta?: { lastUpdated?: string } };
      setStandings((data.standings || data.teams || []) as StandingsTeam[]);
      setLastUpdated(data.meta?.lastUpdated || new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchScores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/college-baseball/scores');
      if (!res.ok) throw new Error('Failed to fetch scores');
      const data = await res.json() as { games?: Record<string, unknown>[]; meta?: { lastUpdated?: string } };
      const rawGames = data.games || [];
      const normalized: Game[] = rawGames.map((g, i) => {
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
        };
      });
      setGames(normalized);
      setHasLiveGames(normalized.some((g) => g.isLive));
      setLastUpdated(data.meta?.lastUpdated || new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'rankings') fetchRankings();
    else if (activeTab === 'standings') fetchStandings();
    else if (activeTab === 'scores') fetchScores();
  }, [activeTab, fetchRankings, fetchStandings, fetchScores]);

  useEffect(() => {
    if (activeTab === 'scores' && hasLiveGames) {
      const interval = setInterval(fetchScores, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab, hasLiveGames, fetchScores]);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'rankings', label: 'Rankings' },
    { id: 'standings', label: 'Standings' },
    { id: 'scores', label: 'Scores' },
    { id: 'teams', label: 'Teams' },
    { id: 'players', label: 'Players' },
  ];

  return (
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
                          <DataSourceBadge source="NCAA / D1Baseball" timestamp={formatTimestamp(lastUpdated)} />
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                )}
              </>
            )}

            {/* Scores Tab */}
            {activeTab === 'scores' && (
              <>
                {loading ? (
                  <div className="space-y-4">{[1, 2, 3, 4].map((i) => <SkeletonScoreCard key={i} />)}</div>
                ) : error ? (
                  <Card variant="default" padding="lg" className="bg-red-500/10 border-red-500/30">
                    <p className="text-red-400 font-semibold">Data Unavailable</p>
                    <p className="text-white/60 text-sm mt-1">{error}</p>
                    <button onClick={fetchScores} className="mt-4 px-4 py-2 bg-[#BF5700] text-white rounded-lg">Retry</button>
                  </Card>
                ) : games.length === 0 ? (
                  <Card variant="default" padding="lg">
                    <div className="text-center py-8">
                      <p className="text-white/60">No games today.</p>
                      <p className="text-white/30 text-sm mt-2">D1 baseball season runs February through June.</p>
                    </div>
                  </Card>
                ) : (
                  <ScrollReveal>
                    <Card variant="default" padding="lg">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Today&apos;s Games</span>
                          {hasLiveGames && <LiveBadge />}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {games.map((game) => (
                            <div key={game.id} className={`bg-white/5 rounded-lg p-4 flex justify-between items-center border ${game.isLive ? 'border-green-500/30' : 'border-transparent'}`}>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-semibold text-white text-sm">{game.away.name}</span>
                                  <span className="ml-auto text-[#BF5700] font-bold text-lg">{game.away.score}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white text-sm">{game.home.name}</span>
                                  <span className="ml-auto text-[#BF5700] font-bold text-lg">{game.home.score}</span>
                                </div>
                              </div>
                              <div className="ml-4 text-right">
                                {game.isLive ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                    <span className="text-green-400 font-semibold text-sm">Live</span>
                                  </div>
                                ) : (
                                  <span className={`font-semibold text-sm ${game.isFinal ? 'text-white/30' : 'text-[#BF5700]'}`}>{game.status}</span>
                                )}
                              </div>
                            </div>
                          ))}
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
  );
}
