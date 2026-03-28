'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { TrendChart } from '@/components/college-baseball/TrendChart';
import { useSportData } from '@/lib/hooks/useSportData';
import { teamMetadata, getLogoUrl } from '@/lib/data/team-metadata';

const conferences = [
  { id: 'all', name: 'All Conferences' },
  { id: 'SEC', name: 'SEC' },
  { id: 'ACC', name: 'ACC' },
  { id: 'Big 12', name: 'Big 12' },
  { id: 'Big Ten', name: 'Big Ten' },
];

/** Teams available for trend lookup — keyed by team metadata slug */
const trendTeams = Object.entries(teamMetadata)
  .map(([slug, meta]) => ({
    slug,
    name: meta.name,
    shortName: meta.shortName,
    conference: meta.conference,
    espnId: meta.espnId,
    logoId: meta.logoId,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

interface TrendSnapshot {
  date: string;
  wins: number;
  losses: number;
  winPct: number;
  ranking: number | null;
  rpi: number | null;
  runDifferential: number;
}

interface TrendResponse {
  team: { id: string; name: string; conference: string };
  snapshots: TrendSnapshot[];
  summary: { currentStreak: string; last10: string; rankingChange: number | null };
  meta: { source: string; fetched_at: string; timezone: string };
  message?: string;
}

export default function TrendsPage() {
  const [selectedConference, setSelectedConference] = useState('all');
  const [selectedTeamSlug, setSelectedTeamSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedMeta = selectedTeamSlug ? teamMetadata[selectedTeamSlug] : null;
  const teamApiId = selectedMeta?.espnId ?? selectedTeamSlug;

  const { data: trendData, loading, error } = useSportData<TrendResponse>(
    teamApiId ? `/api/college-baseball/trends/${teamApiId}` : null,
    { timeout: 12000, skip: !teamApiId }
  );

  const filteredTeams = useMemo(() => {
    let list = trendTeams;
    if (selectedConference !== 'all') {
      list = list.filter((t) => t.conference === selectedConference);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) => t.name.toLowerCase().includes(q) || t.shortName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedConference, searchQuery]);

  const winPctData = useMemo(
    () =>
      (trendData?.snapshots ?? []).map((s) => ({
        date: s.date,
        value: s.winPct,
      })),
    [trendData]
  );

  const rankingData = useMemo(
    () =>
      (trendData?.snapshots ?? [])
        .filter((s) => s.ranking !== null)
        .map((s) => ({
          date: s.date,
          value: s.ranking as number,
          label: `#${s.ranking}`,
        })),
    [trendData]
  );

  const runDiffData = useMemo(
    () =>
      (trendData?.snapshots ?? []).map((s) => ({
        date: s.date,
        value: s.runDifferential,
        label: s.runDifferential >= 0 ? `+${s.runDifferential}` : String(s.runDifferential),
      })),
    [trendData]
  );

  return (
    <>
      <div className="min-h-screen bg-[#0A0A0A] text-bsi-bone">
        {/* Header */}
        <Section padding="lg" className="pt-6 bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A]">
          <Container>
            <ScrollReveal direction="up">
              <nav className="flex items-center gap-3 mb-6 text-sm">
                <Link
                  href="/college-baseball"
                  className="text-bsi-dust/50 hover:text-[var(--bsi-primary)] transition-colors"
                >
                  College Baseball
                </Link>
                <span className="text-bsi-dust/50">/</span>
                <span className="text-bsi-dust">Trends</span>
              </nav>

              <h1 className="font-display text-3xl md:text-4xl font-bold text-bsi-bone uppercase tracking-wide mb-2">
                Season Trends
              </h1>
              <p className="text-bsi-dust/50 max-w-xl">
                Historical win percentage, ranking movement, and run differential tracked across
                the season. Select a team to view their trajectory.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Filters */}
        <Section padding="sm" className="bg-[#161616] border-b border-[rgba(140,98,57,0.3)] sticky top-16 z-30">
          <Container>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedConference}
                onChange={(e) => {
                  setSelectedConference(e.target.value);
                  setSelectedTeamSlug(null);
                }}
                className="bg-[#111111] border border-[rgba(140,98,57,0.3)] rounded-sm px-4 py-2 text-bsi-bone text-sm focus:outline-none focus:border-[var(--bsi-primary)]"
              >
                {conferences.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#161616]">
                    {c.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#111111] border border-[rgba(140,98,57,0.3)] rounded-sm px-4 py-2 text-bsi-bone text-sm placeholder:text-bsi-dust/50 focus:outline-none focus:border-[var(--bsi-primary)] flex-1"
              />
            </div>
          </Container>
        </Section>

        {/* Content */}
        <Section padding="lg" className="bg-[#0A0A0A]">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Team Selector */}
              <div className="lg:col-span-1">
                <ScrollReveal direction="up">
                  <Card padding="none" className="max-h-[600px] overflow-y-auto">
                    <div className="px-4 py-3 border-b border-[rgba(140,98,57,0.3)] sticky top-0 bg-[#111111]">
                      <h3 className="text-xs uppercase tracking-wider text-bsi-dust/50 font-semibold">
                        Select Team ({filteredTeams.length})
                      </h3>
                    </div>
                    <div className="divide-y divide-[rgba(140,98,57,0.3)]">
                      {filteredTeams.map((team) => (
                        <button
                          key={team.slug}
                          onClick={() => setSelectedTeamSlug(team.slug)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                            selectedTeamSlug === team.slug
                              ? 'bg-[var(--bsi-primary)]/10 text-[var(--bsi-primary)]'
                              : 'text-bsi-dust hover:text-bsi-bone hover:bg-[#111111]'
                          }`}
                        >
                          <img
                            src={getLogoUrl(team.espnId, team.logoId)}
                            alt=""
                            className="w-6 h-6 object-contain"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold truncate">{team.shortName}</div>
                            <div className="text-xs text-bsi-dust/50">{team.conference}</div>
                          </div>
                          {selectedTeamSlug === team.slug && (
                            <Badge variant="primary" size="sm">Active</Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  </Card>
                </ScrollReveal>
              </div>

              {/* Charts */}
              <div className="lg:col-span-2 space-y-6">
                {!selectedTeamSlug && (
                  <ScrollReveal direction="up">
                    <Card padding="lg" className="text-center">
                      <div className="py-12">
                        <div className="text-[var(--bsi-primary)] text-4xl mb-4 font-display">--</div>
                        <h3 className="text-xl font-display font-bold text-bsi-bone uppercase tracking-wide mb-3">
                          Select a Team
                        </h3>
                        <p className="text-bsi-dust/50 max-w-md mx-auto">
                          Choose a team from the list to view their season trends,
                          ranking trajectory, and run differential.
                        </p>
                      </div>
                    </Card>
                  </ScrollReveal>
                )}

                {selectedTeamSlug && loading && (
                  <Card padding="lg" className="text-center">
                    <div className="py-12">
                      <div className="w-8 h-8 border-2 border-[var(--bsi-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-bsi-dust/50 text-sm">Loading trend data...</p>
                    </div>
                  </Card>
                )}

                {selectedTeamSlug && error && !loading && (
                  <Card padding="lg" className="text-center">
                    <div className="py-8">
                      <div className="text-error text-sm mb-2">Failed to load trends</div>
                      <p className="text-bsi-dust/50 text-xs">{error}</p>
                    </div>
                  </Card>
                )}

                {selectedTeamSlug && trendData && !loading && (
                  <>
                    {/* Team Header */}
                    <ScrollReveal direction="up">
                      <Card padding="lg">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h2 className="font-display text-xl font-bold text-bsi-bone uppercase tracking-wide">
                              {trendData.team.name || selectedMeta?.name || selectedTeamSlug}
                            </h2>
                            {trendData.team.conference && (
                              <Badge variant="secondary" className="mt-1">
                                {trendData.team.conference}
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-4 text-center">
                            <div>
                              <div className="font-mono text-lg font-bold text-[var(--bsi-primary)]">
                                {trendData.summary.currentStreak}
                              </div>
                              <div className="text-bsi-dust/50 text-xs uppercase">Streak</div>
                            </div>
                            <div>
                              <div className="font-mono text-lg font-bold text-bsi-bone">
                                {trendData.summary.last10}
                              </div>
                              <div className="text-bsi-dust/50 text-xs uppercase">Recent</div>
                            </div>
                            {trendData.summary.rankingChange !== null && (
                              <div>
                                <div
                                  className={`font-mono text-lg font-bold ${
                                    trendData.summary.rankingChange > 0
                                      ? 'text-success'
                                      : trendData.summary.rankingChange < 0
                                        ? 'text-error'
                                        : 'text-bsi-dust/50'
                                  }`}
                                >
                                  {trendData.summary.rankingChange > 0
                                    ? `+${trendData.summary.rankingChange}`
                                    : trendData.summary.rankingChange}
                                </div>
                                <div className="text-bsi-dust/50 text-xs uppercase">Rank Chg</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {trendData.snapshots.length === 0 && (
                          <p className="text-bsi-dust/50 text-sm">
                            {trendData.message ||
                              'No snapshot data available yet. Trend data populates once the ingest pipeline runs.'}
                          </p>
                        )}
                      </Card>
                    </ScrollReveal>

                    {/* Charts */}
                    {trendData.snapshots.length > 0 && (
                      <>
                        <ScrollReveal direction="up" delay={50}>
                          <Card padding="lg">
                            <TrendChart
                              data={winPctData}
                              title="Win Percentage"
                              color="var(--bsi-primary)"
                              type="area"
                              yAxisDomain={[0, 1]}
                              valueFormatter={(v) => (v * 100).toFixed(0) + '%'}
                            />
                          </Card>
                        </ScrollReveal>

                        {rankingData.length > 0 && (
                          <ScrollReveal direction="up" delay={100}>
                            <Card padding="lg">
                              <TrendChart
                                data={rankingData}
                                title="National Ranking"
                                color="#10b981"
                                type="line"
                                yAxisDomain={['dataMax + 2', 'dataMin - 2']}
                                valueFormatter={(v) => `#${v}`}
                              />
                            </Card>
                          </ScrollReveal>
                        )}

                        <ScrollReveal direction="up" delay={150}>
                          <Card padding="lg">
                            <TrendChart
                              data={runDiffData}
                              title="Run Differential"
                              color="var(--bsi-accent)"
                              type="area"
                              valueFormatter={(v) => (v >= 0 ? `+${v}` : String(v))}
                            />
                          </Card>
                        </ScrollReveal>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Attribution */}
            <div className="mt-12 pt-6 border-t border-[rgba(140,98,57,0.3)] text-center">
              <div className="flex items-center justify-center gap-2 text-xs text-bsi-dust/50">
                <span>BSI D1 Historical Database</span>
                <span>|</span>
                <span>Updated daily</span>
              </div>
            </div>
          </Container>
        </Section>
      </div>

      <Footer />
    </>
  );
}
