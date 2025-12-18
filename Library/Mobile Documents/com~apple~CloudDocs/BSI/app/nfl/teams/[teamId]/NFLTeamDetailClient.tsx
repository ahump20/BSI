'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';
import { Skeleton } from '@/components/ui/Skeleton';

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

// All 32 NFL teams with full data
export const NFL_TEAMS: Record<string, {
  city: string;
  name: string;
  abbreviation: string;
  conference: string;
  division: string;
  primaryColor: string;
  secondaryColor: string;
}> = {
  'cardinals': { city: 'Arizona', name: 'Cardinals', abbreviation: 'ARI', conference: 'NFC', division: 'West', primaryColor: '#97233F', secondaryColor: '#000000' },
  'falcons': { city: 'Atlanta', name: 'Falcons', abbreviation: 'ATL', conference: 'NFC', division: 'South', primaryColor: '#A71930', secondaryColor: '#000000' },
  'ravens': { city: 'Baltimore', name: 'Ravens', abbreviation: 'BAL', conference: 'AFC', division: 'North', primaryColor: '#241773', secondaryColor: '#000000' },
  'bills': { city: 'Buffalo', name: 'Bills', abbreviation: 'BUF', conference: 'AFC', division: 'East', primaryColor: '#00338D', secondaryColor: '#C60C30' },
  'panthers': { city: 'Carolina', name: 'Panthers', abbreviation: 'CAR', conference: 'NFC', division: 'South', primaryColor: '#0085CA', secondaryColor: '#101820' },
  'bears': { city: 'Chicago', name: 'Bears', abbreviation: 'CHI', conference: 'NFC', division: 'North', primaryColor: '#0B162A', secondaryColor: '#C83803' },
  'bengals': { city: 'Cincinnati', name: 'Bengals', abbreviation: 'CIN', conference: 'AFC', division: 'North', primaryColor: '#FB4F14', secondaryColor: '#000000' },
  'browns': { city: 'Cleveland', name: 'Browns', abbreviation: 'CLE', conference: 'AFC', division: 'North', primaryColor: '#311D00', secondaryColor: '#FF3C00' },
  'cowboys': { city: 'Dallas', name: 'Cowboys', abbreviation: 'DAL', conference: 'NFC', division: 'East', primaryColor: '#003594', secondaryColor: '#869397' },
  'broncos': { city: 'Denver', name: 'Broncos', abbreviation: 'DEN', conference: 'AFC', division: 'West', primaryColor: '#FB4F14', secondaryColor: '#002244' },
  'lions': { city: 'Detroit', name: 'Lions', abbreviation: 'DET', conference: 'NFC', division: 'North', primaryColor: '#0076B6', secondaryColor: '#B0B7BC' },
  'packers': { city: 'Green Bay', name: 'Packers', abbreviation: 'GB', conference: 'NFC', division: 'North', primaryColor: '#203731', secondaryColor: '#FFB612' },
  'texans': { city: 'Houston', name: 'Texans', abbreviation: 'HOU', conference: 'AFC', division: 'South', primaryColor: '#03202F', secondaryColor: '#A71930' },
  'colts': { city: 'Indianapolis', name: 'Colts', abbreviation: 'IND', conference: 'AFC', division: 'South', primaryColor: '#002C5F', secondaryColor: '#A2AAAD' },
  'jaguars': { city: 'Jacksonville', name: 'Jaguars', abbreviation: 'JAX', conference: 'AFC', division: 'South', primaryColor: '#006778', secondaryColor: '#9F792C' },
  'chiefs': { city: 'Kansas City', name: 'Chiefs', abbreviation: 'KC', conference: 'AFC', division: 'West', primaryColor: '#E31837', secondaryColor: '#FFB81C' },
  'raiders': { city: 'Las Vegas', name: 'Raiders', abbreviation: 'LV', conference: 'AFC', division: 'West', primaryColor: '#000000', secondaryColor: '#A5ACAF' },
  'chargers': { city: 'Los Angeles', name: 'Chargers', abbreviation: 'LAC', conference: 'AFC', division: 'West', primaryColor: '#0080C6', secondaryColor: '#FFC20E' },
  'rams': { city: 'Los Angeles', name: 'Rams', abbreviation: 'LAR', conference: 'NFC', division: 'West', primaryColor: '#003594', secondaryColor: '#FFA300' },
  'dolphins': { city: 'Miami', name: 'Dolphins', abbreviation: 'MIA', conference: 'AFC', division: 'East', primaryColor: '#008E97', secondaryColor: '#FC4C02' },
  'vikings': { city: 'Minnesota', name: 'Vikings', abbreviation: 'MIN', conference: 'NFC', division: 'North', primaryColor: '#4F2683', secondaryColor: '#FFC62F' },
  'patriots': { city: 'New England', name: 'Patriots', abbreviation: 'NE', conference: 'AFC', division: 'East', primaryColor: '#002244', secondaryColor: '#C60C30' },
  'saints': { city: 'New Orleans', name: 'Saints', abbreviation: 'NO', conference: 'NFC', division: 'South', primaryColor: '#D3BC8D', secondaryColor: '#101820' },
  'giants': { city: 'New York', name: 'Giants', abbreviation: 'NYG', conference: 'NFC', division: 'East', primaryColor: '#0B2265', secondaryColor: '#A71930' },
  'jets': { city: 'New York', name: 'Jets', abbreviation: 'NYJ', conference: 'AFC', division: 'East', primaryColor: '#125740', secondaryColor: '#000000' },
  'eagles': { city: 'Philadelphia', name: 'Eagles', abbreviation: 'PHI', conference: 'NFC', division: 'East', primaryColor: '#004C54', secondaryColor: '#A5ACAF' },
  'steelers': { city: 'Pittsburgh', name: 'Steelers', abbreviation: 'PIT', conference: 'AFC', division: 'North', primaryColor: '#FFB612', secondaryColor: '#101820' },
  '49ers': { city: 'San Francisco', name: '49ers', abbreviation: 'SF', conference: 'NFC', division: 'West', primaryColor: '#AA0000', secondaryColor: '#B3995D' },
  'seahawks': { city: 'Seattle', name: 'Seahawks', abbreviation: 'SEA', conference: 'NFC', division: 'West', primaryColor: '#002244', secondaryColor: '#69BE28' },
  'buccaneers': { city: 'Tampa Bay', name: 'Buccaneers', abbreviation: 'TB', conference: 'NFC', division: 'South', primaryColor: '#D50A0A', secondaryColor: '#FF7900' },
  'titans': { city: 'Tennessee', name: 'Titans', abbreviation: 'TEN', conference: 'AFC', division: 'South', primaryColor: '#0C2340', secondaryColor: '#4B92DB' },
  'commanders': { city: 'Washington', name: 'Commanders', abbreviation: 'WAS', conference: 'NFC', division: 'East', primaryColor: '#5A1414', secondaryColor: '#FFB612' },
};

interface TeamStats {
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  streak: number;
}

interface Player {
  id: string;
  name: string;
  number: string;
  position: string;
  age?: number;
  height?: string;
  weight?: number;
  college?: string;
  experience?: number;
}

interface Injury {
  id: string;
  player: string;
  position: string;
  injury: string;
  status: string;
  updated: string;
}

type TabType = 'overview' | 'roster' | 'schedule' | 'injuries';

function formatTimestamp(): string {
  return new Date().toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }) + ' CT';
}

interface NFLTeamDetailClientProps {
  teamId: string;
}

export default function NFLTeamDetailClient({ teamId }: NFLTeamDetailClientProps) {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [roster, setRoster] = useState<Player[]>([]);
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [positionFilter, setPositionFilter] = useState<string>('all');

  const team = NFL_TEAMS[teamId?.toLowerCase()];

  const fetchTeamData = useCallback(async () => {
    if (!team) {
      setError('Team not found');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Fetch standings data
      const response = await fetch('/api/nfl/standings');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.rawData) {
          const teamData = data.rawData.find(
            (t: { Team: string }) => t.Team?.toUpperCase() === team.abbreviation.toUpperCase()
          );
          if (teamData) {
            setStats({
              wins: teamData.Wins || 0,
              losses: teamData.Losses || 0,
              ties: teamData.Ties || 0,
              pointsFor: teamData.PointsFor || 0,
              pointsAgainst: teamData.PointsAgainst || 0,
              streak: teamData.Streak || 0,
            });
          }
        }
      }

      // Try to fetch roster data
      try {
        const rosterRes = await fetch(`/api/nfl/teams/${team.abbreviation.toLowerCase()}/roster`);
        if (rosterRes.ok) {
          const rosterData = await rosterRes.json();
          if (rosterData.roster) {
            setRoster(rosterData.roster);
          }
        }
      } catch {
        // Roster API may not exist yet
      }

      // Try to fetch injuries data
      try {
        const injuriesRes = await fetch(`/api/nfl/teams/${team.abbreviation.toLowerCase()}/injuries`);
        if (injuriesRes.ok) {
          const injuriesData = await injuriesRes.json();
          if (injuriesData.injuries) {
            setInjuries(injuriesData.injuries);
          }
        }
      } catch {
        // Injuries API may not exist yet
      }

      setLoading(false);
    } catch {
      setError('Unable to load team data');
      setLoading(false);
    }
  }, [team]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  if (!team) {
    return (
      <>
        <Navbar items={navItems} />
        <main id="main-content">
          <Section padding="lg" background="charcoal">
            <Container>
              <Card variant="default" padding="lg" className="text-center">
                <h1 className="text-2xl font-bold text-white mb-4">Team Not Found</h1>
                <p className="text-text-secondary mb-6">
                  The team you&apos;re looking for doesn&apos;t exist.
                </p>
                <Link href="/nfl/teams" className="text-burnt-orange hover:underline">
                  ← Back to All Teams
                </Link>
              </Card>
            </Container>
          </Section>
        </main>
        <Footer />
      </>
    );
  }

  const fullName = `${team.city} ${team.name}`;
  const diffDisplay = stats
    ? (stats.pointsFor - stats.pointsAgainst > 0
        ? '+' + (stats.pointsFor - stats.pointsAgainst)
        : String(stats.pointsFor - stats.pointsAgainst))
    : '-';
  const streakDisplay = stats
    ? (stats.streak > 0 ? 'W' + stats.streak : stats.streak < 0 ? 'L' + Math.abs(stats.streak) : '-')
    : '-';

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'roster', label: 'Roster' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'injuries', label: 'Injuries' },
  ];

  const positionGroups = [
    { id: 'all', label: 'All' },
    { id: 'offense', label: 'Offense' },
    { id: 'defense', label: 'Defense' },
    { id: 'special', label: 'Special Teams' },
  ];

  const filterRoster = (players: Player[]) => {
    if (positionFilter === 'all') return players;
    if (positionFilter === 'offense') {
      return players.filter(p => ['QB', 'RB', 'FB', 'WR', 'TE', 'OT', 'OG', 'C', 'OL'].includes(p.position));
    }
    if (positionFilter === 'defense') {
      return players.filter(p => ['DE', 'DT', 'NT', 'LB', 'ILB', 'OLB', 'CB', 'S', 'FS', 'SS', 'DB', 'DL'].includes(p.position));
    }
    if (positionFilter === 'special') {
      return players.filter(p => ['K', 'P', 'LS', 'KR', 'PR'].includes(p.position));
    }
    return players;
  };

  const OverviewContent = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Record Card */}
      <ScrollReveal>
        <Card variant="default" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-burnt-orange" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
              Season Record
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton variant="text" width="100%" height={60} />
            ) : stats ? (
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  {stats.wins}-{stats.losses}{stats.ties > 0 ? `-${stats.ties}` : ''}
                </div>
                <div className="text-text-secondary">
                  Win Pct: {((stats.wins / (stats.wins + stats.losses + stats.ties)) || 0).toFixed(3).replace('0.', '.')}
                </div>
              </div>
            ) : (
              <div className="text-center text-text-secondary">
                Season data unavailable
              </div>
            )}
          </CardContent>
        </Card>
      </ScrollReveal>

      {/* Points Card */}
      <ScrollReveal delay={100}>
        <Card variant="default" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-burnt-orange" fill="none" stroke="currentColor" strokeWidth="1.5">
                <ellipse cx="12" cy="12" rx="9" ry="5" />
                <path d="M12 7v10M7 12h10" />
              </svg>
              Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton variant="text" width="100%" height={60} />
            ) : stats ? (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-success">{stats.pointsFor}</div>
                  <div className="text-text-tertiary text-sm">PF</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-error">{stats.pointsAgainst}</div>
                  <div className="text-text-tertiary text-sm">PA</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${stats.pointsFor - stats.pointsAgainst > 0 ? 'text-success' : stats.pointsFor - stats.pointsAgainst < 0 ? 'text-error' : 'text-text-secondary'}`}>
                    {diffDisplay}
                  </div>
                  <div className="text-text-tertiary text-sm">DIFF</div>
                </div>
              </div>
            ) : (
              <div className="text-center text-text-secondary">
                Points data unavailable
              </div>
            )}
          </CardContent>
        </Card>
      </ScrollReveal>

      {/* Streak Card */}
      <ScrollReveal delay={200}>
        <Card variant="default" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-burnt-orange" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton variant="text" width="100%" height={60} />
            ) : stats ? (
              <div className="text-center">
                <div className={`text-4xl font-bold ${stats.streak > 0 ? 'text-success' : stats.streak < 0 ? 'text-error' : 'text-text-secondary'}`}>
                  {streakDisplay}
                </div>
                <div className="text-text-secondary mt-2">
                  {stats.streak > 0 ? 'Winning Streak' : stats.streak < 0 ? 'Losing Streak' : 'No Streak'}
                </div>
              </div>
            ) : (
              <div className="text-center text-text-secondary">
                Streak data unavailable
              </div>
            )}
          </CardContent>
        </Card>
      </ScrollReveal>
    </div>
  );

  const RosterContent = () => {
    if (roster.length === 0) {
      return (
        <Card variant="default" padding="lg">
          <div className="text-center py-8">
            <svg viewBox="0 0 24 24" className="w-16 h-16 text-text-tertiary mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
            <p className="text-text-secondary">Roster data loading or not yet available.</p>
            <p className="text-text-tertiary text-sm mt-2">
              The 53-man roster will populate once finalized. Check back during the regular season.
            </p>
          </div>
        </Card>
      );
    }

    const filteredRoster = filterRoster(roster);

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
                <div
                  className="w-14 h-14 rounded-lg flex items-center justify-center text-xl font-bold flex-shrink-0"
                  style={{ backgroundColor: team.primaryColor + '30', color: team.primaryColor }}
                >
                  {player.number || '-'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{player.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {player.position}
                    </Badge>
                    {player.experience !== undefined && (
                      <span className="text-xs text-text-tertiary">
                        {player.experience === 0 ? 'Rookie' : `${player.experience} yr${player.experience > 1 ? 's' : ''}`}
                      </span>
                    )}
                  </div>
                  {player.college && (
                    <p className="text-xs text-text-tertiary mt-1">{player.college}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </>
    );
  };

  const ScheduleContent = () => (
    <Card variant="default" padding="lg">
      <div className="text-center py-8">
        <svg viewBox="0 0 24 24" className="w-16 h-16 text-text-tertiary mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <p className="text-text-secondary">Schedule data coming soon.</p>
        <p className="text-text-tertiary text-sm mt-2 mb-4">
          The full 2025 schedule will be available when the NFL releases it.
        </p>
        <Link
          href="/nfl"
          className="inline-flex items-center gap-2 px-4 py-2 bg-burnt-orange text-white rounded-lg hover:bg-burnt-orange/80 transition-colors"
        >
          View Today&apos;s Games
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </Card>
  );

  const InjuriesContent = () => {
    if (injuries.length === 0) {
      return (
        <Card variant="default" padding="lg">
          <div className="text-center py-8">
            <svg viewBox="0 0 24 24" className="w-16 h-16 text-success mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p className="text-success font-semibold">Full Strength</p>
            <p className="text-text-tertiary text-sm mt-2">
              No injuries reported. The squad is healthy and ready to compete.
            </p>
          </div>
        </Card>
      );
    }

    return (
      <Card variant="default" padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-warning" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Injury Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {injuries.map((injury) => (
              <div
                key={injury.id}
                className="flex items-center justify-between p-4 bg-graphite rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Badge
                    variant={injury.status === 'Out' ? 'warning' : injury.status === 'Doubtful' ? 'warning' : 'secondary'}
                    className="text-xs"
                  >
                    {injury.status}
                  </Badge>
                  <div>
                    <p className="font-semibold text-white">{injury.player}</p>
                    <p className="text-text-tertiary text-sm">{injury.position} · {injury.injury}</p>
                  </div>
                </div>
                <span className="text-text-tertiary text-xs">{injury.updated}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Navbar items={navItems} />

      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/nfl" className="text-text-tertiary hover:text-burnt-orange transition-colors">
                NFL
              </Link>
              <span className="text-text-tertiary">/</span>
              <Link href="/nfl/teams" className="text-text-tertiary hover:text-burnt-orange transition-colors">
                Teams
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-white font-medium">{fullName}</span>
            </nav>
          </Container>
        </Section>

        {/* Header */}
        <Section padding="md" className="relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(135deg, ${team.primaryColor}30 0%, transparent 50%)`
            }}
          />
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="primary">{team.conference}</Badge>
                <Badge variant="secondary">{team.conference} {team.division}</Badge>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display mb-4">
                <span style={{ color: team.primaryColor }}>{team.city}</span>{' '}
                <span className="text-white">{team.name}</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary">
                2025 Season · {team.conference} {team.division}
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Tabs and Content */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-8 border-b border-border-subtle overflow-x-auto pb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    activeTab === tab.id
                      ? 'text-burnt-orange border-burnt-orange'
                      : 'text-text-tertiary border-transparent hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {loading && activeTab !== 'overview' ? (
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
            ) : (
              <ScrollReveal key={activeTab}>
                {activeTab === 'overview' && <OverviewContent />}
                {activeTab === 'roster' && <RosterContent />}
                {activeTab === 'schedule' && <ScheduleContent />}
                {activeTab === 'injuries' && <InjuriesContent />}
              </ScrollReveal>
            )}

            {/* Quick Links */}
            <ScrollReveal delay={300}>
              <Card variant="default" padding="lg" className="mt-6">
                <CardHeader>
                  <CardTitle>Quick Links</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    <Link
                      href="/nfl"
                      className="px-4 py-2 bg-burnt-orange/20 text-burnt-orange rounded-lg hover:bg-burnt-orange/30 transition-colors"
                    >
                      Live Scores
                    </Link>
                    <Link
                      href="/nfl"
                      className="px-4 py-2 bg-burnt-orange/20 text-burnt-orange rounded-lg hover:bg-burnt-orange/30 transition-colors"
                    >
                      Full Standings
                    </Link>
                    <Link
                      href="/nfl/teams"
                      className="px-4 py-2 bg-burnt-orange/20 text-burnt-orange rounded-lg hover:bg-burnt-orange/30 transition-colors"
                    >
                      All Teams
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Data Source */}
            {!loading && !error && (
              <Card variant="default" padding="md" className="mt-6">
                <DataSourceBadge
                  source="SportsDataIO"
                  timestamp={formatTimestamp()}
                />
              </Card>
            )}
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
