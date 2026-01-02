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
export const NFL_TEAMS: Record<
  string,
  {
    city: string;
    name: string;
    abbreviation: string;
    conference: string;
    division: string;
    primaryColor: string;
    secondaryColor: string;
  }
> = {
  cardinals: {
    city: 'Arizona',
    name: 'Cardinals',
    abbreviation: 'ARI',
    conference: 'NFC',
    division: 'West',
    primaryColor: '#97233F',
    secondaryColor: '#000000',
  },
  falcons: {
    city: 'Atlanta',
    name: 'Falcons',
    abbreviation: 'ATL',
    conference: 'NFC',
    division: 'South',
    primaryColor: '#A71930',
    secondaryColor: '#000000',
  },
  ravens: {
    city: 'Baltimore',
    name: 'Ravens',
    abbreviation: 'BAL',
    conference: 'AFC',
    division: 'North',
    primaryColor: '#241773',
    secondaryColor: '#000000',
  },
  bills: {
    city: 'Buffalo',
    name: 'Bills',
    abbreviation: 'BUF',
    conference: 'AFC',
    division: 'East',
    primaryColor: '#00338D',
    secondaryColor: '#C60C30',
  },
  panthers: {
    city: 'Carolina',
    name: 'Panthers',
    abbreviation: 'CAR',
    conference: 'NFC',
    division: 'South',
    primaryColor: '#0085CA',
    secondaryColor: '#101820',
  },
  bears: {
    city: 'Chicago',
    name: 'Bears',
    abbreviation: 'CHI',
    conference: 'NFC',
    division: 'North',
    primaryColor: '#0B162A',
    secondaryColor: '#C83803',
  },
  bengals: {
    city: 'Cincinnati',
    name: 'Bengals',
    abbreviation: 'CIN',
    conference: 'AFC',
    division: 'North',
    primaryColor: '#FB4F14',
    secondaryColor: '#000000',
  },
  browns: {
    city: 'Cleveland',
    name: 'Browns',
    abbreviation: 'CLE',
    conference: 'AFC',
    division: 'North',
    primaryColor: '#311D00',
    secondaryColor: '#FF3C00',
  },
  cowboys: {
    city: 'Dallas',
    name: 'Cowboys',
    abbreviation: 'DAL',
    conference: 'NFC',
    division: 'East',
    primaryColor: '#003594',
    secondaryColor: '#869397',
  },
  broncos: {
    city: 'Denver',
    name: 'Broncos',
    abbreviation: 'DEN',
    conference: 'AFC',
    division: 'West',
    primaryColor: '#FB4F14',
    secondaryColor: '#002244',
  },
  lions: {
    city: 'Detroit',
    name: 'Lions',
    abbreviation: 'DET',
    conference: 'NFC',
    division: 'North',
    primaryColor: '#0076B6',
    secondaryColor: '#B0B7BC',
  },
  packers: {
    city: 'Green Bay',
    name: 'Packers',
    abbreviation: 'GB',
    conference: 'NFC',
    division: 'North',
    primaryColor: '#203731',
    secondaryColor: '#FFB612',
  },
  texans: {
    city: 'Houston',
    name: 'Texans',
    abbreviation: 'HOU',
    conference: 'AFC',
    division: 'South',
    primaryColor: '#03202F',
    secondaryColor: '#A71930',
  },
  colts: {
    city: 'Indianapolis',
    name: 'Colts',
    abbreviation: 'IND',
    conference: 'AFC',
    division: 'South',
    primaryColor: '#002C5F',
    secondaryColor: '#A2AAAD',
  },
  jaguars: {
    city: 'Jacksonville',
    name: 'Jaguars',
    abbreviation: 'JAX',
    conference: 'AFC',
    division: 'South',
    primaryColor: '#006778',
    secondaryColor: '#9F792C',
  },
  chiefs: {
    city: 'Kansas City',
    name: 'Chiefs',
    abbreviation: 'KC',
    conference: 'AFC',
    division: 'West',
    primaryColor: '#E31837',
    secondaryColor: '#FFB81C',
  },
  raiders: {
    city: 'Las Vegas',
    name: 'Raiders',
    abbreviation: 'LV',
    conference: 'AFC',
    division: 'West',
    primaryColor: '#000000',
    secondaryColor: '#A5ACAF',
  },
  chargers: {
    city: 'Los Angeles',
    name: 'Chargers',
    abbreviation: 'LAC',
    conference: 'AFC',
    division: 'West',
    primaryColor: '#0080C6',
    secondaryColor: '#FFC20E',
  },
  rams: {
    city: 'Los Angeles',
    name: 'Rams',
    abbreviation: 'LAR',
    conference: 'NFC',
    division: 'West',
    primaryColor: '#003594',
    secondaryColor: '#FFA300',
  },
  dolphins: {
    city: 'Miami',
    name: 'Dolphins',
    abbreviation: 'MIA',
    conference: 'AFC',
    division: 'East',
    primaryColor: '#008E97',
    secondaryColor: '#FC4C02',
  },
  vikings: {
    city: 'Minnesota',
    name: 'Vikings',
    abbreviation: 'MIN',
    conference: 'NFC',
    division: 'North',
    primaryColor: '#4F2683',
    secondaryColor: '#FFC62F',
  },
  patriots: {
    city: 'New England',
    name: 'Patriots',
    abbreviation: 'NE',
    conference: 'AFC',
    division: 'East',
    primaryColor: '#002244',
    secondaryColor: '#C60C30',
  },
  saints: {
    city: 'New Orleans',
    name: 'Saints',
    abbreviation: 'NO',
    conference: 'NFC',
    division: 'South',
    primaryColor: '#D3BC8D',
    secondaryColor: '#101820',
  },
  giants: {
    city: 'New York',
    name: 'Giants',
    abbreviation: 'NYG',
    conference: 'NFC',
    division: 'East',
    primaryColor: '#0B2265',
    secondaryColor: '#A71930',
  },
  jets: {
    city: 'New York',
    name: 'Jets',
    abbreviation: 'NYJ',
    conference: 'AFC',
    division: 'East',
    primaryColor: '#125740',
    secondaryColor: '#000000',
  },
  eagles: {
    city: 'Philadelphia',
    name: 'Eagles',
    abbreviation: 'PHI',
    conference: 'NFC',
    division: 'East',
    primaryColor: '#004C54',
    secondaryColor: '#A5ACAF',
  },
  steelers: {
    city: 'Pittsburgh',
    name: 'Steelers',
    abbreviation: 'PIT',
    conference: 'AFC',
    division: 'North',
    primaryColor: '#FFB612',
    secondaryColor: '#101820',
  },
  '49ers': {
    city: 'San Francisco',
    name: '49ers',
    abbreviation: 'SF',
    conference: 'NFC',
    division: 'West',
    primaryColor: '#AA0000',
    secondaryColor: '#B3995D',
  },
  seahawks: {
    city: 'Seattle',
    name: 'Seahawks',
    abbreviation: 'SEA',
    conference: 'NFC',
    division: 'West',
    primaryColor: '#002244',
    secondaryColor: '#69BE28',
  },
  buccaneers: {
    city: 'Tampa Bay',
    name: 'Buccaneers',
    abbreviation: 'TB',
    conference: 'NFC',
    division: 'South',
    primaryColor: '#D50A0A',
    secondaryColor: '#FF7900',
  },
  titans: {
    city: 'Tennessee',
    name: 'Titans',
    abbreviation: 'TEN',
    conference: 'AFC',
    division: 'South',
    primaryColor: '#0C2340',
    secondaryColor: '#4B92DB',
  },
  commanders: {
    city: 'Washington',
    name: 'Commanders',
    abbreviation: 'WAS',
    conference: 'NFC',
    division: 'East',
    primaryColor: '#5A1414',
    secondaryColor: '#FFB612',
  },
};

interface TeamStats {
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  streak: number;
}

function formatTimestamp(): string {
  return (
    new Date().toLocaleString('en-US', {
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

interface NFLTeamDetailClientProps {
  teamId: string;
}

export default function NFLTeamDetailClient({ teamId }: NFLTeamDetailClientProps) {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const team = NFL_TEAMS[teamId?.toLowerCase()];

  const fetchTeamData = useCallback(async () => {
    if (!team) {
      setError('Team not found');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Try to fetch from standings API
      const response = await fetch('/api/nfl/standings');
      if (response.ok) {
        const data = (await response.json()) as {
          success?: boolean;
          rawData?: Array<{
            Team: string;
            Wins?: number;
            Losses?: number;
            Ties?: number;
            PointsFor?: number;
            PointsAgainst?: number;
            Streak?: number;
          }>;
        };
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
                  The team you're looking for doesn't exist.
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
    ? stats.pointsFor - stats.pointsAgainst > 0
      ? '+' + (stats.pointsFor - stats.pointsAgainst)
      : String(stats.pointsFor - stats.pointsAgainst)
    : '-';
  const streakDisplay = stats
    ? stats.streak > 0
      ? 'W' + stats.streak
      : stats.streak < 0
        ? 'L' + Math.abs(stats.streak)
        : '-'
    : '-';

  return (
    <>
      <Navbar items={navItems} />

      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/nfl"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                NFL
              </Link>
              <span className="text-text-tertiary">/</span>
              <Link
                href="/nfl/teams"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
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
              background: `linear-gradient(135deg, ${team.primaryColor}30 0%, transparent 50%)`,
            }}
          />
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="primary">{team.conference}</Badge>
                <Badge variant="secondary">
                  {team.conference} {team.division}
                </Badge>
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

        {/* Team Stats */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Record Card */}
              <ScrollReveal>
                <Card variant="default" padding="lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <svg
                        viewBox="0 0 24 24"
                        className="w-6 h-6 text-burnt-orange"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
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
                          {stats.wins}-{stats.losses}
                          {stats.ties > 0 ? `-${stats.ties}` : ''}
                        </div>
                        <div className="text-text-secondary">
                          Win Pct:{' '}
                          {(stats.wins / (stats.wins + stats.losses + stats.ties) || 0)
                            .toFixed(3)
                            .replace('0.', '.')}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-text-secondary">Season data unavailable</div>
                    )}
                  </CardContent>
                </Card>
              </ScrollReveal>

              {/* Points Card */}
              <ScrollReveal delay={100}>
                <Card variant="default" padding="lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <svg
                        viewBox="0 0 24 24"
                        className="w-6 h-6 text-burnt-orange"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
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
                          <div
                            className={`text-2xl font-bold ${stats.pointsFor - stats.pointsAgainst > 0 ? 'text-success' : stats.pointsFor - stats.pointsAgainst < 0 ? 'text-error' : 'text-text-secondary'}`}
                          >
                            {diffDisplay}
                          </div>
                          <div className="text-text-tertiary text-sm">DIFF</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-text-secondary">Points data unavailable</div>
                    )}
                  </CardContent>
                </Card>
              </ScrollReveal>

              {/* Streak Card */}
              <ScrollReveal delay={200}>
                <Card variant="default" padding="lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <svg
                        viewBox="0 0 24 24"
                        className="w-6 h-6 text-burnt-orange"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
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
                        <div
                          className={`text-4xl font-bold ${stats.streak > 0 ? 'text-success' : stats.streak < 0 ? 'text-error' : 'text-text-secondary'}`}
                        >
                          {streakDisplay}
                        </div>
                        <div className="text-text-secondary mt-2">
                          {stats.streak > 0
                            ? 'Winning Streak'
                            : stats.streak < 0
                              ? 'Losing Streak'
                              : 'No Streak'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-text-secondary">Streak data unavailable</div>
                    )}
                  </CardContent>
                </Card>
              </ScrollReveal>
            </div>

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
                <DataSourceBadge source="SportsDataIO" timestamp={formatTimestamp()} />
              </Card>
            )}
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
