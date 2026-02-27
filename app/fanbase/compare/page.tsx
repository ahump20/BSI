'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

interface CompareResult {
  teamA: { name: string; sentiment: number; trend: string; followers: number };
  teamB: { name: string; sentiment: number; trend: string; followers: number };
}

export default function FanbaseComparePage() {
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    if (!teamA.trim() || !teamB.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/fanbase/compare?teamA=${encodeURIComponent(teamA)}&teamB=${encodeURIComponent(teamB)}`);
      if (!res.ok) throw new Error('Comparison not available');
      const data = await res.json() as CompareResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div>
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/" className="text-text-tertiary hover:text-burnt-orange transition-colors">
                Home
              </Link>
              <span className="text-text-tertiary">/</span>
              <Link href="/fanbase" className="text-text-tertiary hover:text-burnt-orange transition-colors">
                Fanbase
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-text-primary font-medium">Compare</span>
            </nav>
          </Container>
        </Section>

        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
          <Container center>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">Head-to-Head</Badge>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display text-gradient-blaze mb-4 text-center">
                Compare Fanbases
              </h1>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary max-w-xl mx-auto text-center">
                Pick two teams and compare fan sentiment, engagement, and community pulse side by side.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <Card variant="default" padding="lg" className="max-w-2xl mx-auto">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="teamA" className="block text-sm font-semibold text-text-secondary mb-2">
                    Team A
                  </label>
                  <input
                    id="teamA"
                    type="text"
                    value={teamA}
                    onChange={(e) => setTeamA(e.target.value)}
                    placeholder="e.g. Texas Longhorns"
                    className="w-full px-4 py-3 bg-background-tertiary border border-border-subtle rounded-lg text-text-primary placeholder-text-tertiary focus:border-burnt-orange focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="teamB" className="block text-sm font-semibold text-text-secondary mb-2">
                    Team B
                  </label>
                  <input
                    id="teamB"
                    type="text"
                    value={teamB}
                    onChange={(e) => setTeamB(e.target.value)}
                    placeholder="e.g. Oklahoma Sooners"
                    className="w-full px-4 py-3 bg-background-tertiary border border-border-subtle rounded-lg text-text-primary placeholder-text-tertiary focus:border-burnt-orange focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                onClick={handleCompare}
                disabled={!teamA.trim() || !teamB.trim() || loading}
                className="w-full py-3 bg-burnt-orange text-white rounded-lg font-semibold uppercase tracking-wider hover:bg-burnt-orange/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Comparing...' : 'Compare'}
              </button>

              {error && (
                <div className="mt-6 text-center">
                  <p className="text-text-tertiary text-sm">{error}</p>
                  <p className="text-text-tertiary text-xs mt-1">
                    Fanbase comparison data will be available once the sentiment tracker is active.
                  </p>
                </div>
              )}

              {result && (
                <div className="mt-8 grid md:grid-cols-2 gap-6">
                  {[result.teamA, result.teamB].map((team, i) => (
                    <Card key={i} variant="default" padding="md" className="text-center">
                      <h3 className="font-display text-lg font-bold text-text-primary uppercase mb-3">
                        {team.name}
                      </h3>
                      <div className="text-3xl font-bold font-mono text-burnt-orange mb-1">
                        {team.sentiment.toFixed(1)}
                      </div>
                      <p className="text-text-tertiary text-xs">
                        {team.followers.toLocaleString()} tracked interactions
                      </p>
                    </Card>
                  ))}
                </div>
              )}

              {!result && !error && !loading && (
                <div className="mt-8 text-center py-6">
                  <p className="text-text-tertiary text-sm">
                    Enter two team names above to compare their fanbase sentiment and engagement metrics.
                  </p>
                </div>
              )}
            </Card>
          </Container>
        </Section>
      </div>

      <Footer />
    </>
  );
}
