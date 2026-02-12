'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge, LiveBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { formatTimestamp } from '@/lib/utils/timezone';

interface ESPNGame {
  id: string;
  name: string;
  shortName: string;
  date: string;
  status: {
    type?: { completed?: boolean; description?: string };
    displayClock?: string;
    period?: number;
  };
  teams: Array<{
    id: string;
    team: {
      id: string;
      displayName: string;
      abbreviation: string;
      logo?: string;
      logos?: Array<{ href: string }>;
    };
    score?: string;
    homeAway: string;
    winner?: boolean;
    records?: Array<{ summary: string }>;
  }>;
  venue?: { fullName?: string };
}

function getDateOffset(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().split('T')[0];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    timeZone: 'America/Chicago',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}


function GameCard({ game }: { game: ESPNGame }) {
  const home = game.teams.find((t) => t.homeAway === 'home');
  const away = game.teams.find((t) => t.homeAway === 'away');
  const isCompleted = game.status?.type?.completed;
  const isLive =
    !isCompleted && game.status?.period && game.status.period > 0;
  const statusText = isLive
    ? `Q${game.status.period} ${game.status.displayClock || ''}`
    : game.status?.type?.description || 'Scheduled';

  return (
    <Card variant="hover" padding="none" className={`overflow-hidden transition-all ${isLive ? 'border-success/50' : ''}`}>
      <div className={`px-4 py-2 flex items-center justify-between ${isLive ? 'bg-success/20' : isCompleted ? 'bg-charcoal' : 'bg-burnt-orange/20'}`}>
        <span className={`text-xs font-semibold uppercase ${isLive ? 'text-success' : isCompleted ? 'text-text-tertiary' : 'text-burnt-orange'}`}>
          {isLive && <span className="inline-block w-2 h-2 bg-success rounded-full animate-pulse mr-1.5" />}
          {statusText}
        </span>
        {game.venue?.fullName && (
          <span className="text-xs text-text-tertiary truncate max-w-[140px]">{game.venue.fullName}</span>
        )}
      </div>
      <div className="p-4 space-y-3">
        {[away, home].map((team) => {
          if (!team) return null;
          const isWinner = isCompleted && team.winner;
          const logoUrl = team.team.logo || team.team.logos?.[0]?.href;
          return (
            <div key={team.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="w-8 h-8 object-contain" />
                ) : (
                  <div className="w-8 h-8 bg-charcoal rounded-full flex items-center justify-center text-xs font-bold text-burnt-orange">
                    {team.team.abbreviation}
                  </div>
                )}
                <div className="min-w-0">
                  <p className={`font-semibold truncate ${isWinner ? 'text-white' : 'text-text-secondary'}`}>
                    {team.team.displayName}
                  </p>
                  {team.records?.[0]?.summary && (
                    <p className="text-xs text-text-tertiary">{team.records[0].summary}</p>
                  )}
                </div>
              </div>
              <span className={`text-2xl font-bold font-mono ${isWinner ? 'text-white' : team.score ? 'text-text-secondary' : 'text-text-tertiary'}`}>
                {team.score ?? '-'}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function CFBScoresPage() {
  const [games, setGames] = useState<ESPNGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(getDateOffset(0));
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchScores = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cfb/scores?date=${date}`);
      if (!res.ok) throw new Error('Failed to fetch scores');
      const data = await res.json() as { games?: ESPNGame[]; meta?: { lastUpdated?: string } };
      setGames(data.games || []);
      setLastUpdated(data.meta?.lastUpdated || new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scores');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScores(selectedDate);
  }, [selectedDate, fetchScores]);

  const hasLive = games.some((g) => !g.status?.type?.completed && g.status?.period && g.status.period > 0);

  useEffect(() => {
    if (hasLive) {
      const interval = setInterval(() => fetchScores(selectedDate), 30000);
      return () => clearInterval(interval);
    }
  }, [hasLive, selectedDate, fetchScores]);

  const dateOptions = [
    { offset: -2, label: formatDate(getDateOffset(-2)) },
    { offset: -1, label: 'Yesterday' },
    { offset: 0, label: 'Today' },
    { offset: 1, label: 'Tomorrow' },
    { offset: 2, label: formatDate(getDateOffset(2)) },
  ];

  return (
    <>
      <main id="main-content">
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/cfb" className="text-text-tertiary hover:text-burnt-orange transition-colors">CFB</Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-white font-medium">Scores</span>
            </nav>
          </Container>
        </Section>

        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
          <Container>
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="primary">Live Scores</Badge>
              {hasLive && <LiveBadge />}
            </div>
            <ScrollReveal direction="up">
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-gradient-blaze">
                College Football Scores
              </h1>
            </ScrollReveal>
          </Container>
        </Section>

        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
              {dateOptions.map((opt) => {
                const val = getDateOffset(opt.offset);
                return (
                  <button
                    key={opt.offset}
                    onClick={() => setSelectedDate(val)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                      selectedDate === val
                        ? 'bg-burnt-orange text-white'
                        : 'bg-graphite text-text-secondary hover:bg-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-40 bg-graphite rounded-lg animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <Card padding="lg" className="bg-error/10 border-error/30">
                <p className="text-error font-semibold">Data Unavailable</p>
                <p className="text-text-secondary text-sm mt-1">{error}</p>
                <button onClick={() => fetchScores(selectedDate)} className="mt-4 px-4 py-2 bg-burnt-orange text-white rounded-lg text-sm">
                  Retry
                </button>
              </Card>
            ) : games.length === 0 ? (
              <Card padding="lg" className="text-center">
                <div className="py-8">
                  <div className="text-6xl mb-4">🏈</div>
                  <p className="text-text-secondary text-lg">No games scheduled for this date</p>
                  <p className="text-text-tertiary text-sm mt-2">College football season typically runs August through January</p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {games.map((game) => (
                  <ScrollReveal key={game.id}>
                    <GameCard game={game} />
                  </ScrollReveal>
                ))}
              </div>
            )}

            <div className="mt-8 pt-4 border-t border-border-subtle">
              <DataSourceBadge source="ESPN CFB" timestamp={formatTimestamp(lastUpdated)} />
              {hasLive && <span className="text-xs text-text-tertiary ml-4">Auto-refreshing every 30s</span>}
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
