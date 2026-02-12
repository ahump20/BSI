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
import { Skeleton, SkeletonTableRow, SkeletonScoreCard } from '@/components/ui/Skeleton';
import { DataFreshnessIndicator } from '@/components/ui/DataFreshnessIndicator';
import { formatTimestamp } from '@/lib/utils/timezone';

interface Team {
  teamName: string;
  wins: number;
  losses: number;
  winPercentage: number;
  conference: string;
  division?: string;
  gamesBack?: number;
  streak?: string;
  ppg?: number;
  oppg?: number;
}

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

type TabType = 'standings' | 'scores' | 'teams' | 'players';
export default function NBAPage() {
  const [activeTab, setActiveTab] = useState<TabType>('standings');
  const [standings, setStandings] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [hasLiveGames, setHasLiveGames] = useState(false);

  const fetchStandings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/nba/standings');
      if (!res.ok) throw new Error('Failed to fetch standings');
      const data = await res.json() as { standings?: Team[]; teams?: Team[]; meta?: { lastUpdated?: string } };
      setStandings((data.standings || data.teams || []) as Team[]);
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
      const res = await fetch('/api/nba/scoreboard');
      if (!res.ok) throw new Error('Failed to fetch scores');
      const data = await res.json() as { games?: Record<string, unknown>[]; scoreboard?: { games?: Record<string, unknown>[] }; meta?: { lastUpdated?: string } };
      const rawGames = data.games || data.scoreboard?.games || [];
      const normalized: Game[] = rawGames.map((g, i) => {
        const teams = g.teams as Record<string, Record<string, unknown>> | undefined;
        const homeTeam = (g.homeTeam || teams?.home) as Record<string, unknown> | undefined;
        const awayTeam = (g.awayTeam || teams?.away) as Record<string, unknown> | undefined;
        const status = g.status as Record<string, unknown> | string | undefined;
        const isLive = typeof status === 'object'
          ? (status?.type as Record<string, unknown>)?.state === 'in' || status?.isLive === true
          : typeof status === 'string' && status.toLowerCase().includes('in progress');
        const isFinal = typeof status === 'object'
          ? status?.isFinal === true
          : typeof status === 'string' && status.toLowerCase().includes('final');
        return {
          id: (g.id as string | number) || i,
          away: { name: (awayTeam?.name as string) || 'Away', score: Number(awayTeam?.score ?? 0) },
          home: { name: (homeTeam?.name as string) || 'Home', score: Number(homeTeam?.score ?? 0) },
          status: typeof status === 'object' ? ((status?.detailedState as string) || 'Scheduled') : ((status as string) || 'Scheduled'),
          isLive: Boolean(isLive),
          isFinal: Boolean(isFinal),
          detail: typeof status === 'object' && status?.period ? `Q${status.period}` : undefined,
          venue: (g.venue as Record<string, unknown>)?.name as string || undefined,
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
    if (activeTab === 'standings' || activeTab === 'teams') fetchStandings();
    else if (activeTab === 'scores') fetchScores();
  }, [activeTab, fetchStandings, fetchScores]);

  useEffect(() => {
    if (activeTab === 'scores' && hasLiveGames) {
      const interval = setInterval(fetchScores, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab, hasLiveGames, fetchScores]);

  const eastern = standings.filter((t) => t.conference === 'Eastern' || t.conference === 'East');
  const western = standings.filter((t) => t.conference === 'Western' || t.conference === 'West');

  const tabs: { id: TabType; label: string }[] = [
    { id: 'standings', label: 'Standings' },
    { id: 'scores', label: 'Scores' },
    { id: 'teams', label: 'Teams' },
    { id: 'players', label: 'Players' },
  ];

  return (
    <div className="bsi-theme-basketball">
      <>
        <main id="main-content">
        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-[#1D428A]/20 via-transparent to-transparent pointer-events-none" />
          <Container center>
            <ScrollReveal direction="up">
              <Badge variant="success" className="mb-4">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
                National Basketball Association
              </Badge>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-center uppercase tracking-wide mb-4">
                NBA <span className="text-gradient-blaze">Intelligence</span>
              </h1>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={120}>
              <DataFreshnessIndicator
                source="ESPN"
                refreshInterval={30}
              />
            </ScrollReveal>
            <ScrollReveal direction="up" delay={150}>
              <p className="text-[#C9A227] font-semibold text-lg tracking-wide text-center mb-4">
                Grizzlies. Mavericks. Thunder. Every game, every stat, no network filter.
              </p>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={200}>
              <p className="text-white/60 text-center max-w-2xl mx-auto mb-8">
                Live scores, conference standings, and analytics for all 30 teams.
              </p>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={250}>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/nba/games"><Button variant="primary" size="lg">Live Scores</Button></Link>
                <Link href="/nba/standings"><Button variant="secondary" size="lg">Standings</Button></Link>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={300}>
              <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl">
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-[#BF5700]">30</div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mt-1">NBA Teams</div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-[#BF5700]">82</div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mt-1">Games/Season</div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-[#BF5700]">Live</div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mt-1">Real-Time Scores</div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-[#BF5700]">PER</div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mt-1">Advanced Data</div>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Tabs and Content */}
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

            {/* Standings Tab */}
            {activeTab === 'standings' && (
              <>
                {loading ? (
                  <div className="space-y-6">
                    {[1, 2].map((i) => (
                      <Card key={i} variant="default" padding="lg">
                        <CardHeader><Skeleton variant="text" width={200} height={24} /></CardHeader>
                        <CardContent><table className="w-full"><tbody>{[1, 2, 3, 4, 5].map((j) => <SkeletonTableRow key={j} columns={7} />)}</tbody></table></CardContent>
                      </Card>
                    ))}
                  </div>
                ) : error ? (
                  <Card variant="default" padding="lg" className="bg-red-500/10 border-red-500/30">
                    <p className="text-red-400 font-semibold">Data Unavailable</p>
                    <p className="text-white/60 text-sm mt-1">{error}</p>
                    <button onClick={fetchStandings} className="mt-4 px-4 py-2 bg-[#BF5700] text-white rounded-lg">Retry</button>
                  </Card>
                ) : standings.length === 0 ? (
                  <Card variant="default" padding="lg">
                    <div className="text-center py-8">
                      <p className="text-white/60">Offseason -- no standings yet.</p>
                    </div>
                  </Card>
                ) : (
                  [{ label: 'Eastern Conference', teams: eastern }, { label: 'Western Conference', teams: western }]
                    .filter((conf) => conf.teams.length > 0)
                    .map((conf) => (
                      <ScrollReveal key={conf.label}>
                        <Card variant="default" padding="lg" className="mb-6">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                              <Image src="/icons/basketball.svg" alt="" width={20} height={20} className="opacity-60" />
                              {conf.label}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b-2 border-[#BF5700]">
                                    {['#', 'Team', 'W', 'L', 'PCT', 'GB', 'STRK'].map((h) => (
                                      <th key={h} className="text-left p-3 text-white/40 font-semibold text-xs">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {conf.teams.sort((a, b) => b.wins - a.wins).map((team, idx) => (
                                    <tr key={team.teamName} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                      <td className="p-3 text-[#BF5700] font-bold">{idx + 1}</td>
                                      <td className="p-3 font-semibold text-white">{team.teamName}</td>
                                      <td className="p-3 text-white/60">{team.wins}</td>
                                      <td className="p-3 text-white/60">{team.losses}</td>
                                      <td className="p-3 text-white/60">{team.winPercentage.toFixed(3).replace('0.', '.')}</td>
                                      <td className="p-3 text-white/60">{team.gamesBack != null ? (team.gamesBack === 0 ? '-' : team.gamesBack.toFixed(1)) : '-'}</td>
                                      <td className="p-3 text-white/60">{team.streak || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/10">
                              <DataSourceBadge source="NBA.com / ESPN" timestamp={formatTimestamp(lastUpdated)} />
                            </div>
                          </CardContent>
                        </Card>
                      </ScrollReveal>
                    ))
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
                                  <span className="font-semibold text-white">{game.away.name}</span>
                                  <span className="ml-auto text-[#BF5700] font-bold text-lg">{game.away.score}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white">{game.home.name}</span>
                                  <span className="ml-auto text-[#BF5700] font-bold text-lg">{game.home.score}</span>
                                </div>
                              </div>
                              <div className="ml-6 text-right min-w-[80px]">
                                {game.isLive ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                    <span className="text-green-400 font-semibold text-sm">{game.detail || 'Live'}</span>
                                  </div>
                                ) : (
                                  <span className={`font-semibold text-sm ${game.isFinal ? 'text-white/30' : 'text-[#BF5700]'}`}>{game.status}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <DataSourceBadge source="NBA.com / ESPN" timestamp={formatTimestamp(lastUpdated)} />
                          {hasLiveGames && <span className="text-xs text-white/30 ml-4">Auto-refreshing every 30 seconds</span>}
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                )}
              </>
            )}

            {/* Teams Tab */}
            {activeTab === 'teams' && (
              <div className="grid gap-6 md:grid-cols-2">
                {[{ label: 'Eastern Conference', teams: eastern }, { label: 'Western Conference', teams: western }].map((conf) => (
                  <div key={conf.label}>
                    <h3 className="text-xl font-display font-bold text-[#BF5700] mb-4">{conf.label}</h3>
                    <div className="space-y-2">
                      {conf.teams.sort((a, b) => b.wins - a.wins).map((team) => (
                        <Link key={team.teamName} href={`/nba/teams/${team.teamName.toLowerCase().replace(/\s+/g, '-')}`}>
                          <Card variant="hover" padding="sm" className="flex items-center justify-between px-4 py-3">
                            <span className="font-medium text-white">{team.teamName}</span>
                            <span className="text-sm text-white/40">{team.wins}-{team.losses}</span>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Players Tab */}
            {activeTab === 'players' && (
              <Card variant="default" padding="lg">
                <CardHeader><CardTitle>Player Statistics</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-white/60 mb-4">Search NBA players for detailed stats and profiles.</p>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/nba/players"><Button variant="primary">Browse All Players</Button></Link>
                    <Link href="/nba/standings"><Button variant="secondary">View Standings</Button></Link>
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
