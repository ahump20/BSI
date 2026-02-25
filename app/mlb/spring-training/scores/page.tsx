'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge, LiveBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { SkeletonScoreCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { GameScoreCard } from '@/components/sports/GameScoreCard';
import { SpringTrainingLeagueFilter } from '@/components/sports/SpringTrainingLeagueFilter';
import { useSportData } from '@/lib/hooks/useSportData';
import { formatTimestamp } from '@/lib/utils/timezone';

type LeagueFilter = 'all' | 'Cactus' | 'Grapefruit';

interface STGame {
  id: string;
  name: string;
  date: string;
  status: { type?: { state?: string; description?: string } };
  league: 'Cactus' | 'Grapefruit' | null;
  home: { id: string; name: string; abbreviation: string; score: string; logo: string };
  away: { id: string; name: string; abbreviation: string; score: string; logo: string };
}

export default function SpringTrainingScoresPage() {
  const [league, setLeague] = useState<LeagueFilter>('all');
  const [dateOffset, setDateOffset] = useState(0);

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + dateOffset);
  const dateStr = targetDate.toISOString().split('T')[0];

  const { data, loading, error, retry } = useSportData<{
    games: STGame[];
    meta?: { lastUpdated?: string; dataSource?: string };
  }>(`/api/mlb/spring-training/scores?date=${dateStr}`, {
    refreshInterval: 30_000,
  });

  const games = data?.games ?? [];
  const filtered = league === 'all' ? games : games.filter((g) => g.league === league);
  const hasLive = games.some((g) => g.status?.type?.state === 'in');

  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/mlb" className="text-text-tertiary hover:text-burnt-orange transition-colors">MLB</Link>
              <span className="text-text-tertiary">/</span>
              <Link href="/mlb/spring-training" className="text-text-tertiary hover:text-burnt-orange transition-colors">Spring Training</Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-white font-medium">Scores</span>
            </nav>
          </Container>
        </Section>

        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-display text-gradient-blaze">
                  Spring Training Scores
                </h1>
                <p className="text-text-secondary mt-2">
                  {targetDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    timeZone: 'America/Chicago',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <SpringTrainingLeagueFilter value={league} onChange={setLeague} />
                {hasLive && <LiveBadge />}
              </div>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => setDateOffset((d) => d - 1)}
                className="px-3 py-1.5 bg-graphite rounded-lg text-text-secondary hover:text-white text-sm transition-colors"
              >
                &larr; Previous
              </button>
              <button
                onClick={() => setDateOffset(0)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  dateOffset === 0
                    ? 'bg-burnt-orange text-white'
                    : 'bg-graphite text-text-secondary hover:text-white'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDateOffset((d) => d + 1)}
                className="px-3 py-1.5 bg-graphite rounded-lg text-text-secondary hover:text-white text-sm transition-colors"
              >
                Next &rarr;
              </button>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => <SkeletonScoreCard key={i} />)}
              </div>
            ) : error ? (
              <Card variant="default" padding="lg">
                <EmptyState type="error" onRetry={retry} />
              </Card>
            ) : filtered.length === 0 ? (
              <Card variant="default" padding="lg">
                <EmptyState type="no-games" sport="Spring Training" />
              </Card>
            ) : (
              <ScrollReveal>
                <Card variant="default" padding="lg">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{filtered.length} Game{filtered.length !== 1 ? 's' : ''}</span>
                      {league !== 'all' && <Badge variant={league === 'Cactus' ? 'warning' : 'success'}>{league} League</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {filtered.map((game) => (
                        <div key={game.id} className="relative">
                          {game.league && (
                            <Badge
                              variant={game.league === 'Cactus' ? 'warning' : 'success'}
                              className="absolute -top-2 right-2 text-[10px] z-10"
                            >
                              {game.league}
                            </Badge>
                          )}
                          <GameScoreCard
                            game={{
                              id: game.id,
                              away: { name: game.away.name, score: Number(game.away.score) || 0 },
                              home: { name: game.home.name, score: Number(game.home.score) || 0 },
                              status: game.status?.type?.description ?? 'Scheduled',
                              isLive: game.status?.type?.state === 'in',
                              isFinal: game.status?.type?.state === 'post',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-border-subtle">
                      <DataSourceBadge
                        source={data?.meta?.dataSource ?? 'ESPN'}
                        timestamp={formatTimestamp(data?.meta?.lastUpdated)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            )}
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
