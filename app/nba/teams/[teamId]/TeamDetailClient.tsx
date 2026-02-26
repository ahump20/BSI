'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { formatTimestamp } from '@/lib/utils/timezone';

interface TeamData {
  id: string;
  name: string;
  abbreviation: string;
  color?: string;
  logos?: Array<{ href: string }>;
  record: {
    overall: string;
    wins: number;
    losses: number;
    winPercent: number;
    home: string;
    away: string;
  };
}

interface RosterPlayer {
  id: string;
  name: string;
  jersey: string;
  position: string;
  height: string;
  weight: string;
}

interface ScheduleGame {
  id: string;
  date: string;
  name: string;
  shortName: string;
  competitions: Array<{
    competitors: Array<{
      id: string;
      homeAway: string;
      team: {
        id: string;
        displayName: string;
        abbreviation: string;
        logo?: string;
      };
      score?: string;
      winner?: boolean;
    }>;
    status: {
      type: {
        completed: boolean;
        description: string;
      };
    };
  }>;
}

interface TeamResponse {
  timestamp: string;
  team: TeamData;
  roster: RosterPlayer[];
  schedule: ScheduleGame[];
  meta: {
    dataSource: string;
    lastUpdated: string;
    season: string;
  };
}


function formatGameDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function StatCard({ label, value, subValue }: { label: string; value: string | number; subValue?: string }) {
  return (
    <div className="text-center p-4 bg-background-tertiary rounded-lg">
      <p className="text-2xl md:text-3xl font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-tertiary uppercase tracking-wider mt-1">{label}</p>
      {subValue && <p className="text-xs text-text-secondary mt-1">{subValue}</p>}
    </div>
  );
}

function SkeletonTeamProfile() {
  return (
    <div className="animate-pulse">
      <div className="flex flex-col md:flex-row gap-8 items-center">
        <div className="w-32 h-32 bg-background-tertiary rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="h-10 bg-background-tertiary rounded w-2/3 mx-auto md:mx-0" />
          <div className="h-6 bg-background-tertiary/50 rounded w-1/3 mx-auto md:mx-0" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-background-tertiary rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RosterCard({ player, teamColor }: { player: RosterPlayer; teamColor: string }) {
  return (
    <Link href={`/nba/players/${player.id}`}>
      <Card
        variant="hover"
        padding="md"
        className="h-full transition-all duration-300 hover:scale-[1.02] group"
        style={{ borderColor: teamColor, borderLeftWidth: '3px' }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
            style={{ backgroundColor: teamColor, color: '#fff' }}
          >
            #{player.jersey || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-display font-bold text-text-primary truncate group-hover:text-burnt-orange transition-colors">
              {player.name}
            </h4>
            <p className="text-text-secondary text-sm">{player.position}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-text-secondary text-sm">{player.height}</p>
            <p className="text-text-tertiary text-xs">{player.weight} lbs</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function ScheduleCard({ game, teamId }: { game: ScheduleGame; teamId: string }) {
  const competition = game.competitions?.[0];
  if (!competition) return null;

  const team = competition.competitors?.find((c) => c.team.id === teamId);
  const opponent = competition.competitors?.find((c) => c.team.id !== teamId);
  if (!team || !opponent) return null;

  const isHome = team.homeAway === 'home';
  const isCompleted = competition.status?.type?.completed;
  const teamWon = team.winner;

  return (
    <Card variant="default" padding="md" className="h-full">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm text-text-tertiary mb-1">
            <span>{formatGameDate(game.date)}</span>
            <Badge variant={isHome ? 'primary' : 'secondary'} className="text-xs">
              {isHome ? 'HOME' : 'AWAY'}
            </Badge>
          </div>
          <p className="text-text-primary font-semibold truncate">
            {isHome ? 'vs' : '@'} {opponent.team.displayName}
          </p>
        </div>

        {isCompleted && team.score && opponent.score ? (
          <div className="text-right">
            <p
              className={`text-lg font-bold ${teamWon ? 'text-success' : 'text-error'}`}
            >
              {teamWon ? 'W' : 'L'}
            </p>
            <p className="text-text-secondary text-sm">
              {team.score}-{opponent.score}
            </p>
          </div>
        ) : (
          <Badge variant="secondary" className="text-xs">
            {competition.status?.type?.description || 'Scheduled'}
          </Badge>
        )}
      </div>
    </Card>
  );
}

interface TeamDetailClientProps {
  teamId: string;
}

export default function TeamDetailClient({ teamId }: TeamDetailClientProps) {
  const [team, setTeam] = useState<TeamData | null>(null);
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [schedule, setSchedule] = useState<ScheduleGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>(formatTimestamp());
  const [activeTab, setActiveTab] = useState<'roster' | 'schedule'>('roster');

  const fetchTeam = useCallback(async () => {
    if (!teamId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/nba/teams/${teamId}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch team: ${res.status}`);
      }

      const data: TeamResponse = await res.json();
      setTeam(data.team);
      setRoster(data.roster || []);
      setSchedule(data.schedule || []);
      setLastUpdated(formatTimestamp());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const teamColor = team?.color ? `#${team.color}` : 'var(--bsi-primary)';
  const logoUrl = team?.logos?.[0]?.href;

  // Sort roster by position
  const sortedRoster = [...roster].sort((a, b) => {
    const positionOrder: Record<string, number> = { PG: 1, SG: 2, G: 3, SF: 4, PF: 5, F: 6, C: 7 };
    return (positionOrder[a.position] || 99) - (positionOrder[b.position] || 99);
  });

  // Get recent and upcoming games
  const now = new Date();
  const recentGames = schedule
    .filter((g) => new Date(g.date) < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const upcomingGames = schedule
    .filter((g) => new Date(g.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/nba"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                NBA
              </Link>
              <span className="text-text-tertiary">/</span>
              <Link
                href="/nba/teams"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                Teams
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-text-primary font-medium">
                {loading ? 'Loading...' : team?.name || 'Team'}
              </span>
            </nav>
          </Container>
        </Section>

        {/* Team Header */}
        <Section padding="lg" className="relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at top right, ${teamColor} 0%, transparent 50%)`,
            }}
          />

          <Container>
            {error && (
              <Card variant="default" padding="lg" className="mb-6 bg-error/10 border-error/30">
                <p className="text-error font-semibold">Error loading team</p>
                <p className="text-text-secondary text-sm mt-1">{error}</p>
                <button
                  onClick={fetchTeam}
                  className="mt-3 px-4 py-2 bg-burnt-orange text-white rounded-lg text-sm hover:bg-burnt-orange/80 transition-colors"
                >
                  Try Again
                </button>
              </Card>
            )}

            {loading ? (
              <SkeletonTeamProfile />
            ) : team ? (
              <ScrollReveal direction="up">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  {/* Team Logo */}
                  <div className="relative w-32 h-32 flex-shrink-0">
                    {logoUrl ? (
                      <Image
                        src={logoUrl}
                        alt={team.name}
                        fill
                        className="object-contain"
                        sizes="128px"
                        unoptimized
                        priority
                      />
                    ) : (
                      <div
                        className="w-full h-full rounded-lg flex items-center justify-center text-3xl font-bold"
                        style={{ backgroundColor: teamColor, color: '#fff' }}
                      >
                        {team.abbreviation}
                      </div>
                    )}
                  </div>

                  {/* Team Info */}
                  <div className="flex-1 text-center md:text-left">
                    <h1 className="font-display text-3xl md:text-4xl font-bold text-text-primary">
                      {team.name}
                    </h1>

                    <div className="flex items-center gap-3 justify-center md:justify-start mt-2">
                      <Badge
                        variant="primary"
                        style={{ backgroundColor: teamColor }}
                      >
                        {team.abbreviation}
                      </Badge>
                      <span className="text-text-secondary">2024-25 Season</span>
                    </div>

                    {/* Record Stats */}
                    {team.record && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <StatCard label="Record" value={team.record.overall} />
                        <StatCard
                          label="Win %"
                          value={`${(team.record.winPercent * 100).toFixed(1)}%`}
                        />
                        <StatCard label="Home" value={team.record.home} />
                        <StatCard label="Away" value={team.record.away} />
                      </div>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            ) : null}
          </Container>
        </Section>

        {/* Tab Navigation */}
        {team && (
          <Section padding="sm" background="charcoal" borderTop>
            <Container>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('roster')}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    activeTab === 'roster'
                      ? 'bg-burnt-orange text-white'
                      : 'bg-background-tertiary text-text-secondary hover:bg-surface-light'
                  }`}
                >
                  Roster ({roster.length})
                </button>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    activeTab === 'schedule'
                      ? 'bg-burnt-orange text-white'
                      : 'bg-background-tertiary text-text-secondary hover:bg-surface-light'
                  }`}
                >
                  Schedule
                </button>
              </div>
            </Container>
          </Section>
        )}

        {/* Roster Tab */}
        {activeTab === 'roster' && team && (
          <Section padding="lg" background="charcoal">
            <Container>
              <ScrollReveal direction="up">
                <h2 className="font-display text-2xl font-bold text-text-primary mb-6">
                  Team Roster
                </h2>
              </ScrollReveal>

              {sortedRoster.length === 0 ? (
                <Card variant="default" padding="lg" className="text-center">
                  <p className="text-text-secondary">No roster data available</p>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {sortedRoster.map((player, index) => (
                    <ScrollReveal key={player.id} direction="up" delay={(index % 6) * 50}>
                      <RosterCard player={player} teamColor={teamColor} />
                    </ScrollReveal>
                  ))}
                </div>
              )}
            </Container>
          </Section>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && team && (
          <Section padding="lg" background="charcoal">
            <Container>
              <div className="grid gap-8 md:grid-cols-2">
                {/* Recent Games */}
                <ScrollReveal direction="up">
                  <div>
                    <h2 className="font-display text-xl font-bold text-text-primary mb-4">
                      Recent Games
                    </h2>
                    {recentGames.length === 0 ? (
                      <Card variant="default" padding="lg" className="text-center">
                        <p className="text-text-secondary">No recent games</p>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {recentGames.map((game) => (
                          <ScheduleCard key={game.id} game={game} teamId={teamId} />
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollReveal>

                {/* Upcoming Games */}
                <ScrollReveal direction="up" delay={100}>
                  <div>
                    <h2 className="font-display text-xl font-bold text-text-primary mb-4">
                      Upcoming Games
                    </h2>
                    {upcomingGames.length === 0 ? (
                      <Card variant="default" padding="lg" className="text-center">
                        <p className="text-text-secondary">No upcoming games scheduled</p>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {upcomingGames.map((game) => (
                          <ScheduleCard key={game.id} game={game} teamId={teamId} />
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollReveal>
              </div>
            </Container>
          </Section>
        )}

        {/* Data Source */}
        <Section padding="sm" background="charcoal" borderTop>
          <Container>
            <DataSourceBadge source="ESPN NBA API" timestamp={lastUpdated} />
          </Container>
        </Section>

        {/* Quick Links */}
        <Section padding="md" background="midnight" borderTop>
          <Container>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/nba/teams"
                className="px-6 py-3 bg-background-tertiary rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-light transition-all"
              >
                ← All Teams
              </Link>
              <Link
                href="/nba/standings"
                className="px-6 py-3 bg-background-tertiary rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-light transition-all"
              >
                Standings →
              </Link>
              <Link
                href="/nba/games"
                className="px-6 py-3 bg-background-tertiary rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-light transition-all"
              >
                Live Scores →
              </Link>
              <Link
                href="/nba/players"
                className="px-6 py-3 bg-background-tertiary rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-light transition-all"
              >
                All Players →
              </Link>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
