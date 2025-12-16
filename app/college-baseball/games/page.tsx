'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, LiveBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'Games', href: '/college-baseball/games' },
  { label: 'Standings', href: '/college-baseball/standings' },
];

interface Game {
  id: string;
  date: string;
  time: string;
  status: 'scheduled' | 'live' | 'final' | 'postponed' | 'canceled';
  inning?: number;
  homeTeam: {
    id: string;
    name: string;
    shortName: string;
    conference: string;
    score: number | null;
    record: { wins: number; losses: number };
    logo?: string;
  };
  awayTeam: {
    id: string;
    name: string;
    shortName: string;
    conference: string;
    score: number | null;
    record: { wins: number; losses: number };
    logo?: string;
  };
  venue: string;
  tv?: string;
  situation?: string;
}

const conferences = ['All', 'SEC', 'ACC', 'Big 12', 'Big Ten', 'Pac-12'];

export default function CollegeBaseballGamesPage() {
  const [selectedConference, setSelectedConference] = useState('All');
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGames() {
      try {
        setLoading(true);
        const confParam = selectedConference !== 'All' ? '&conference=' + selectedConference : '';
        const response = await fetch('/api/college-baseball/schedule?' + confParam);
        const result = await response.json();

        if (result.success && result.data) {
          setGames(result.data);
          setLastUpdated(result.timestamp || new Date().toISOString());
          setError(null);
        } else {
          setError(result.message || 'Failed to fetch games');
        }
      } catch (err) {
        setError('Failed to load games. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchGames();

    // Refresh every 30 seconds for live games
    const interval = setInterval(fetchGames, 30000);
    return () => clearInterval(interval);
  }, [selectedConference]);

  const filteredGames = games;

  return (
    <>
      <Navbar items={navItems} />

      <main id="main-content">
        <Section padding="lg" className="pt-24">
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href="/college-baseball"
                  className="text-text-tertiary hover:text-burnt-orange transition-colors"
                >
                  College Baseball
                </Link>
                <span className="text-text-tertiary">/</span>
                <span className="text-white">Games</span>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
                <div>
                  <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display">
                    Today&apos;s <span className="text-gradient-blaze">Games</span>
                  </h1>
                  <p className="text-text-secondary mt-2">
                    Live scores and results for NCAA Division I baseball
                  </p>
                </div>
                <LiveBadge />
              </div>
            </ScrollReveal>

            {/* Conference Filter */}
            <ScrollReveal direction="up" delay={100}>
              <div className="flex flex-wrap gap-2 mb-8">
                {conferences.map((conf) => (
                  <button
                    key={conf}
                    onClick={() => setSelectedConference(conf)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedConference === conf
                        ? 'bg-burnt-orange text-white'
                        : 'bg-charcoal text-text-secondary hover:text-white hover:bg-slate'
                    }`}
                  >
                    {conf}
                  </button>
                ))}
              </div>
            </ScrollReveal>

            {/* Loading State */}
            {loading && games.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-burnt-orange mb-4"></div>
                <p className="text-text-secondary">Loading games...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <Card padding="lg" className="text-center">
                <p className="text-warning mb-4">{error}</p>
                <p className="text-text-tertiary text-sm">
                  College baseball season runs February through June. Check back during the season
                  for live games.
                </p>
              </Card>
            )}

            {/* No Games State */}
            {!loading && !error && games.length === 0 && (
              <Card padding="lg" className="text-center">
                <p className="text-text-secondary mb-2">No games scheduled for today.</p>
                <p className="text-text-tertiary text-sm">
                  College baseball season runs February through June. Check back during the season
                  for live games.
                </p>
              </Card>
            )}

            {/* Games Grid */}
            {games.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGames.map((game, index) => (
                  <ScrollReveal key={game.id} direction="up" delay={Math.min(index * 50, 300)}>
                    <Card variant="hover" padding="md" className="h-full">
                      {/* Status Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="default">
                          {game.homeTeam.conference || game.awayTeam.conference}
                        </Badge>
                        {game.status === 'live' ? (
                          <LiveBadge />
                        ) : game.status === 'final' ? (
                          <Badge variant="default">Final</Badge>
                        ) : game.status === 'postponed' ? (
                          <Badge variant="warning">Postponed</Badge>
                        ) : (
                          <Badge variant="primary">{game.time}</Badge>
                        )}
                      </div>

                      {/* Teams */}
                      <div className="space-y-3">
                        {/* Away Team */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{game.awayTeam.name}</span>
                            {game.awayTeam.record && (
                              <span className="text-xs text-text-tertiary">
                                ({game.awayTeam.record.wins}-{game.awayTeam.record.losses})
                              </span>
                            )}
                          </div>
                          {game.awayTeam.score !== null && (
                            <span
                              className={`font-display text-xl font-bold ${
                                game.status === 'final' &&
                                game.awayTeam.score > (game.homeTeam.score ?? 0)
                                  ? 'text-success'
                                  : 'text-white'
                              }`}
                            >
                              {game.awayTeam.score}
                            </span>
                          )}
                        </div>

                        {/* Home Team */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{game.homeTeam.name}</span>
                            {game.homeTeam.record && (
                              <span className="text-xs text-text-tertiary">
                                ({game.homeTeam.record.wins}-{game.homeTeam.record.losses})
                              </span>
                            )}
                          </div>
                          {game.homeTeam.score !== null && (
                            <span
                              className={`font-display text-xl font-bold ${
                                game.status === 'final' &&
                                game.homeTeam.score > (game.awayTeam.score ?? 0)
                                  ? 'text-success'
                                  : 'text-white'
                              }`}
                            >
                              {game.homeTeam.score}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Venue */}
                      {game.venue && game.venue !== 'TBD' && (
                        <div className="mt-4 pt-4 border-t border-border-subtle">
                          <span className="text-xs text-text-tertiary">{game.venue}</span>
                        </div>
                      )}

                      {/* Inning indicator for live games */}
                      {game.status === 'live' && game.inning && (
                        <div className="mt-2">
                          <span className="text-sm text-burnt-orange font-semibold">
                            Inning {game.inning}
                          </span>
                          {game.situation && (
                            <span className="text-sm text-text-tertiary ml-2">
                              {game.situation}
                            </span>
                          )}
                        </div>
                      )}

                      {/* TV Info */}
                      {game.tv && (
                        <div className="mt-2">
                          <Badge variant="default" className="text-xs">
                            {game.tv}
                          </Badge>
                        </div>
                      )}
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            )}

            {/* Data Attribution */}
            <div className="mt-12 text-center text-xs text-text-tertiary">
              <p>
                Data sourced from ESPN College Baseball API. Updated every 30 seconds during live
                games.
              </p>
              {lastUpdated && (
                <p className="mt-1">
                  Last updated:{' '}
                  {new Date(lastUpdated).toLocaleString('en-US', { timeZone: 'America/Chicago' })}{' '}
                  CT
                </p>
              )}
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
