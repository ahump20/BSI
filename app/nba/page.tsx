'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal, IntelTicker } from '@/components/cinematic';
import { Navbar, Footer } from '@/components/layout-ds';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'MLB', href: '/mlb' },
  { label: 'NFL', href: '/nfl' },
  { label: 'NBA', href: '/nba' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'About', href: '/about' },
  { label: 'Pricing', href: '/pricing' },
];

type Tab = 'standings' | 'scores' | 'teams';

interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logo?: string;
  wins: number;
  losses: number;
  record: {
    wins: number;
    losses: number;
    winningPercentage: string;
    displayRecord: string;
  };
  standings: {
    gamesBack: string;
    streak: string;
    clinched: boolean;
  };
  stats: {
    pointsFor: number;
    pointsAgainst: number;
    pointDifferential: number;
    conferenceRecord: string;
    divisionRecord: string;
    homeRecord: string;
    roadRecord: string;
    lastTenRecord: string;
  };
}

interface Division {
  name: string;
  abbreviation: string;
  teams: Team[];
}

interface Conference {
  name: string;
  abbreviation: string;
  divisions: Division[];
}

interface Game {
  id: string;
  date: string;
  name: string;
  shortName: string;
  status: {
    type: string;
    state: string;
    completed: boolean;
    detail: string;
    shortDetail: string;
    period: number;
    clock: string;
    isFinal: boolean;
    isLive: boolean;
  };
  teams: {
    away: {
      team: string;
      abbreviation: string;
      logo?: string;
      score: number;
      record: string;
      winner: boolean;
    };
    home: {
      team: string;
      abbreviation: string;
      logo?: string;
      score: number;
      record: string;
      winner: boolean;
    };
  };
  venue: {
    name: string;
    city: string;
    state: string;
  };
  broadcast: string;
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success">
      <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
      LIVE
    </span>
  );
}

function DataSourceBadge({ source }: { source: string }) {
  return <span className="text-xs text-white/40">Data: {source}</span>;
}

function StandingsTable({ conference }: { conference: Conference }) {
  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-display text-white">{conference.name}</h3>

      {conference.divisions.map((division) => (
        <div key={division.name} className="overflow-x-auto">
          <h4 className="text-lg font-semibold text-burnt-orange mb-3">{division.name}</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/60">
                <th className="text-left py-3 px-2">Team</th>
                <th className="text-center py-3 px-2">W</th>
                <th className="text-center py-3 px-2">L</th>
                <th className="text-center py-3 px-2">PCT</th>
                <th className="text-center py-3 px-2">GB</th>
                <th className="text-center py-3 px-2 hidden md:table-cell">STRK</th>
                <th className="text-center py-3 px-2 hidden lg:table-cell">L10</th>
                <th className="text-center py-3 px-2 hidden lg:table-cell">HOME</th>
                <th className="text-center py-3 px-2 hidden lg:table-cell">AWAY</th>
              </tr>
            </thead>
            <tbody>
              {division.teams.map((team, idx) => (
                <tr
                  key={team.id}
                  className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                    team.name === 'Memphis Grizzlies' ? 'bg-burnt-orange/10' : ''
                  }`}
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-3">
                      <span className="text-white/40 w-4">{idx + 1}</span>
                      {team.logo && (
                        <img src={team.logo} alt={team.name} className="w-6 h-6 object-contain" />
                      )}
                      <span className="text-white font-medium">
                        {team.name}
                        {team.standings.clinched && (
                          <span className="ml-2 text-xs text-success">x</span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-2 text-white">{team.wins}</td>
                  <td className="text-center py-3 px-2 text-white">{team.losses}</td>
                  <td className="text-center py-3 px-2 text-white">
                    {team.record.winningPercentage}
                  </td>
                  <td className="text-center py-3 px-2 text-white/60">
                    {team.standings.gamesBack}
                  </td>
                  <td className="text-center py-3 px-2 hidden md:table-cell">
                    <span
                      className={
                        team.standings.streak?.startsWith('W') ? 'text-success' : 'text-error'
                      }
                    >
                      {team.standings.streak}
                    </span>
                  </td>
                  <td className="text-center py-3 px-2 text-white/60 hidden lg:table-cell">
                    {team.stats.lastTenRecord}
                  </td>
                  <td className="text-center py-3 px-2 text-white/60 hidden lg:table-cell">
                    {team.stats.homeRecord}
                  </td>
                  <td className="text-center py-3 px-2 text-white/60 hidden lg:table-cell">
                    {team.stats.roadRecord}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function GameCard({ game }: { game: Game }) {
  const { teams, status, venue, broadcast } = game;

  return (
    <Card className="p-4">
      {/* Status */}
      <div className="flex items-center justify-between mb-3">
        {status.isLive ? (
          <div className="flex items-center gap-2">
            <LiveBadge />
            <span className="text-sm text-white/60">
              Q{status.period} {status.clock}
            </span>
          </div>
        ) : status.isFinal ? (
          <Badge variant="default">Final</Badge>
        ) : (
          <span className="text-sm text-white/60">{status.shortDetail}</span>
        )}
        {broadcast !== 'N/A' && <span className="text-xs text-white/40">{broadcast}</span>}
      </div>

      {/* Teams */}
      <div className="space-y-2">
        {/* Away Team */}
        <div
          className={`flex items-center justify-between ${
            status.isFinal && teams.away.winner ? 'text-white' : 'text-white/70'
          }`}
        >
          <div className="flex items-center gap-3">
            {teams.away.logo && (
              <img src={teams.away.logo} alt={teams.away.team} className="w-8 h-8 object-contain" />
            )}
            <div>
              <span className="font-medium">{teams.away.team}</span>
              <span className="text-xs text-white/40 ml-2">({teams.away.record})</span>
            </div>
          </div>
          <span
            className={`text-xl font-display ${
              status.isFinal && teams.away.winner ? 'text-white' : ''
            }`}
          >
            {teams.away.score}
          </span>
        </div>

        {/* Home Team */}
        <div
          className={`flex items-center justify-between ${
            status.isFinal && teams.home.winner ? 'text-white' : 'text-white/70'
          }`}
        >
          <div className="flex items-center gap-3">
            {teams.home.logo && (
              <img src={teams.home.logo} alt={teams.home.team} className="w-8 h-8 object-contain" />
            )}
            <div>
              <span className="font-medium">{teams.home.team}</span>
              <span className="text-xs text-white/40 ml-2">({teams.home.record})</span>
            </div>
          </div>
          <span
            className={`text-xl font-display ${
              status.isFinal && teams.home.winner ? 'text-white' : ''
            }`}
          >
            {teams.home.score}
          </span>
        </div>
      </div>

      {/* Venue */}
      {venue.name && (
        <div className="mt-3 pt-3 border-t border-white/10 text-xs text-white/40">
          {venue.name} - {venue.city}, {venue.state}
        </div>
      )}
    </Card>
  );
}

export default function NBAPage() {
  const [activeTab, setActiveTab] = useState<Tab>('standings');
  const [standings, setStandings] = useState<Conference[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLiveGames, setHasLiveGames] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Fetch standings
  useEffect(() => {
    async function fetchStandings() {
      try {
        const res = await fetch('/api/nba/standings');
        if (!res.ok) throw new Error('Failed to fetch standings');
        const data = await res.json();
        if (data.data?.standings) {
          setStandings(data.data.standings);
        }
      } catch (err) {
        console.error('Standings error:', err);
      }
    }
    fetchStandings();
  }, []);

  // Fetch scores with auto-refresh
  useEffect(() => {
    async function fetchScores() {
      try {
        const res = await fetch('/api/nba/scores');
        if (!res.ok) throw new Error('Failed to fetch scores');
        const data = await res.json();
        if (data.data?.games) {
          setGames(data.data.games);
          setHasLiveGames(data.data.live || false);
          setLastUpdated(
            new Date().toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              timeZone: 'America/Chicago',
            })
          );
        }
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setLoading(false);
      }
    }

    fetchScores();

    // Auto-refresh every 30 seconds if there are live games
    const interval = setInterval(() => {
      if (hasLiveGames || activeTab === 'scores') {
        fetchScores();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [hasLiveGames, activeTab]);

  // Generate ticker items from games
  const tickerItems = useMemo(() => {
    const items = [];

    // Add live games first
    const liveGames = games.filter((g) => g.status.isLive);
    liveGames.forEach((game, i) => {
      items.push({
        id: `live-${i}`,
        content: `LIVE: ${game.teams.away.abbreviation} ${game.teams.away.score} @ ${game.teams.home.abbreviation} ${game.teams.home.score} - Q${game.status.period}`,
        type: 'live' as const,
      });
    });

    // Add recent finals
    const finals = games.filter((g) => g.status.isFinal).slice(0, 3);
    finals.forEach((game, i) => {
      const winner = game.teams.away.winner ? game.teams.away : game.teams.home;
      items.push({
        id: `final-${i}`,
        content: `Final: ${game.teams.away.abbreviation} ${game.teams.away.score} - ${game.teams.home.abbreviation} ${game.teams.home.score}`,
        type: 'default' as const,
      });
    });

    // Default items if no games
    if (items.length === 0) {
      items.push(
        { id: '1', content: 'NBA: 2025-26 season standings live', type: 'default' as const },
        { id: '2', content: 'NBA: Scores updated every 30 seconds', type: 'default' as const }
      );
    }

    return items;
  }, [games]);

  // Get all teams for teams tab
  const allTeams = useMemo(() => {
    const teams: Team[] = [];
    standings.forEach((conf) => {
      conf.divisions.forEach((div) => {
        teams.push(...div.teams);
      });
    });
    return teams.sort((a, b) => a.name.localeCompare(b.name));
  }, [standings]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'standings', label: 'Standings' },
    { key: 'scores', label: 'Scores' },
    { key: 'teams', label: 'Teams' },
  ];

  return (
    <main id="main-content" className="min-h-screen">
      <Navbar items={navItems} />

      <div className="pt-16">
        <IntelTicker
          items={tickerItems}
          speed={40}
          variant={hasLiveGames ? 'accent' : 'default'}
          pauseOnHover
        />
      </div>

      {/* Hero */}
      <Section padding="lg" className="relative pt-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-burnt-orange/10 rounded-full blur-[100px]" />
        </div>

        <Container>
          <ScrollReveal direction="up">
            <div className="text-center">
              <Badge variant="accent" className="mb-4">
                2025-26 Season
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display text-white mb-4">NBA</h1>
              <p className="text-lg text-white/60 max-w-2xl mx-auto mb-6">
                Live scores, standings, and analytics for all 30 NBA teams. Real-time data from
                official sources.
              </p>

              <div className="flex items-center justify-center gap-4">
                {hasLiveGames && <LiveBadge />}
                <DataSourceBadge source="ESPN NBA API" />
                {lastUpdated && (
                  <span className="text-xs text-white/40">Updated: {lastUpdated} CT</span>
                )}
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* Tabs */}
      <Section padding="sm">
        <Container>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-burnt-orange text-white'
                    : 'bg-charcoal text-white/60 hover:text-white hover:bg-charcoal/80'
                }`}
              >
                {tab.label}
                {tab.key === 'scores' && hasLiveGames && (
                  <span className="ml-2 w-2 h-2 bg-success rounded-full inline-block animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </Container>
      </Section>

      {/* Content */}
      <Section padding="lg">
        <Container>
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-burnt-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/60">Loading NBA data...</p>
            </div>
          ) : error ? (
            <Card className="p-8 text-center">
              <p className="text-error mb-4">{error}</p>
              <button onClick={() => window.location.reload()} className="btn-primary">
                Retry
              </button>
            </Card>
          ) : (
            <>
              {/* Standings Tab */}
              {activeTab === 'standings' && (
                <ScrollReveal direction="up">
                  <div className="space-y-12">
                    {standings.map((conference) => (
                      <StandingsTable key={conference.abbreviation} conference={conference} />
                    ))}
                  </div>
                </ScrollReveal>
              )}

              {/* Scores Tab */}
              {activeTab === 'scores' && (
                <ScrollReveal direction="up">
                  {games.length === 0 ? (
                    <Card className="p-8 text-center">
                      <p className="text-white/60">No games scheduled for today.</p>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {games.map((game) => (
                        <GameCard key={game.id} game={game} />
                      ))}
                    </div>
                  )}
                </ScrollReveal>
              )}

              {/* Teams Tab */}
              {activeTab === 'teams' && (
                <ScrollReveal direction="up">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {allTeams.map((team) => (
                      <Card
                        key={team.id}
                        variant="interactive"
                        className={`p-4 text-center ${
                          team.name === 'Memphis Grizzlies' ? 'ring-2 ring-burnt-orange' : ''
                        }`}
                      >
                        {team.logo && (
                          <img
                            src={team.logo}
                            alt={team.name}
                            className="w-16 h-16 object-contain mx-auto mb-3"
                          />
                        )}
                        <h3 className="text-sm font-medium text-white">{team.name}</h3>
                        <p className="text-xs text-white/60 mt-1">{team.record.displayRecord}</p>
                      </Card>
                    ))}
                  </div>
                </ScrollReveal>
              )}
            </>
          )}
        </Container>
      </Section>

      <Footer />
    </main>
  );
}
