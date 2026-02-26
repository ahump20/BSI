'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

interface FanbaseSentiment {
  team: string;
  teamSlug: string;
  sport: string;
  sentiment: number;
  trend: 'up' | 'down' | 'neutral';
  sampleSize: number;
}

interface FanbaseResponse {
  meta: { source: string; lastUpdated: string };
  teams: FanbaseSentiment[];
}

export default function FanbaseHubPage() {
  const [teams, setTeams] = useState<FanbaseSentiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSentiment() {
      try {
        const res = await fetch('/api/fanbase/sentiment');
        if (!res.ok) throw new Error('Failed to fetch sentiment data');
        const data: FanbaseResponse = await res.json();
        setTeams(data.teams || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchSentiment();
  }, []);

  const trendIcon = (trend: string) => {
    if (trend === 'up') return <span className="text-success">&#9650;</span>;
    if (trend === 'down') return <span className="text-error">&#9660;</span>;
    return <span className="text-text-tertiary">&#8212;</span>;
  };

  return (
    <>
      <main id="main-content">
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/" className="text-text-tertiary hover:text-burnt-orange transition-colors">
                Home
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-text-primary font-medium">Fanbase</span>
            </nav>
          </Container>
        </Section>

        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">Fan Intelligence</Badge>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display text-gradient-blaze mb-4">
                Fanbase Sentiment
              </h1>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary max-w-2xl">
                Real-time pulse of fan communities across college and professional sports. Sentiment tracking powered by BSI analytics.
              </p>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={200}>
              <div className="mt-6">
                <Link
                  href="/fanbase/compare"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-burnt-orange text-white rounded-lg font-semibold hover:bg-burnt-orange/80 transition-colors"
                >
                  Compare Fanbases
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-background-tertiary rounded-lg p-6 animate-pulse">
                    <div className="h-5 bg-surface-secondary rounded w-1/2 mb-3" />
                    <div className="h-8 bg-surface-secondary rounded w-1/3 mb-2" />
                    <div className="h-4 bg-surface-secondary rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <Card variant="default" padding="lg" className="text-center">
                <p className="text-text-secondary mb-2">Unable to load sentiment data</p>
                <p className="text-text-tertiary text-sm">{error}</p>
              </Card>
            ) : teams.length === 0 ? (
              <Card variant="default" padding="lg" className="text-center">
                <div className="py-8">
                  <div className="text-4xl mb-4">&#128293;</div>
                  <h2 className="text-xl font-bold text-text-primary mb-2">Fanbase Tracker Coming Soon</h2>
                  <p className="text-text-tertiary text-sm max-w-md mx-auto">
                    Fan sentiment data will populate here once the BSI Fanbase Updater worker is active.
                    Real-time polling captures the pulse of fan communities across every major sport.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {teams.map((team) => (
                  <ScrollReveal key={team.teamSlug}>
                    <Link href={`/fanbase/${team.teamSlug}`} className="block">
                      <Card variant="hover" padding="md">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-display text-lg font-bold text-text-primary uppercase">
                            {team.team}
                          </h3>
                          <Badge variant="secondary" size="sm">{team.sport}</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold font-mono text-burnt-orange">
                            {team.sentiment.toFixed(1)}
                          </span>
                          {trendIcon(team.trend)}
                        </div>
                        <p className="text-text-tertiary text-xs mt-2">
                          Based on {team.sampleSize.toLocaleString()} data points
                        </p>
                      </Card>
                    </Link>
                  </ScrollReveal>
                ))}
              </div>
            )}
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
