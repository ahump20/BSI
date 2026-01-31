'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

const conferences = [
  { id: 'SEC', name: 'SEC', fullName: 'Southeastern Conference' },
  { id: 'ACC', name: 'ACC', fullName: 'Atlantic Coast Conference' },
  { id: 'Big 12', name: 'Big 12', fullName: 'Big 12 Conference' },
  { id: 'Big Ten', name: 'Big Ten', fullName: 'Big Ten Conference' },
  { id: 'Pac-12', name: 'Pac-12', fullName: 'Pacific-12 Conference' },
  { id: 'Sun Belt', name: 'Sun Belt', fullName: 'Sun Belt Conference' },
  { id: 'AAC', name: 'AAC', fullName: 'American Athletic Conference' },
];

interface TeamStanding {
  rank: number;
  team: {
    id: string;
    name: string;
    shortName: string;
    logo?: string;
  };
  conferenceRecord: { wins: number; losses: number };
  overallRecord: { wins: number; losses: number };
  winPct: number;
  rpi?: number;
  sos?: number;
  streak?: string;
}

interface StandingsApiResponse {
  success: boolean;
  data?: TeamStanding[];
  timestamp?: string;
  cacheTime?: string;
  message?: string;
}

export default function CollegeBaseballStandingsPage() {
  const [selectedConference, setSelectedConference] = useState('SEC');
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStandings() {
      try {
        setLoading(true);
        const response = await fetch(
          '/api/college-baseball/standings?conference=' + encodeURIComponent(selectedConference)
        );
        const result = (await response.json()) as StandingsApiResponse;

        if (result.success && result.data) {
          setStandings(result.data);
          setLastUpdated(result.timestamp || result.cacheTime || new Date().toISOString());
          setError(null);
        } else {
          setError(result.message || 'Failed to fetch standings');
        }
      } catch (err) {
        setError('Failed to load standings. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchStandings();
  }, [selectedConference]);

  const currentConf = conferences.find((c) => c.id === selectedConference);

  return (
    <>
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
                <span className="text-white">Standings</span>
              </div>

              <div className="mb-8">
                <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display">
                  Conference <span className="text-gradient-blaze">Standings</span>
                </h1>
                <p className="text-text-secondary mt-2">
                  2025 NCAA Division I baseball conference standings
                </p>
              </div>
            </ScrollReveal>

            {/* Conference Selector */}
            <ScrollReveal direction="up" delay={100}>
              <div className="flex flex-wrap gap-2 mb-8">
                {conferences.map((conf) => (
                  <button
                    key={conf.id}
                    onClick={() => setSelectedConference(conf.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedConference === conf.id
                        ? 'bg-burnt-orange text-white'
                        : 'bg-charcoal text-text-secondary hover:text-white hover:bg-slate'
                    }`}
                  >
                    {conf.name}
                  </button>
                ))}
              </div>
            </ScrollReveal>

            {/* Conference Header */}
            <ScrollReveal direction="up" delay={150}>
              <Card padding="lg" className="mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-white">
                      {currentConf?.fullName}
                    </h2>
                    <p className="text-text-tertiary text-sm mt-1">2025 Conference Standings</p>
                  </div>
                  <Badge variant="primary">Updated Daily</Badge>
                </div>
              </Card>
            </ScrollReveal>

            {/* Loading State */}
            {loading && standings.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-burnt-orange mb-4"></div>
                <p className="text-text-secondary">Loading standings...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <Card padding="lg" className="text-center">
                <p className="text-warning mb-4">{error}</p>
                <p className="text-text-tertiary text-sm">
                  College baseball season runs February through June. Standings will be available
                  during the season.
                </p>
              </Card>
            )}

            {/* Empty State */}
            {!loading && !error && standings.length === 0 && (
              <Card padding="lg" className="text-center">
                <p className="text-text-secondary mb-2">
                  No standings data available for {currentConf?.name}.
                </p>
                <p className="text-text-tertiary text-sm">
                  College baseball season runs February through June. Check back during the season.
                </p>
              </Card>
            )}

            {/* Standings Table */}
            {standings.length > 0 && (
              <ScrollReveal direction="up" delay={200}>
                <Card padding="none" className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-charcoal border-b border-border-subtle">
                          <th className="text-left py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                            Rank
                          </th>
                          <th className="text-left py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                            Team
                          </th>
                          <th className="text-center py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                            Conf
                          </th>
                          <th className="text-center py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                            Overall
                          </th>
                          <th className="text-center py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider hidden md:table-cell">
                            Win%
                          </th>
                          <th className="text-center py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                            RPI
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((standing, index) => (
                          <tr
                            key={standing.team?.id || index}
                            className={`border-b border-border-subtle hover:bg-charcoal/50 transition-colors ${
                              index < 4 ? 'bg-success/5' : ''
                            }`}
                          >
                            <td className="py-4 px-4">
                              <span className="font-display text-lg font-bold text-burnt-orange">
                                {standing.rank || index + 1}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-semibold text-white">
                                {standing.team?.name || standing.team?.shortName || 'Unknown'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="text-white">
                                {standing.conferenceRecord?.wins ?? 0}-
                                {standing.conferenceRecord?.losses ?? 0}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="text-text-secondary">
                                {standing.overallRecord?.wins ?? 0}-
                                {standing.overallRecord?.losses ?? 0}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center hidden md:table-cell">
                              <span className="text-text-secondary">
                                {standing.winPct ? (standing.winPct * 100).toFixed(1) + '%' : '—'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              {standing.rpi ? (
                                <span className="text-burnt-orange font-semibold">
                                  #{standing.rpi}
                                </span>
                              ) : (
                                <span className="text-text-tertiary">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Legend */}
                  <div className="px-4 py-3 bg-charcoal border-t border-border-subtle">
                    <div className="flex items-center gap-4 text-xs text-text-tertiary">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-success/20 rounded" />
                        <span>NCAA Tournament Projection</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </ScrollReveal>
            )}

            {/* Data Attribution */}
            <div className="mt-8 text-center text-xs text-text-tertiary">
              <p>Data sourced from ESPN College Baseball API. RPI rankings from NCAA.</p>
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
