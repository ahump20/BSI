'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, FreshnessBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { DataFreshnessIndicator } from '@/components/ui/DataFreshnessIndicator';
import { SPORT_ICONS } from '@/components/icons/SportIcons';

interface SportSection {
  id: string;
  name: string;
  href: string;
  description: string;
  liveCount: number;
  todayCount: number;
  season: string;
  isActive: boolean;
  loaded: boolean;
}

export default function ScoresHubPage() {
  const [sports, setSports] = useState<SportSection[]>([
    {
      id: 'college-baseball',
      name: 'College Baseball',
      href: '/college-baseball/scores',
      description: 'All 300+ D1 programs — live scores, box scores, and recaps',
      liveCount: 0,
      todayCount: 0,
      season: 'Feb - Jun',
      isActive: false,
      loaded: false,
    },
    {
      id: 'mlb',
      name: 'MLB',
      href: '/mlb/scores',
      description: 'Real-time MLB scores from the official Stats API',
      liveCount: 0,
      todayCount: 0,
      season: 'Mar - Oct',
      isActive: true,
      loaded: false,
    },
    {
      id: 'nfl',
      name: 'NFL',
      href: '/nfl',
      description: 'NFL scores, standings, and game analysis',
      liveCount: 0,
      todayCount: 0,
      season: 'Sep - Feb',
      isActive: false,
      loaded: false,
    },
    {
      id: 'nba',
      name: 'NBA',
      href: '/nba',
      description: 'NBA scores and standings',
      liveCount: 0,
      todayCount: 0,
      season: 'Oct - Jun',
      isActive: false,
      loaded: false,
    },
  ]);

  const [totalLive, setTotalLive] = useState(0);
  const [fetchedAt, setFetchedAt] = useState('');

  useEffect(() => {
    async function fetchLiveCounts() {
      try {
      const [mlbResult, cbResult, nflResult, nbaResult] = await Promise.allSettled([
        fetch('/api/mlb/scores').then(r => r.ok ? r.json() as Promise<{ games?: Array<{ status?: { isLive?: boolean } }> }> : null),
        fetch('/api/college-baseball/schedule').then(r => r.ok ? r.json() as Promise<{ data?: Array<{ status?: string }>; games?: Array<{ status?: string }> }> : null),
        fetch('/api/nfl/scores').then(r => r.ok ? r.json() as Promise<{ games?: Array<{ status?: { type?: { completed?: boolean }; period?: number } }> }> : null),
        fetch('/api/nba/scoreboard').then(r => r.ok ? r.json() as Promise<{ games?: Array<{ status?: { type?: { completed?: boolean }; period?: number } }> }> : null),
      ]);

      let live = 0;

      setSports((prev) => prev.map((s) => {
        if (s.id === 'mlb' && mlbResult.status === 'fulfilled' && mlbResult.value) {
          const mlbData = mlbResult.value;
          const mlbLive = mlbData.games?.filter(g => g.status?.isLive).length || 0;
          const mlbTotal = mlbData.games?.length || 0;
          live += mlbLive;
          return { ...s, liveCount: mlbLive, todayCount: mlbTotal, isActive: mlbTotal > 0, loaded: true };
        }
        if (s.id === 'college-baseball' && cbResult.status === 'fulfilled' && cbResult.value) {
          const cbData = cbResult.value;
          const games = cbData.data || cbData.games || [];
          const cbLive = games.filter(g => g.status === 'live').length;
          const cbTotal = games.length;
          live += cbLive;
          return { ...s, liveCount: cbLive, todayCount: cbTotal, isActive: cbTotal > 0, loaded: true };
        }
        if (s.id === 'nfl' && nflResult.status === 'fulfilled' && nflResult.value) {
          const nflGames = nflResult.value.games || [];
          const nflLive = nflGames.filter(g => !g.status?.type?.completed && g.status?.period && g.status.period > 0).length;
          const nflTotal = nflGames.length;
          live += nflLive;
          return { ...s, liveCount: nflLive, todayCount: nflTotal, isActive: nflTotal > 0, loaded: true };
        }
        if (s.id === 'nba' && nbaResult.status === 'fulfilled' && nbaResult.value) {
          const nbaGames = nbaResult.value.games || [];
          const nbaLive = nbaGames.filter(g => !g.status?.type?.completed && g.status?.period && g.status.period > 0).length;
          const nbaTotal = nbaGames.length;
          live += nbaLive;
          return { ...s, liveCount: nbaLive, todayCount: nbaTotal, isActive: nbaTotal > 0, loaded: true };
        }
        return { ...s, loaded: true };
      }));

      setTotalLive(live);
      setFetchedAt(new Date().toISOString());
      } catch {
        // Mark all sports as loaded even on failure to avoid infinite loading state
        setSports((prev) => prev.map((s) => ({ ...s, loaded: true })));
      }
    }

    fetchLiveCounts();

    // Refresh every 60 seconds
    const interval = setInterval(fetchLiveCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  const hasAnyLive = totalLive > 0;

  return (
    <>
      <div>
        {/* Header */}
        <Section padding="lg" className="relative overflow-hidden pt-6">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />

          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="primary">All Sports</Badge>
                {hasAnyLive && <FreshnessBadge isLive fetchedAt={fetchedAt} />}
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
                          <span className="text-text-secondary">
                            {(() => { const Icon = SPORT_ICONS[sport.id]; return Icon ? <Icon /> : null; })()}
                          </span>
                          <div>
                            <h2 className="text-xl font-display font-bold text-text-primary">
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

                        {!sport.loaded ? (
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
              <div className="mt-12 p-6 bg-background-tertiary rounded-lg border border-border-subtle">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Access</h3>
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
                    href="/college-baseball/standings"
                    className="px-4 py-2 bg-charcoal hover:bg-slate text-text-secondary hover:text-text-primary rounded-lg text-sm font-medium transition-colors"
                  >
                    College Baseball Standings
                  </Link>
                  <Link
                    href="/mlb/standings"
                    className="px-4 py-2 bg-charcoal hover:bg-slate text-text-secondary hover:text-text-primary rounded-lg text-sm font-medium transition-colors"
                  >
                    MLB Standings
                  </Link>
                  <Link
                    href="/nil-valuation"
                    className="px-4 py-2 bg-charcoal hover:bg-slate text-text-secondary hover:text-text-primary rounded-lg text-sm font-medium transition-colors"
                  >
                    NIL Valuations
                  </Link>
                </div>
              </div>
            </ScrollReveal>

            {/* Data Freshness */}
            <div className="mt-8 pt-4 border-t border-border-subtle">
              <DataFreshnessIndicator
                lastUpdated={fetchedAt ? new Date(fetchedAt) : undefined}
                source="BSI Multi-Source"
                refreshInterval={60}
              />
            </div>
          </Container>
        </Section>
      </div>

      <Footer />
    </>
  );
}
