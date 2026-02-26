'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { SkeletonScoreCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { SpringTrainingLeagueFilter } from '@/components/sports/SpringTrainingLeagueFilter';
import { SpringTrainingStandingsTable } from '@/components/sports/SpringTrainingStandingsTable';
import { useSportData } from '@/lib/hooks/useSportData';
import { formatTimestamp } from '@/lib/utils/timezone';

type LeagueFilter = 'all' | 'Cactus' | 'Grapefruit';

interface STStandingsTeam {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  league: 'Cactus' | 'Grapefruit' | null;
  wins: number;
  losses: number;
  winPct: number;
  runsFor?: number;
  runsAgainst?: number;
}

export default function SpringTrainingStandingsPage() {
  const [league, setLeague] = useState<LeagueFilter>('all');

  const { data, loading, error, retry } = useSportData<{
    cactus: STStandingsTeam[];
    grapefruit: STStandingsTeam[];
    meta?: { lastUpdated?: string; dataSource?: string };
  }>('/api/mlb/spring-training/standings');

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
              <span className="text-text-primary font-medium">Standings</span>
            </nav>
          </Container>
        </Section>

        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-display text-gradient-blaze">
                  Spring Training Standings
                </h1>
                <p className="text-text-secondary mt-2">
                  2026 Cactus &amp; Grapefruit League standings
                </p>
              </div>
              <SpringTrainingLeagueFilter value={league} onChange={setLeague} />
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <SkeletonScoreCard key={i} />)}
              </div>
            ) : error ? (
              <Card variant="default" padding="lg">
                <EmptyState type="error" onRetry={retry} />
              </Card>
            ) : (
              <ScrollReveal>
                <div className="space-y-8">
                  {(league === 'all' || league === 'Cactus') && (
                    <SpringTrainingStandingsTable
                      title="Cactus League"
                      teams={data?.cactus ?? []}
                    />
                  )}
                  {(league === 'all' || league === 'Grapefruit') && (
                    <SpringTrainingStandingsTable
                      title="Grapefruit League"
                      teams={data?.grapefruit ?? []}
                    />
                  )}
                  <div className="pt-4 border-t border-border-subtle">
                    <DataSourceBadge
                      source={data?.meta?.dataSource ?? 'ESPN'}
                      timestamp={formatTimestamp(data?.meta?.lastUpdated)}
                    />
                  </div>
                </div>
              </ScrollReveal>
            )}
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
