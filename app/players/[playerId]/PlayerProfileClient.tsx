'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  PlayerHero,
  PlayerBio,
  PlayerStats,
  GameLog,
  type StatRow,
  type GameLogEntry,
} from '@/components/player-profile';
import { usePlayerData, type PlayerSport } from '@/lib/hooks/usePlayerData';

interface PlayerProfileClientProps {
  playerId: string;
}

const VALID_SPORTS: PlayerSport[] = ['nfl', 'cfb', 'mlb', 'nba', 'cbb'];

export function PlayerProfileClient({ playerId }: PlayerProfileClientProps) {
  const searchParams = useSearchParams();

  // Get sport from URL search params (e.g., /players/123?sport=nfl)
  const sport = useMemo(() => {
    const sportParam = searchParams.get('sport');
    return VALID_SPORTS.includes(sportParam as PlayerSport) ? (sportParam as PlayerSport) : 'nfl';
  }, [searchParams]);
  const [isFollowing, setIsFollowing] = useState(false);
  const { player, isLoading, error } = usePlayerData(playerId, sport);

  // Loading state
  if (isLoading) {
    return (
      <main id="main-content" className="min-h-screen bg-bg-primary">
        <Section padding="lg">
          <Container>
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-burnt-orange border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-text-secondary">Loading player profile...</p>
            </div>
          </Container>
        </Section>
      </main>
    );
  }

  // Error state
  if (error || !player) {
    return (
      <main id="main-content" className="min-h-screen bg-bg-primary">
        <Section padding="lg">
          <Container>
            <Card variant="default" padding="lg">
              <CardContent>
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-text-tertiary mx-auto mb-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  <h2 className="text-xl font-semibold text-white mb-2">Player Not Found</h2>
                  <p className="text-text-secondary mb-6">
                    {error?.message || `Unable to load player ${playerId}`}
                  </p>
                  <Link
                    href={`/${sport}`}
                    className="inline-flex px-6 py-3 bg-burnt-orange text-white rounded-lg font-semibold hover:bg-burnt-orange/90 transition-colors"
                  >
                    Back to {sport.toUpperCase()}
                  </Link>
                </div>
              </CardContent>
            </Card>
          </Container>
        </Section>
      </main>
    );
  }

  // Transform player data for components
  const playerForHero = {
    id: player.id,
    name: player.name,
    firstName: player.firstName,
    lastName: player.lastName,
    position: player.position,
    number: player.number || '',
    status: (player.status || 'active') as 'active' | 'injured' | 'rookie' | 'veteran',
    team: player.team
      ? {
          name: player.team.name,
          abbreviation: player.team.abbreviation,
          primaryColor: player.team.primaryColor || '#BF5700',
        }
      : {
          name: 'Free Agent',
          abbreviation: 'FA',
          primaryColor: '#666666',
        },
    headshot:
      player.headshot ||
      'https://a.espncdn.com/combiner/i?img=/i/headshots/nophoto.png&w=350&h=254',
  };

  // Extract key stats from the player data for the season display
  const seasonStats = player.seasonStats?.stats
    ? Object.entries(player.seasonStats.stats)
        .slice(0, 4)
        .map(([key, value]) => ({
          label: formatStatLabel(key),
          value: String(value),
        }))
    : [
        { label: 'Games', value: '-' },
        { label: 'Stats', value: 'Not Available' },
      ];

  const bio = {
    birthDate: player.bio.birthDate,
    birthPlace: player.bio.birthPlace,
    hometown: player.bio.hometown,
    height: typeof player.bio.height === 'string' ? player.bio.height : undefined,
    weight: player.bio.weight ? `${player.bio.weight} lbs` : undefined,
    highSchool: player.bio.highSchool,
    college: player.bio.college,
    draft: player.bio.draft,
  };

  // Helper function to format stat labels
  function formatStatLabel(key: string): string {
    const labels: Record<string, string> = {
      passingYards: 'Pass Yds',
      passingTouchdowns: 'Pass TD',
      completionPercentage: 'Comp %',
      QBR: 'QBR',
      rushingYards: 'Rush Yds',
      rushingTouchdowns: 'Rush TD',
      receivingYards: 'Rec Yds',
      receivingTouchdowns: 'Rec TD',
      tackles: 'Tackles',
      sacks: 'Sacks',
      interceptions: 'INT',
      points: 'Points',
      rebounds: 'Rebounds',
      assists: 'Assists',
      battingAverage: 'AVG',
      homeRuns: 'HR',
      RBI: 'RBI',
      ERA: 'ERA',
    };
    return labels[key] || key.replace(/([A-Z])/g, ' $1').trim();
  }

  // Career stats from API or placeholder
  const careerStats: StatRow[] =
    player.careerStats?.map((s) => ({
      season: String(s.season),
      team: player.team?.abbreviation || '-',
      g: Number(s.stats.games) || 0,
      ...s.stats,
    })) || [];

  const careerTotals: StatRow | undefined =
    careerStats.length > 0
      ? {
          season: 'Career Total',
          team: '-',
          g: careerStats.reduce((sum, s) => sum + (Number(s.g) || 0), 0),
        }
      : undefined;

  // Game log from API or empty array
  const gameLog: GameLogEntry[] = player.gameLog || [];

  // Scouting grades and similar players would come from BSI analytics in the future
  const scoutingGrades: { label: string; value: number }[] = [];
  const similarPlayers: { name: string; team: string; similarity: number }[] = [];
  const news: { date: string; title: string; source: string }[] = [];

  return (
    <main id="main-content">
      {/* Hero */}
      <PlayerHero
        player={playerForHero}
        seasonStats={seasonStats}
        onFollow={() => setIsFollowing(!isFollowing)}
        isFollowing={isFollowing}
      />

      {/* Content */}
      <Section padding="md">
        <Container>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Season Stats */}
              {player.seasonStats && Object.keys(player.seasonStats.stats).length > 0 && (
                <Card variant="default" padding="lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-burnt-orange"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M18 20V10M12 20V4M6 20v-6" />
                      </svg>
                      {player.seasonStats.season} Season Statistics
                    </CardTitle>
                    <Badge variant="default">{sport.toUpperCase()}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {Object.entries(player.seasonStats.stats)
                        .slice(0, 8)
                        .map(([key, value]) => (
                          <div
                            key={key}
                            className="bg-bg-secondary rounded-lg p-4 text-center hover:bg-bg-tertiary transition-colors"
                          >
                            <p className="text-2xl font-bold text-burnt-orange">{String(value)}</p>
                            <p className="text-xs text-text-tertiary uppercase tracking-wide mt-1">
                              {formatStatLabel(key)}
                            </p>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Career Stats */}
              {careerStats.length > 0 && careerTotals && (
                <PlayerStats
                  position={player.position}
                  stats={careerStats}
                  careerTotals={careerTotals}
                />
              )}

              {/* Game Log */}
              {gameLog.length > 0 && <GameLog games={gameLog} sport={sport} />}

              {/* Scouting Report */}
              <Card variant="default" padding="lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-burnt-orange"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                    BSI Scouting Report
                  </CardTitle>
                  <Badge variant="default">NFL Rookie</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {scoutingGrades.map((grade) => (
                      <div key={grade.label} className="flex items-center gap-4">
                        <span className="w-32 text-sm text-text-secondary">{grade.label}</span>
                        <div className="flex-1 h-2.5 bg-bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-burnt-orange to-ember rounded-full transition-all duration-500"
                            style={{ width: `${grade.value}%` }}
                          />
                        </div>
                        <span
                          className={`w-10 text-right font-bold ${
                            grade.value >= 80
                              ? 'text-burnt-orange'
                              : grade.value >= 70
                                ? 'text-gold'
                                : 'text-text-secondary'
                          }`}
                        >
                          {grade.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-gradient-to-r from-burnt-orange/10 to-gold/10 rounded-lg border border-burnt-orange/20">
                    <p className="text-xs text-burnt-orange font-semibold uppercase tracking-wide mb-2">
                      BSI Analysis
                    </p>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      Ewers possesses elite arm talent with NFL-caliber velocity and accuracy. As a
                      rookie, he&apos;s shown flashes of the potential that made him a
                      highly-recruited prospect, but is still adjusting to the speed of the
                      professional game. His pocket presence and deep ball accuracy remain
                      strengths, while decision-making under pressure is an area for continued
                      development.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Bio */}
              <PlayerBio bio={bio} />

              {/* Similar Players */}
              <Card variant="default" padding="lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-burnt-orange"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    Similar Players
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {similarPlayers.map((player) => (
                      <div
                        key={player.name}
                        className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg hover:bg-bg-tertiary transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center text-text-tertiary">
                            <svg
                              className="w-5 h-5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-white text-sm">{player.name}</p>
                            <p className="text-xs text-text-tertiary">{player.team}</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 bg-burnt-orange/20 text-burnt-orange text-xs font-semibold rounded-lg border border-burnt-orange/30">
                          {player.similarity}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent News */}
              <Card variant="default" padding="lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-burnt-orange"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1" />
                      <path d="M18 14h-8" />
                      <path d="M15 18h-5" />
                      <path d="M10 10H8" />
                      <circle cx="20" cy="8" r="2" />
                    </svg>
                    Latest News
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {news.map((item, idx) => (
                      <div
                        key={idx}
                        className="pb-4 border-b border-border-subtle last:border-0 last:pb-0 hover:bg-bg-secondary/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                      >
                        <p className="text-xs text-text-tertiary mb-1">{item.date}</p>
                        <p className="text-sm text-white font-medium leading-snug">{item.title}</p>
                        <p className="text-xs text-burnt-orange mt-1">{item.source}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card variant="default" padding="lg">
                <CardContent>
                  <div className="space-y-3">
                    <Link
                      href="/win-probability"
                      className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg hover:bg-bg-tertiary transition-colors"
                    >
                      <span className="text-sm text-white">Win Probability Tool</span>
                      <svg
                        className="w-4 h-4 text-text-tertiary"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </Link>
                    <Link
                      href="/nfl"
                      className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg hover:bg-bg-tertiary transition-colors"
                    >
                      <span className="text-sm text-white">NFL Scores & Standings</span>
                      <svg
                        className="w-4 h-4 text-text-tertiary"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section padding="md" background="charcoal" borderTop>
        <Container>
          <div className="text-center">
            <p className="text-text-secondary mb-4">
              Want advanced player analytics and scouting reports?
            </p>
            <Link
              href="/pricing"
              className="inline-flex px-6 py-3 bg-burnt-orange text-white rounded-lg font-semibold hover:bg-burnt-orange/90 transition-colors"
            >
              Upgrade to BSI Pro
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}
