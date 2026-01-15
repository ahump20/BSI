'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, LiveBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { CitationFooter, DataDisclaimer } from '@/components/sports';

interface SportSection {
  id: string;
  name: string;
  href: string;
  icon: string;
  description: string;
  liveCount: number;
  todayCount: number;
  season: string;
  isActive: boolean;
}

export default function ScoresHubPage() {
  const [sports, setSports] = useState<SportSection[]>([
    {
      id: 'college-baseball',
      name: 'College Baseball',
      href: '/college-baseball/scores',
      icon: '⚾',
      description: 'All 300+ D1 programs — live scores, box scores, and recaps',
      liveCount: 0,
      todayCount: 0,
      season: 'Feb - Jun',
      isActive: false, // Will check API
    },
    {
      id: 'mlb',
      name: 'MLB',
      href: '/mlb/scores',
      icon: '⚾',
      description: 'Real-time MLB scores from the official Stats API',
      liveCount: 0,
      todayCount: 0,
      season: 'Mar - Oct',
      isActive: true,
    },
    {
      id: 'nfl',
      name: 'NFL',
      href: '/nfl/scores',
      icon: '🏈',
      description: 'NFL scores, standings, and game analysis',
      liveCount: 0,
      todayCount: 0,
      season: 'Sep - Feb',
      isActive: false,
    },
    {
      id: 'nba',
      name: 'NBA',
      href: '/nba/scores',
      icon: '🏀',
      description: 'NBA scores and standings',
      liveCount: 0,
      todayCount: 0,
      season: 'Oct - Jun',
      isActive: false,
    },
  ]);

  const [totalLive, setTotalLive] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLiveCounts() {
      try {
        // Fetch MLB live count
        const mlbRes = await fetch('/api/mlb/scores');
        if (mlbRes.ok) {
          const mlbData = (await mlbRes.json()) as {
            games?: Array<{ status?: { isLive?: boolean } }>;
          };
          const mlbLive =
            mlbData.games?.filter((g: { status?: { isLive?: boolean } }) => g.status?.isLive)
              .length || 0;
          const mlbTotal = mlbData.games?.length || 0;

          setSports((prev) =>
            prev.map((s) =>
              s.id === 'mlb'
                ? { ...s, liveCount: mlbLive, todayCount: mlbTotal, isActive: mlbTotal > 0 }
                : s
            )
          );
          setTotalLive((prev) => prev + mlbLive);
        }
      } catch (e) {
        // Ignore errors, show default state
      }

      try {
        // Fetch College Baseball count
        const cbRes = await fetch('/api/college-baseball/schedule');
        if (cbRes.ok) {
          const cbData = (await cbRes.json()) as {
            data?: Array<{ status?: string }>;
            games?: Array<{ status?: string }>;
          };
          const games = cbData.data || cbData.games || [];
          const cbLive = games.filter((g: { status?: string }) => g.status === 'live').length;
          const cbTotal = games.length;

          setSports((prev) =>
            prev.map((s) =>
              s.id === 'college-baseball'
                ? { ...s, liveCount: cbLive, todayCount: cbTotal, isActive: cbTotal > 0 }
                : s
            )
          );
          setTotalLive((prev) => prev + cbLive);
        }
      } catch (e) {
        // Ignore errors
      }

      setLoading(false);
    }

    fetchLiveCounts();

    // Refresh every 60 seconds
    const interval = setInterval(fetchLiveCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  const hasAnyLive = totalLive > 0;

  return (
    <>
      <main id="main-content">
        {/* Header */}
        <Section padding="lg" className="relative overflow-hidden pt-24">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />

          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="primary">All Sports</Badge>
                {hasAnyLive && <LiveBadge />}
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-display text-gradient-blaze">
                Live Scores
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary mt-4 text-lg max-w-2xl">
                Real-time scores across MLB, NFL, NBA, and 300+ college baseball programs. The
                coverage ESPN won&apos;t give you.
              </p>
            </ScrollReveal>

            {hasAnyLive && (
              <ScrollReveal direction="up" delay={200}>
                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-success/20 rounded-lg border border-success/30">
                  <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  <span className="text-success font-semibold">
                    {totalLive} game{totalLive !== 1 ? 's' : ''} live now
                  </span>
                </div>
              </ScrollReveal>
            )}
          </Container>
        </Section>

        {/* Sports Grid */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <div className="grid gap-6 md:grid-cols-2">
              {sports.map((sport, index) => (
                <ScrollReveal key={sport.id} direction="up" delay={index * 100}>
                  <Link href={sport.href} className="block h-full">
                    <Card
                      variant="hover"
                      padding="lg"
                      className={`h-full transition-all ${
                        sport.liveCount > 0 ? 'border-success/50 bg-success/5' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{sport.icon}</span>
                          <div>
                            <h2 className="text-xl font-display font-bold text-white">
                              {sport.name}
                            </h2>
                            <p className="text-xs text-text-tertiary">Season: {sport.season}</p>
                          </div>
                        </div>

                        {sport.liveCount > 0 ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-success/20 rounded-full">
                            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                            <span className="text-success text-sm font-semibold">
                              {sport.liveCount} Live
                            </span>
                          </div>
                        ) : sport.todayCount > 0 ? (
                          <Badge variant="primary">{sport.todayCount} Today</Badge>
                        ) : (
                          <Badge variant="default">View</Badge>
                        )}
                      </div>

                      <p className="text-text-secondary text-sm mb-4">{sport.description}</p>

                      <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                        <span className="text-burnt-orange text-sm font-semibold hover:text-ember transition-colors">
                          View Scores →
                        </span>

                        {loading ? (
                          <span className="text-xs text-text-tertiary">Loading...</span>
                        ) : sport.todayCount > 0 ? (
                          <span className="text-xs text-text-tertiary">
                            {sport.todayCount} game{sport.todayCount !== 1 ? 's' : ''} today
                          </span>
                        ) : (
                          <span className="text-xs text-text-tertiary">
                            {sport.isActive ? 'No games today' : 'Off-season'}
                          </span>
                        )}
                      </div>
                    </Card>
                  </Link>
                </ScrollReveal>
              ))}
            </div>

            {/* Quick Links */}
            <ScrollReveal direction="up" delay={400}>
              <div className="mt-12 p-6 bg-graphite rounded-lg border border-border-subtle">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Access</h3>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/college-baseball/scores"
                    className="px-4 py-2 bg-burnt-orange/20 hover:bg-burnt-orange/30 text-burnt-orange rounded-lg text-sm font-medium transition-colors"
                  >
                    College Baseball Scores
                  </Link>
                  <Link
                    href="/mlb/scores"
                    className="px-4 py-2 bg-burnt-orange/20 hover:bg-burnt-orange/30 text-burnt-orange rounded-lg text-sm font-medium transition-colors"
                  >
                    MLB Scores
                  </Link>
                  <Link
                    href="/nfl/scores"
                    className="px-4 py-2 bg-burnt-orange/20 hover:bg-burnt-orange/30 text-burnt-orange rounded-lg text-sm font-medium transition-colors"
                  >
                    NFL Scores
                  </Link>
                  <Link
                    href="/nba/scores"
                    className="px-4 py-2 bg-burnt-orange/20 hover:bg-burnt-orange/30 text-burnt-orange rounded-lg text-sm font-medium transition-colors"
                  >
                    NBA Scores
                  </Link>
                  <Link
                    href="/college-baseball/standings"
                    className="px-4 py-2 bg-charcoal hover:bg-slate text-text-secondary hover:text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    College Baseball Standings
                  </Link>
                  <Link
                    href="/nil-valuation"
                    className="px-4 py-2 bg-charcoal hover:bg-slate text-text-secondary hover:text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    NIL Valuations
                  </Link>
                </div>
              </div>
            </ScrollReveal>

            {/* Data Attribution */}
            <CitationFooter
              source="MLB Stats API"
              fetchedAt={new Date().toISOString()}
              additionalSources={['ESPN', 'NCAA.org', 'D1Baseball']}
              showFreshness={false}
              className="mt-8"
            />
            <DataDisclaimer className="mt-4" />
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
