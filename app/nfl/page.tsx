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

interface Team {
  teamName: string;
  wins: number;
  losses: number;
  ties?: number;
  winPercentage: number;
  division: string;
  conference: string;
  pointsFor?: number;
  pointsAgainst?: number;
  streak?: string;
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

const DIVISION_ORDER = [
  'AFC East', 'AFC North', 'AFC South', 'AFC West',
  'NFC East', 'NFC North', 'NFC South', 'NFC West',
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

export default function NFLPage() {
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
      const res = await fetch('/api/nfl/standings');
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
      const res = await fetch('/api/nfl/scores');
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

  const standingsByDivision: Record<string, Team[]> = {};
  standings.forEach((team) => {
    const key = `${team.conference} ${team.division}`;
    if (!standingsByDivision[key]) standingsByDivision[key] = [];
    standingsByDivision[key].push(team);
  });
  Object.values(standingsByDivision).forEach((div) => div.sort((a, b) => b.wins - a.wins));

  const tabs: { id: TabType; label: string }[] = [
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
          <div className="absolute inset-0 bg-gradient-radial from-[#013369]/20 via-transparent to-transparent pointer-events-none" />
          <Container center>
            <ScrollReveal direction="up">
              <Badge variant="success" className="mb-4">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
                National Football League
              </Badge>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-center uppercase tracking-wide mb-4">
                NFL <span className="text-gradient-blaze">Intelligence</span>
              </h1>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={150}>
              <p className="text-[#C9A227] font-semibold text-lg tracking-wide text-center mb-4">
                Titans. Cowboys. Chiefs. Every game, every stat, no network filter.
              </p>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={200}>
              <p className="text-white/60 text-center max-w-2xl mx-auto mb-8">
                Live scores, conference standings, and analytics for all 32 teams -- pulled from ESPN and official NFL data.
              </p>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={250}>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/nfl/standings"><Button variant="primary" size="lg">View Standings</Button></Link>
                <Link href="/nfl/games"><Button variant="secondary" size="lg">Game Scores</Button></Link>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={300}>
              <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl">
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-[#BF5700]">32</div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mt-1">NFL Teams</div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-[#BF5700]">18</div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mt-1">Week Season</div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-[#BF5700]">Live</div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mt-1">Real-Time Scores</div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-[#BF5700]">EPA</div>
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

            {/* Standings Tab */}
            {activeTab === 'standings' && (
              <>
                {loading ? (
                  <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} variant="default" padding="lg">
                        <CardHeader><Skeleton variant="text" width={200} height={24} /></CardHeader>
                        <CardContent>
                          <table className="w-full"><thead><tr className="border-b-2 border-[#BF5700]">
                            {['#', 'Team', 'W', 'L', 'T', 'PCT', 'PF', 'PA'].map((h) => (
                              <th key={h} className="text-left p-3 text-white/40 font-semibold text-xs">{h}</th>
                            ))}
                          </tr></thead><tbody>{[1, 2, 3, 4].map((j) => <SkeletonTableRow key={j} columns={8} />)}</tbody></table>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : error ? (
                  <Card variant="default" padding="lg" className="bg-red-500/10 border-red-500/30">
                    <p className="text-red-400 font-semibold">Data Unavailable</p>
                    <p className="text-white/60 text-sm mt-1">{error}</p>
                    <button onClick={fetchStandings} className="mt-4 px-4 py-2 bg-[#BF5700] text-white rounded-lg hover:bg-[#BF5700]/80 transition-colors">Retry</button>
                  </Card>
                ) : standings.length === 0 ? (
                  <Card variant="default" padding="lg">
                    <div className="text-center py-8">
                      <p className="text-white/60">Offseason -- no standings yet.</p>
                      <p className="text-white/30 text-sm mt-2">Check back in September when the real season kicks off.</p>
                    </div>
                  </Card>
                ) : (
                  DIVISION_ORDER.filter((div) => standingsByDivision[div]?.length > 0).map((division) => (
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
                                <tr className="border-b-2 border-[#BF5700]">
                                  {['#', 'Team', 'W', 'L', 'T', 'PCT', 'PF', 'PA'].map((h) => (
                                    <th key={h} className="text-left p-3 text-white/40 font-semibold text-xs">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {standingsByDivision[division].map((team, idx) => (
                                  <tr key={team.teamName} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-3 text-[#BF5700] font-bold">{idx + 1}</td>
                                    <td className="p-3 font-semibold text-white">{team.teamName}</td>
                                    <td className="p-3 text-white/60">{team.wins}</td>
                                    <td className="p-3 text-white/60">{team.losses}</td>
                                    <td className="p-3 text-white/60">{team.ties || 0}</td>
                                    <td className="p-3 text-white/60">{team.winPercentage.toFixed(3).replace('0.', '.')}</td>
                                    <td className="p-3 text-white/60">{team.pointsFor || '-'}</td>
                                    <td className="p-3 text-white/60">{team.pointsAgainst || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <DataSourceBadge source="ESPN / NFL" timestamp={formatTimestamp(lastUpdated)} />
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
                    <button onClick={fetchScores} className="mt-4 px-4 py-2 bg-[#BF5700] text-white rounded-lg hover:bg-[#BF5700]/80 transition-colors">Retry</button>
                  </Card>
                ) : games.length === 0 ? (
                  <Card variant="default" padding="lg">
                    <div className="text-center py-8">
                      <p className="text-white/60">No games today.</p>
                      <p className="text-white/30 text-sm mt-2">Check back on game day -- Sundays, Mondays, Thursdays.</p>
                    </div>
                  </Card>
                ) : (
                  <ScrollReveal>
                    <Card variant="default" padding="lg">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>This Week&apos;s Games</span>
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
                                  <span className={`font-semibold text-sm ${game.isFinal ? 'text-white/30' : 'text-[#BF5700]'}`}>
                                    {game.status}
                                  </span>
                                )}
                                {game.venue && <div className="text-xs text-white/30 mt-1">{game.venue}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <DataSourceBadge source="ESPN / NFL" timestamp={formatTimestamp(lastUpdated)} />
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
                {['AFC', 'NFC'].map((conf) => (
                  <div key={conf}>
                    <h3 className="text-xl font-display font-bold text-[#BF5700] mb-4">{conf}</h3>
                    <div className="space-y-3">
                      {DIVISION_ORDER.filter((d) => d.startsWith(conf)).map((div) => (
                        <Card key={div} variant="default" padding="md">
                          <h4 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">{div}</h4>
                          <div className="flex flex-wrap gap-2">
                            {(standingsByDivision[div] || []).map((team) => (
                              <Link key={team.teamName} href={`/nfl/teams/${team.teamName.toLowerCase().replace(/\s+/g, '-')}`}>
                                <Badge variant="secondary" className="text-sm hover:bg-[#BF5700] hover:text-white transition-colors cursor-pointer">
                                  {team.teamName} ({team.wins}-{team.losses})
                                </Badge>
                              </Link>
                            ))}
                          </div>
                        </Card>
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
                  <p className="text-white/60 mb-4">Search NFL players for detailed stats and profiles.</p>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/nfl/players"><Button variant="primary">Browse All Players</Button></Link>
                    <Link href="/nfl/standings"><Button variant="secondary">View Standings</Button></Link>
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
