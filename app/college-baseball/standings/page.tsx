'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSportData } from '@/lib/hooks/useSportData';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

const primaryConferences = [
  { id: 'SEC', name: 'SEC', fullName: 'Southeastern Conference' },
  { id: 'ACC', name: 'ACC', fullName: 'Atlantic Coast Conference' },
  { id: 'Big 12', name: 'Big 12', fullName: 'Big 12 Conference' },
  { id: 'Big Ten', name: 'Big Ten', fullName: 'Big Ten Conference' },
  { id: 'Sun Belt', name: 'Sun Belt', fullName: 'Sun Belt Conference' },
  { id: 'AAC', name: 'AAC', fullName: 'American Athletic Conference' },
];

const moreConferences = [
  { id: 'A-10', name: 'A-10', fullName: 'Atlantic 10 Conference' },
  { id: 'America East', name: 'Am. East', fullName: 'America East Conference' },
  { id: 'ASUN', name: 'ASUN', fullName: 'Atlantic Sun Conference' },
  { id: 'Big East', name: 'Big East', fullName: 'Big East Conference' },
  { id: 'Big South', name: 'Big South', fullName: 'Big South Conference' },
  { id: 'Big West', name: 'Big West', fullName: 'Big West Conference' },
  { id: 'CAA', name: 'CAA', fullName: 'Colonial Athletic Association' },
  { id: 'CUSA', name: 'C-USA', fullName: 'Conference USA' },
  { id: 'Horizon', name: 'Horizon', fullName: 'Horizon League' },
  { id: 'Missouri Valley', name: 'MVC', fullName: 'Missouri Valley Conference' },
  { id: 'Mountain West', name: 'MW', fullName: 'Mountain West Conference' },
  { id: 'Patriot League', name: 'Patriot', fullName: 'Patriot League' },
  { id: 'Southern', name: 'SoCon', fullName: 'Southern Conference' },
  { id: 'Southland', name: 'Southland', fullName: 'Southland Conference' },
  { id: 'Summit', name: 'Summit', fullName: 'Summit League' },
  { id: 'WAC', name: 'WAC', fullName: 'Western Athletic Conference' },
  { id: 'WCC', name: 'WCC', fullName: 'West Coast Conference' },
  { id: 'Independent', name: 'Ind.', fullName: 'Independent' },
];

const allConferences = [...primaryConferences, ...moreConferences];

interface TeamStanding {
  rank: number;
  team: {
    id: string;
    name: string;
    shortName: string;
    logo?: string;
  };
  conferenceRecord: { wins: number; losses: number; pct?: number };
  overallRecord: { wins: number; losses: number };
  winPct: number;
  rpi?: number;
  sos?: number;
  streak?: string;
  pointDifferential?: number;
}

interface StandingsApiResponse {
  success: boolean;
  data?: TeamStanding[];
  timestamp?: string;
  cacheTime?: string;
  message?: string;
}

const seasonYear = new Date().getMonth() >= 8 ? new Date().getFullYear() + 1 : new Date().getFullYear();
const currentMonth = new Date().getMonth(); // 0-indexed: Jan=0, Feb=1, ..., Jun=5
const isInSeason = currentMonth >= 1 && currentMonth <= 5; // Feb through June

export default function CollegeBaseballStandingsPage() {
  const [selectedConference, setSelectedConference] = useState('SEC');
  const [showMoreConferences, setShowMoreConferences] = useState(false);

  const { data: rawData, loading, error: fetchError } = useSportData<StandingsApiResponse>(
    `/api/college-baseball/standings?conference=${encodeURIComponent(selectedConference)}`
  );
  const standings = rawData?.success && rawData?.data ? rawData.data : [];
  const lastUpdated = rawData?.timestamp || rawData?.cacheTime || null;
  const error = fetchError || (rawData && !rawData.success ? (rawData.message || 'Failed to fetch standings') : null);

  const currentConf = allConferences.find((c) => c.id === selectedConference);
  const hasConferencePlay = standings.some((s) =>
    s.conferenceRecord?.wins > 0 || s.conferenceRecord?.losses > 0 || (s.conferenceRecord?.pct ?? 0) > 0
  );

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
                <span className="text-text-primary">Standings</span>
              </div>

              <div className="mb-8">
                <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display">
                  Conference <span className="text-gradient-blaze">Standings</span>
                </h1>
                <p className="text-text-secondary mt-2">
                  {seasonYear} NCAA Division I baseball conference standings
                </p>
              </div>
            </ScrollReveal>

            {/* Conference Selector */}
            <ScrollReveal direction="up" delay={100}>
              <div className="flex flex-wrap gap-2 mb-2">
                {primaryConferences.map((conf) => (
                  <button
                    key={conf.id}
                    onClick={() => setSelectedConference(conf.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedConference === conf.id
                        ? 'bg-burnt-orange text-white'
                        : 'bg-background-secondary text-text-secondary hover:text-text-primary hover:bg-slate'
                    }`}
                  >
                    {conf.name}
                  </button>
                ))}
                <button
                  onClick={() => setShowMoreConferences(!showMoreConferences)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-background-secondary text-text-tertiary hover:text-text-primary hover:bg-slate transition-all"
                >
                  {showMoreConferences ? 'Less' : `+${moreConferences.length} More`}
                </button>
              </div>
              {showMoreConferences && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {moreConferences.map((conf) => (
                    <button
                      key={conf.id}
                      onClick={() => setSelectedConference(conf.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedConference === conf.id
                          ? 'bg-burnt-orange text-white'
                          : 'bg-background-secondary text-text-secondary hover:text-text-primary hover:bg-slate'
                      }`}
                    >
                      {conf.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="mb-6" />
            </ScrollReveal>

            {/* Conference Header */}
            <ScrollReveal direction="up" delay={150}>
              <Card padding="lg" className="mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-text-primary">
                      {currentConf?.fullName}
                    </h2>
                    <p className="text-text-tertiary text-sm mt-1">{seasonYear} Conference Standings</p>
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
                  {isInSeason
                    ? 'Standings data is updating — check back shortly.'
                    : 'College baseball returns in February.'}
                </p>
              </Card>
            )}

            {/* Empty State */}
            {!loading && !error && standings.length === 0 && (
              <Card padding="lg" className="text-center">
                <p className="text-text-secondary mb-2">
                  No standings data available for {currentConf?.fullName || currentConf?.name}.
                </p>
                <p className="text-text-tertiary text-sm">
                  {isInSeason
                    ? 'Conference play may not have started yet. Overall records update daily.'
                    : 'College baseball returns in February.'}
                </p>
                {isInSeason && (
                  <Link href="/college-baseball/editorial" className="text-burnt-orange hover:text-ember text-sm mt-3 inline-block">
                    Browse preseason editorial previews →
                  </Link>
                )}
              </Card>
            )}

            {/* Standings Table */}
            {standings.length > 0 && (
              <ScrollReveal direction="up" delay={200}>
                <Card padding="none" className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full" aria-label="College baseball standings by conference">
                      <thead>
                        <tr className="bg-background-secondary border-b border-border-subtle">
                          <th scope="col" className="text-left py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider w-12">
                            #
                          </th>
                          <th scope="col" className="text-left py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                            Team
                          </th>
                          {hasConferencePlay && (
                            <th scope="col" className="text-center py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                              Conf
                            </th>
                          )}
                          <th scope="col" className="text-center py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                            Overall
                          </th>
                          <th scope="col" className="text-center py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider hidden md:table-cell">
                            Win%
                          </th>
                          <th scope="col" className="text-center py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider hidden md:table-cell">
                            Streak
                          </th>
                          <th scope="col" className="text-center py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider hidden lg:table-cell">
                            Diff
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((standing, index) => (
                          <tr
                            key={standing.team?.id || index}
                            className={`border-b border-border-subtle hover:bg-background-secondary/50 transition-colors ${
                              index < 4 ? 'bg-success/5' : ''
                            }`}
                          >
                            <td className="py-3 px-4">
                              <span className="font-display text-lg font-bold text-burnt-orange">
                                {standing.rank || index + 1}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <Link
                                href={`/college-baseball/teams/${standing.team?.id}`}
                                className="flex items-center gap-3 hover:text-burnt-orange transition-colors"
                              >
                                {standing.team?.logo && (
                                  <Image
                                    src={standing.team.logo}
                                    alt=""
                                    width={28}
                                    height={28}
                                    className="object-contain flex-shrink-0"
                                    unoptimized
                                  />
                                )}
                                <span className="font-semibold text-text-primary">
                                  {standing.team?.name || standing.team?.shortName || 'Unknown'}
                                </span>
                              </Link>
                            </td>
                            {hasConferencePlay && (
                              <td className="py-3 px-4 text-center">
                                <span className="text-text-primary">
                                  {(standing.conferenceRecord?.wins > 0 || standing.conferenceRecord?.losses > 0)
                                    ? `${standing.conferenceRecord.wins}-${standing.conferenceRecord.losses}`
                                    : standing.conferenceRecord?.pct != null && standing.conferenceRecord.pct > 0
                                      ? `${(standing.conferenceRecord.pct * 100).toFixed(0)}%`
                                      : '—'}
                                </span>
                              </td>
                            )}
                            <td className="py-3 px-4 text-center">
                              <span className="text-text-primary font-medium">
                                {standing.overallRecord?.wins ?? 0}-
                                {standing.overallRecord?.losses ?? 0}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center hidden md:table-cell">
                              <span className="text-text-secondary">
                                {standing.winPct ? (standing.winPct * 100).toFixed(1) + '%' : '—'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center hidden md:table-cell">
                              <span className={`text-sm ${
                                standing.streak?.startsWith('W') ? 'text-success' :
                                standing.streak?.startsWith('L') ? 'text-error' : 'text-text-tertiary'
                              }`}>
                                {standing.streak || '—'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center hidden lg:table-cell">
                              {standing.pointDifferential != null ? (
                                <span className={`text-sm font-medium ${
                                  standing.pointDifferential > 0 ? 'text-success' :
                                  standing.pointDifferential < 0 ? 'text-error' : 'text-text-tertiary'
                                }`}>
                                  {standing.pointDifferential > 0 ? '+' : ''}{standing.pointDifferential}
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
                  <div className="px-4 py-3 bg-background-secondary border-t border-border-subtle">
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
