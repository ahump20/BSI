'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSportData } from '@/lib/hooks/useSportData';
import { SortableTh } from '@/components/ui/SortableTh';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FilterPill } from '@/components/ui/FilterPill';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { HeroGlow } from '@/components/ui/HeroGlow';
import { SkeletonStandingsTable } from '@/components/ui/Skeleton';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import type { RankingsTeam, RankingsResponse } from '@/lib/types/rankings';

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
  meta?: {
    source?: string;
    sources?: string[];
    degraded?: boolean;
    fetched_at?: string;
  };
}

interface ConferenceStrengthEntry {
  conference: string;
  strength_index: number;
  avg_woba: number;
  avg_era: number;
  rpi_avg: number;
  is_power: number;
}

interface ConferenceStrengthResponse {
  data: ConferenceStrengthEntry[];
  total: number;
  tier: string;
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
  const lastUpdated = rawData?.timestamp || rawData?.cacheTime || rawData?.meta?.fetched_at || null;
  const error = fetchError || (rawData && !rawData.success ? (rawData.message || 'Failed to fetch standings') : null);
  const meta = rawData?.meta || null;

  // Fetch rankings to find undefeated teams across all conferences
  const { data: rankingsData } = useSportData<RankingsResponse>('/api/college-baseball/rankings', {
    refreshInterval: 300_000,
  });

  const undefeatedTeams = useMemo(() => (rankingsData?.rankings || []).filter((t: RankingsTeam) => {
    // Check for 0 losses via record string or losses field
    if (t.losses === 0 && (t.wins ?? 0) > 0) return true;
    if (t.record) {
      const parts = t.record.split('-');
      if (parts.length === 2 && parseInt(parts[1], 10) === 0 && parseInt(parts[0], 10) > 0) return true;
    }
    return false;
  }), [rankingsData]);

  // Append API key if available so pro-tier users get all conferences
  const [apiKey] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('bsi-api-key') ?? '' : ''
  );
  const strengthUrl = apiKey
    ? `/api/savant/conference-strength?key=${apiKey}`
    : '/api/savant/conference-strength';

  const { data: strengthData } = useSportData<ConferenceStrengthResponse>(
    strengthUrl,
    { refreshInterval: 600_000 }
  );

  const confStrength = useMemo(() => {
    if (!strengthData?.data) return null;
    return strengthData.data.find(c =>
      c.conference.toLowerCase().includes(selectedConference.toLowerCase()) ||
      selectedConference.toLowerCase().includes(c.conference.toLowerCase())
    ) || null;
  }, [strengthData, selectedConference]);

  const currentConf = allConferences.find((c) => c.id === selectedConference);
  const hasConferencePlay = standings.some((s) =>
    s.conferenceRecord?.wins > 0 || s.conferenceRecord?.losses > 0 || (s.conferenceRecord?.pct ?? 0) > 0
  );

  // Sortable column state
  type SortKey = 'rank' | 'confWins' | 'overallWins' | 'winPct' | 'diff';
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = useCallback((key: string) => {
    const k = key as SortKey;
    setSortKey((prev) => {
      if (prev === k) { setSortDir((d) => (d === 'asc' ? 'desc' : 'asc')); return k; }
      setSortDir(k === 'rank' ? 'asc' : 'desc');
      return k;
    });
  }, []);

  const sortIndicator = useCallback((key: string) => {
    if (sortKey !== key) return '' as const;
    return sortDir === 'asc' ? '▲' as const : '▼' as const;
  }, [sortKey, sortDir]);

  const sortedStandings = useMemo(() => {
    if (sortKey === 'rank') {
      return sortDir === 'asc' ? standings : [...standings].reverse();
    }
    return [...standings].sort((a, b) => {
      let aVal = 0, bVal = 0;
      switch (sortKey) {
        case 'confWins': aVal = a.conferenceRecord?.wins ?? 0; bVal = b.conferenceRecord?.wins ?? 0; break;
        case 'overallWins': aVal = a.overallRecord?.wins ?? 0; bVal = b.overallRecord?.wins ?? 0; break;
        case 'winPct': aVal = a.winPct ?? 0; bVal = b.winPct ?? 0; break;
        case 'diff': aVal = a.pointDifferential ?? 0; bVal = b.pointDifferential ?? 0; break;
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [standings, sortKey, sortDir]);

  return (
    <>
      <div>
        <Section padding="lg" className="pt-6 relative overflow-hidden">
          <HeroGlow position="50% 15%" spread="65%" />
          <Container>
            <ScrollReveal direction="up">
              <Breadcrumb
                className="mb-4"
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'College Baseball', href: '/college-baseball' },
                  { label: 'Standings' },
                ]}
              />
              <div className="mb-8">
                <span className="section-label block mb-3">Conference Standings</span>
                <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display">
                  Conference <span className="text-gradient-blaze">Standings</span>
                </h1>
                <p className="text-burnt-orange font-serif italic text-lg mt-2">
                  {seasonYear} NCAA Division I baseball — updated daily.
                </p>
              </div>
            </ScrollReveal>

            {/* Undefeated Teams Callout */}
            {undefeatedTeams.length > 0 && (
              <ScrollReveal direction="up" delay={80}>
                <div className="mb-6 bg-[#C9A227]/10 border border-[#C9A227]/25 rounded-sm px-5 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 bg-[#C9A227] rounded-full animate-pulse" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#C9A227]">
                      Undefeated D1 Teams
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {undefeatedTeams.map((team) => (
                      <span
                        key={team.name || team.team}
                        className="inline-flex items-center gap-2 text-sm text-text-primary"
                      >
                        <span className="font-semibold">{team.name || team.team}</span>
                        <span className="text-text-muted font-mono text-xs">
                          {team.record || `${team.wins}-0`}
                        </span>
                        {team.conference && (
                          <span className="text-[10px] text-text-muted">({team.conference})</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            )}

            {/* Conference Selector */}
            <ScrollReveal direction="up" delay={100}>
              <div className="flex flex-wrap gap-2 mb-2">
                {primaryConferences.map((conf) => (
                  <FilterPill
                    key={conf.id}
                    active={selectedConference === conf.id}
                    onClick={() => setSelectedConference(conf.id)}
                    aria-pressed={selectedConference === conf.id}
                  >
                    {conf.name}
                  </FilterPill>
                ))}
                <FilterPill
                  active={false}
                  onClick={() => setShowMoreConferences(!showMoreConferences)}
                >
                  {showMoreConferences ? 'Less' : `+${moreConferences.length}`}
                </FilterPill>
              </div>
              {showMoreConferences && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {moreConferences.map((conf) => (
                    <FilterPill
                      key={conf.id}
                      active={selectedConference === conf.id}
                      onClick={() => setSelectedConference(conf.id)}
                      size="sm"
                      aria-pressed={selectedConference === conf.id}
                    >
                      {conf.name}
                    </FilterPill>
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
                  {meta?.sources ? (
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${
                      meta.degraded ? 'text-[var(--bsi-warning)]' : 'text-[var(--bsi-primary)]'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${meta.degraded ? 'bg-[var(--bsi-warning)]' : 'bg-[var(--bsi-primary)]'}`} />
                      Sources: {meta.sources.join(' + ')}
                    </div>
                  ) : (
                    <Badge variant="primary">Updated Daily</Badge>
                  )}
                </div>
                {confStrength && (
                  <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border-subtle">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-text-tertiary">Strength</span>
                      <span className={`text-sm font-mono font-semibold ${confStrength.strength_index >= 70 ? 'text-success' : confStrength.strength_index >= 50 ? 'text-burnt-orange' : 'text-text-secondary'}`}>
                        {confStrength.strength_index.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-text-tertiary">Avg ERA</span>
                      <span className="text-sm font-mono text-text-primary">{confStrength.avg_era.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-text-tertiary">Avg wOBA</span>
                      <span className="text-sm font-mono text-text-primary">{confStrength.avg_woba.toFixed(3)}</span>
                    </div>
                    {confStrength.is_power === 1 && (
                      <Badge variant="primary" size="sm">Power Conference</Badge>
                    )}
                  </div>
                )}
              </Card>
            </ScrollReveal>

            <DataErrorBoundary name="Standings">
              {/* Loading State */}
              {loading && standings.length === 0 && (
                <SkeletonStandingsTable rows={12} columns={5} />
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
                    Standings for {currentConf?.fullName || currentConf?.name} update as conference play begins.
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
                            <SortableTh label="#" sortKey="rank" indicator={sortIndicator('rank')} onSort={handleSort} className="py-4 px-4 w-12 uppercase tracking-wider" />
                            <th scope="col" className="text-left py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                              Team
                            </th>
                            {hasConferencePlay && (
                              <SortableTh label="Conf" sortKey="confWins" indicator={sortIndicator('confWins')} onSort={handleSort} className="py-4 px-4 text-center uppercase tracking-wider" />
                            )}
                            <SortableTh label="Overall" sortKey="overallWins" indicator={sortIndicator('overallWins')} onSort={handleSort} className="py-4 px-4 text-center uppercase tracking-wider" />
                            <SortableTh label="Win%" sortKey="winPct" indicator={sortIndicator('winPct')} onSort={handleSort} className="py-4 px-4 text-center uppercase tracking-wider hidden md:table-cell" />
                            <th scope="col" className="text-center py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider hidden md:table-cell">
                              Streak
                            </th>
                            <SortableTh label="Diff" sortKey="diff" indicator={sortIndicator('diff')} onSort={handleSort} className="py-4 px-4 text-center uppercase tracking-wider hidden lg:table-cell" />
                          </tr>
                        </thead>
                        <tbody>
                          {sortedStandings.map((standing, index) => (
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
                          <div className="w-3 h-3 bg-success/20 rounded-sm" />
                          <span>NCAA Tournament Projection</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </ScrollReveal>
              )}

              {/* Data Attribution */}
              <div className="mt-8 pt-4 border-t border-white/[0.06]">
                <p className="text-[11px] font-mono text-text-muted/50 text-center">
                  ESPN College Baseball API{lastUpdated && <> &middot; {new Date(lastUpdated).toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT</>}
                </p>
              </div>
            </DataErrorBoundary>
          </Container>
        </Section>
      </div>

      <Footer />
    </>
  );
}
