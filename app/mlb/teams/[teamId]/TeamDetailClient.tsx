'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic/ScrollReveal';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';
import { Skeleton } from '@/components/ui/Skeleton';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'MLB', href: '/mlb' },
  { label: 'NFL', href: '/nfl' },
  { label: 'Dashboard', href: '/dashboard' },
];

interface Player {
  id: string;
  name: string;
  number: string;
  position: string;
  bats: string;
  throws: string;
  age: number;
  height: string;
  weight: number;
  stats?: {
    avg?: string;
    hr?: number;
    rbi?: number;
    era?: string;
    wins?: number;
    saves?: number;
  };
}

interface TeamData {
  id: string;
  name: string;
  abbreviation: string;
  division: string;
  league: string;
  venue: string;
  record?: { wins: number; losses: number };
  roster?: Player[];
}

interface DataMeta {
  dataSource: string;
  lastUpdated: string;
  timezone: string;
}

type TabType = 'roster' | 'depthchart' | 'schedule' | 'stats';

function formatTimestamp(isoString?: string): string {
  const date = isoString ? new Date(isoString) : new Date();
  return (
    date.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }) + ' CT'
  );
}

const teamNames: Record<
  string,
  { name: string; abbreviation: string; division: string; league: string }
> = {
  bal: { name: 'Baltimore Orioles', abbreviation: 'BAL', division: 'East', league: 'AL' },
  bos: { name: 'Boston Red Sox', abbreviation: 'BOS', division: 'East', league: 'AL' },
  nyy: { name: 'New York Yankees', abbreviation: 'NYY', division: 'East', league: 'AL' },
  tb: { name: 'Tampa Bay Rays', abbreviation: 'TB', division: 'East', league: 'AL' },
  tor: { name: 'Toronto Blue Jays', abbreviation: 'TOR', division: 'East', league: 'AL' },
  cws: { name: 'Chicago White Sox', abbreviation: 'CWS', division: 'Central', league: 'AL' },
  cle: { name: 'Cleveland Guardians', abbreviation: 'CLE', division: 'Central', league: 'AL' },
  det: { name: 'Detroit Tigers', abbreviation: 'DET', division: 'Central', league: 'AL' },
  kc: { name: 'Kansas City Royals', abbreviation: 'KC', division: 'Central', league: 'AL' },
  min: { name: 'Minnesota Twins', abbreviation: 'MIN', division: 'Central', league: 'AL' },
  hou: { name: 'Houston Astros', abbreviation: 'HOU', division: 'West', league: 'AL' },
  laa: { name: 'Los Angeles Angels', abbreviation: 'LAA', division: 'West', league: 'AL' },
  oak: { name: 'Oakland Athletics', abbreviation: 'OAK', division: 'West', league: 'AL' },
  sea: { name: 'Seattle Mariners', abbreviation: 'SEA', division: 'West', league: 'AL' },
  tex: { name: 'Texas Rangers', abbreviation: 'TEX', division: 'West', league: 'AL' },
  atl: { name: 'Atlanta Braves', abbreviation: 'ATL', division: 'East', league: 'NL' },
  mia: { name: 'Miami Marlins', abbreviation: 'MIA', division: 'East', league: 'NL' },
  nym: { name: 'New York Mets', abbreviation: 'NYM', division: 'East', league: 'NL' },
  phi: { name: 'Philadelphia Phillies', abbreviation: 'PHI', division: 'East', league: 'NL' },
  wsh: { name: 'Washington Nationals', abbreviation: 'WSH', division: 'East', league: 'NL' },
  chc: { name: 'Chicago Cubs', abbreviation: 'CHC', division: 'Central', league: 'NL' },
  cin: { name: 'Cincinnati Reds', abbreviation: 'CIN', division: 'Central', league: 'NL' },
  mil: { name: 'Milwaukee Brewers', abbreviation: 'MIL', division: 'Central', league: 'NL' },
  pit: { name: 'Pittsburgh Pirates', abbreviation: 'PIT', division: 'Central', league: 'NL' },
  stl: { name: 'St. Louis Cardinals', abbreviation: 'STL', division: 'Central', league: 'NL' },
  ari: { name: 'Arizona Diamondbacks', abbreviation: 'ARI', division: 'West', league: 'NL' },
  col: { name: 'Colorado Rockies', abbreviation: 'COL', division: 'West', league: 'NL' },
  lad: { name: 'Los Angeles Dodgers', abbreviation: 'LAD', division: 'West', league: 'NL' },
  sd: { name: 'San Diego Padres', abbreviation: 'SD', division: 'West', league: 'NL' },
  sf: { name: 'San Francisco Giants', abbreviation: 'SF', division: 'West', league: 'NL' },
};

interface TeamDetailClientProps {
  teamId: string;
}

export default function TeamDetailClient({ teamId }: TeamDetailClientProps) {
  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<DataMeta | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('roster');
  const [positionFilter, setPositionFilter] = useState<string>('all');

  const teamInfo = teamNames[teamId] || {
    name: teamId,
    abbreviation: teamId.toUpperCase(),
    division: '',
    league: '',
  };

  const fetchTeam = useCallback(async () => {
    if (!teamId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/mlb/teams/${teamId}`);
      if (!res.ok) throw new Error('Failed to fetch team data');
      const data = await res.json();

      if (data.team) {
        setTeam(data.team);
      }
      if (data.meta) {
        setMeta(data.meta);
      }
      setLoading(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'roster', label: 'Roster' },
    { id: 'depthchart', label: 'Depth Chart' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'stats', label: 'Stats' },
  ];

  const positionGroups = [
    { id: 'all', label: 'All' },
    { id: 'pitchers', label: 'Pitchers' },
    { id: 'catchers', label: 'Catchers' },
    { id: 'infielders', label: 'Infielders' },
    { id: 'outfielders', label: 'Outfielders' },
  ];

  const filterRoster = (players: Player[]) => {
    if (positionFilter === 'all') return players;
    if (positionFilter === 'pitchers')
      return players.filter((p) => ['P', 'SP', 'RP', 'CL'].includes(p.position));
    if (positionFilter === 'catchers') return players.filter((p) => p.position === 'C');
    if (positionFilter === 'infielders')
      return players.filter((p) => ['1B', '2B', '3B', 'SS'].includes(p.position));
    if (positionFilter === 'outfielders')
      return players.filter((p) => ['LF', 'CF', 'RF', 'OF', 'DH'].includes(p.position));
    return players;
  };

  const RosterContent = () => {
    if (!team?.roster?.length) {
      return (
        <Card variant="default" padding="lg">
          <div className="text-center py-8">
            <p className="text-text-secondary">Roster data not available</p>
            <p className="text-text-tertiary text-sm mt-2">
              Roster will be available when the 2025 season begins
            </p>
          </div>
        </Card>
      );
    }

    const filteredRoster = filterRoster(team.roster);

    return (
      <>
        <div className="flex flex-wrap gap-2 mb-6">
          {positionGroups.map((group) => (
            <button
              key={group.id}
              onClick={() => setPositionFilter(group.id)}
              className={`px-4 py-2 rounded-md text-sm transition-all ${
                positionFilter === group.id
                  ? 'bg-burnt-orange text-white font-semibold'
                  : 'bg-graphite text-text-secondary hover:bg-white/10 hover:text-white'
              }`}
            >
              {group.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRoster.map((player) => (
            <Card
              key={player.id}
              variant="default"
              padding="md"
              className="hover:border-burnt-orange transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-charcoal rounded-lg flex items-center justify-center text-xl font-bold text-burnt-orange flex-shrink-0">
                  {player.number || '-'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{player.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {player.position}
                    </Badge>
                    <span className="text-xs text-text-tertiary">
                      {player.bats}/{player.throws}
                    </span>
                  </div>
                  <p className="text-xs text-text-tertiary mt-1">
                    {player.height} | {player.weight} lbs | Age {player.age}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </>
    );
  };

  const DepthChartContent = () => {
    const positions = [
      { position: 'C', label: 'Catcher' },
      { position: '1B', label: 'First Base' },
      { position: '2B', label: 'Second Base' },
      { position: 'SS', label: 'Shortstop' },
      { position: '3B', label: 'Third Base' },
      { position: 'LF', label: 'Left Field' },
      { position: 'CF', label: 'Center Field' },
      { position: 'RF', label: 'Right Field' },
      { position: 'DH', label: 'DH' },
    ];

    const pitchingRoles = [
      { role: 'SP', label: 'Starting Pitchers' },
      { role: 'RP', label: 'Relief Pitchers' },
      { role: 'CL', label: 'Closer' },
    ];

    return (
      <div className="space-y-8">
        <Card variant="default" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-burnt-orange"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
              Position Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {positions.map((pos) => {
                const players = team?.roster?.filter((p) => p.position === pos.position) || [];
                return (
                  <div key={pos.position} className="bg-graphite rounded-lg p-4">
                    <p className="text-xs text-text-tertiary uppercase tracking-wide mb-2">
                      {pos.label}
                    </p>
                    {players.length > 0 ? (
                      <div className="space-y-2">
                        {players.slice(0, 2).map((player, idx) => (
                          <div
                            key={player.id}
                            className={`flex items-center gap-2 ${idx === 0 ? 'text-white' : 'text-text-secondary'}`}
                          >
                            <span className="text-xs text-burnt-orange font-mono w-6">
                              {player.number}
                            </span>
                            <span className="text-sm truncate">{player.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-text-tertiary text-sm">-</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card variant="default" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-burnt-orange"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Pitching Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              {pitchingRoles.map((role) => {
                const pitchers =
                  team?.roster?.filter((p) =>
                    role.role === 'SP'
                      ? p.position === 'SP' || p.position === 'P'
                      : role.role === 'CL'
                        ? p.position === 'CL'
                        : p.position === 'RP'
                  ) || [];
                return (
                  <div key={role.role}>
                    <p className="text-sm font-semibold text-white mb-3">{role.label}</p>
                    {pitchers.length > 0 ? (
                      <div className="space-y-2">
                        {pitchers
                          .slice(0, role.role === 'SP' ? 5 : role.role === 'CL' ? 1 : 6)
                          .map((player) => (
                            <div
                              key={player.id}
                              className="flex items-center justify-between bg-graphite rounded-lg px-3 py-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-burnt-orange font-mono w-6">
                                  {player.number}
                                </span>
                                <span className="text-sm text-text-secondary">{player.name}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-text-tertiary text-sm">-</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const ScheduleContent = () => (
    <Card variant="default" padding="lg">
      <div className="text-center py-8">
        <svg
          viewBox="0 0 24 24"
          className="w-16 h-16 text-text-tertiary mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <p className="text-text-secondary">Team schedule available when 2025 season begins</p>
        <Link
          href="/mlb/scores"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-burnt-orange text-white rounded-lg hover:bg-burnt-orange/80 transition-colors"
        >
          View Today&apos;s Games
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </Card>
  );

  const StatsContent = () => (
    <div className="grid gap-6 md:grid-cols-2">
      <Card variant="default" padding="lg">
        <CardHeader>
          <CardTitle>Team Batting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-text-tertiary">
            Team batting statistics coming soon
          </div>
        </CardContent>
      </Card>
      <Card variant="default" padding="lg">
        <CardHeader>
          <CardTitle>Team Pitching</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-text-tertiary">
            Team pitching statistics coming soon
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      <Navbar items={navItems} />

      <main id="main-content">
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/mlb"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                MLB
              </Link>
              <span className="text-text-tertiary">/</span>
              <Link
                href="/mlb/teams"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                Teams
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-white font-medium">{teamInfo.name}</span>
            </nav>
          </Container>
        </Section>

        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
          <Container>
            <ScrollReveal>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-charcoal rounded-xl flex items-center justify-center text-3xl font-bold text-burnt-orange">
                  {teamInfo.abbreviation}
                </div>
                <div>
                  <Badge variant="secondary" className="mb-2">
                    {teamInfo.league} {teamInfo.division}
                  </Badge>
                  <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-gradient-blaze">
                    {teamInfo.name}
                  </h1>
                  {team?.record && (
                    <p className="text-text-secondary mt-2 text-lg font-mono">
                      {team.record.wins}-{team.record.losses}
                    </p>
                  )}
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <div className="flex gap-2 mb-8 border-b border-border-subtle overflow-x-auto pb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${activeTab === tab.id ? 'text-burnt-orange border-burnt-orange' : 'text-text-tertiary border-transparent hover:text-white'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loading ? (
              <Card variant="default" padding="lg">
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-graphite rounded-lg">
                      <Skeleton variant="rect" width={56} height={56} className="rounded-lg" />
                      <div className="flex-1">
                        <Skeleton variant="text" width={150} height={18} />
                        <Skeleton variant="text" width={100} height={14} className="mt-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : error ? (
              <Card variant="default" padding="lg" className="bg-error/10 border-error/30">
                <p className="text-error font-semibold">Unable to Load Team Data</p>
                <p className="text-text-secondary text-sm mt-1">{error}</p>
                <button
                  onClick={fetchTeam}
                  className="mt-4 px-4 py-2 bg-burnt-orange text-white rounded-lg hover:bg-burnt-orange/80 transition-colors"
                >
                  Retry
                </button>
              </Card>
            ) : (
              <ScrollReveal key={activeTab}>
                {activeTab === 'roster' && <RosterContent />}
                {activeTab === 'depthchart' && <DepthChartContent />}
                {activeTab === 'schedule' && <ScheduleContent />}
                {activeTab === 'stats' && <StatsContent />}
              </ScrollReveal>
            )}

            <div className="mt-8 pt-4 border-t border-border-subtle">
              <DataSourceBadge
                source={meta?.dataSource || 'MLB Stats API'}
                timestamp={formatTimestamp(meta?.lastUpdated)}
              />
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
