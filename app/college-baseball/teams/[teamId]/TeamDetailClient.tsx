'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { AITeamPreview } from '@/components/college-baseball/AITeamPreview';
import { preseason2026, getTierLabel } from '@/lib/data/preseason-2026';
import { teamMetadata, getLogoUrl } from '@/lib/data/team-metadata';
import { useSportData } from '@/lib/hooks/useSportData';

interface LiveStats {
  wins: number;
  losses: number;
  confWins: number;
  confLosses: number;
  rpi: number;
  streak?: string;
  runsScored: number;
  runsAllowed: number;
  battingAvg: number;
  era: number;
}

interface TeamDetailClientProps {
  teamId: string;
}

export default function TeamDetailClient({ teamId }: TeamDetailClientProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'roster' | 'schedule'>('overview');
  const [logoError, setLogoError] = useState(false);

  const meta = teamMetadata[teamId];
  const preseason = preseason2026[teamId];

  // Background API fetch — non-blocking enhancement
  const { data: teamData, error: statsError } = useSportData<Record<string, unknown>>(
    `/api/college-baseball/teams/${teamId}`,
    { timeout: 10000 }
  );

  const liveStats = useMemo(() => {
    if (!teamData) return null;
    const teamObj = teamData.team as Record<string, unknown> | undefined;
    const stats = (teamObj?.stats ?? teamData.stats) as LiveStats | undefined;
    return stats?.wins !== undefined && stats?.losses !== undefined ? stats : null;
  }, [teamData]);

  const statsUnavailable = !!statsError;

  // ─── No metadata → error state ──────────────────────────────────────────────
  if (!meta) {
    return (
      <>
        <main className="min-h-screen pt-24 bg-gradient-to-b from-charcoal to-[#0D0D0D]">
          <Container>
            <Card padding="lg" className="text-center mt-12">
              <div className="text-burnt-orange text-4xl mb-4 font-display">?</div>
              <h3 className="text-xl font-semibold text-white mb-2">Team Not Found</h3>
              <p className="text-white/50 mb-6">
                No data available for &ldquo;{teamId}&rdquo;.
              </p>
              <Link
                href="/college-baseball/teams"
                className="inline-block px-6 py-2 bg-burnt-orange text-white font-semibold rounded-lg hover:bg-burnt-orange/90 transition-colors"
              >
                Back to Teams
              </Link>
            </Card>
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  const logoUrl = getLogoUrl(meta.espnId);
  const hasPreseason = !!preseason;

  // Parse the 2025 record for display (e.g. "44-14 (22-8 SEC)")
  const overallRecord = preseason?.record2025?.split(' (')[0] || null;
  const confRecord = preseason?.record2025?.match(/\(([^)]+)\)/)?.[1] || null;

  return (
    <>
      <main id="main-content">
        {/* ─── Hero Section ─────────────────────────────────────────────────── */}
        <Section padding="lg" className="pt-24 bg-gradient-to-b from-charcoal to-[#0D0D0D]">
          <Container>
            <ScrollReveal direction="up">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-3 mb-8 text-sm">
                <Link
                  href="/college-baseball"
                  className="text-white/30 hover:text-burnt-orange transition-colors"
                >
                  College Baseball
                </Link>
                <span className="text-white/20">/</span>
                <Link
                  href="/college-baseball/teams"
                  className="text-white/30 hover:text-burnt-orange transition-colors"
                >
                  Teams
                </Link>
                <span className="text-white/20">/</span>
                <span className="text-white/60">{meta.shortName}</span>
              </nav>

              {/* Team Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
                {/* Logo */}
                <div
                  className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-white/5 flex items-center justify-center overflow-hidden shrink-0"
                  style={{ borderWidth: '4px', borderStyle: 'solid', borderColor: `${meta.colors.primary}40` }}
                >
                  {!logoError ? (
                    <img
                      src={logoUrl}
                      alt={`${meta.name} logo`}
                      className="w-20 h-20 md:w-24 md:h-24 object-contain"
                      loading="eager"
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <span className="font-display text-burnt-orange font-bold text-3xl md:text-4xl">
                      {meta.abbreviation}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white uppercase tracking-wide">
                      {meta.name}
                    </h1>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge variant="secondary">{meta.conference}</Badge>
                    {hasPreseason && (
                      <>
                        <Badge variant="primary">#{preseason.rank} Preseason</Badge>
                        <Badge variant="accent">{getTierLabel(preseason.tier)}</Badge>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-white/40">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {meta.location.city}, {meta.location.state}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                      {meta.location.stadium}
                    </span>
                  </div>
                </div>

                {/* Record Stats */}
                {hasPreseason && (
                  <div className="flex flex-wrap gap-4 md:gap-6 shrink-0">
                    {overallRecord && (
                      <div className="text-center">
                        <div className="font-mono text-2xl md:text-3xl font-bold text-burnt-orange">
                          {overallRecord}
                        </div>
                        <div className="text-white/30 text-xs uppercase tracking-wider mt-1">
                          2025 Record
                        </div>
                      </div>
                    )}
                    {confRecord && (
                      <div className="text-center">
                        <div className="font-mono text-2xl md:text-3xl font-bold text-white">
                          {confRecord}
                        </div>
                        <div className="text-white/30 text-xs uppercase tracking-wider mt-1">
                          Conference
                        </div>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="font-mono text-2xl md:text-3xl font-bold text-green-400">
                        #{preseason.rank}
                      </div>
                      <div className="text-white/30 text-xs uppercase tracking-wider mt-1">
                        BSI Rank
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ─── Tabs Navigation ──────────────────────────────────────────────── */}
        <Section
          padding="none"
          className="bg-charcoal border-b border-white/10 sticky top-16 z-30"
        >
          <Container>
            <div className="flex gap-1">
              {(['overview', 'roster', 'schedule'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 font-semibold text-sm uppercase tracking-wider transition-colors ${
                    activeTab === tab
                      ? 'text-burnt-orange border-b-2 border-burnt-orange'
                      : 'text-white/30 hover:text-white/60'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </Container>
        </Section>

        {/* ─── Tab Content ──────────────────────────────────────────────────── */}
        <Section padding="lg" className="bg-[#0D0D0D]">
          <Container>
            {activeTab === 'overview' && (
              <>
                {/* Preseason Intel Grid */}
                {hasPreseason && (
                  <ScrollReveal direction="up" className="mb-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card padding="md">
                        <div className="text-xs uppercase tracking-wide text-white/30">
                          2025 Record
                        </div>
                        <div className="mt-1 text-xl font-mono text-white">
                          {preseason.record2025}
                        </div>
                      </Card>
                      <Card padding="md">
                        <div className="text-xs uppercase tracking-wide text-white/30">
                          Postseason
                        </div>
                        <div className="mt-1 text-xl font-mono text-burnt-orange">
                          {preseason.postseason2025}
                        </div>
                      </Card>
                      <Card padding="md">
                        <div className="text-xs uppercase tracking-wide text-white/30">
                          BSI Tier
                        </div>
                        <div className="mt-1 text-xl font-display uppercase tracking-wide text-white">
                          {getTierLabel(preseason.tier)}
                        </div>
                      </Card>
                      <Card padding="md">
                        <div className="text-xs uppercase tracking-wide text-white/30">
                          Conference
                        </div>
                        <div className="mt-1 text-xl font-display uppercase tracking-wide text-white">
                          {preseason.conference}
                        </div>
                      </Card>
                    </div>
                  </ScrollReveal>
                )}

                {/* Editorial Preview CTA */}
                {preseason?.editorialLink && (
                  <ScrollReveal direction="up" className="mb-8">
                    <Link href={preseason.editorialLink}>
                      <Card
                        variant="hover"
                        padding="lg"
                        className="group flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs uppercase tracking-wide text-burnt-orange font-semibold mb-1">
                            Full Preview Available
                          </div>
                          <div className="text-white font-display text-lg uppercase tracking-wide">
                            {meta.shortName} 2026 Season Preview
                          </div>
                          <div className="text-white/40 text-sm mt-1">
                            Deep-dive scouting report, roster breakdown, schedule analysis, and projection
                          </div>
                        </div>
                        <svg
                          className="w-6 h-6 text-burnt-orange group-hover:translate-x-1 transition-transform shrink-0 ml-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Card>
                    </Link>
                  </ScrollReveal>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Key Players */}
                  {hasPreseason && preseason.keyPlayers.length > 0 && (
                    <ScrollReveal direction="up">
                      <Card padding="lg">
                        <h2 className="font-display text-xl font-bold text-white uppercase tracking-wide mb-6">
                          Key Players
                        </h2>
                        <div className="space-y-4">
                          {preseason.keyPlayers.map((player) => {
                            // Parse "Name (stat)" format
                            const match = player.match(/^(.+?)\s*\((.+)\)$/);
                            const name = match ? match[1] : player;
                            const stat = match ? match[2] : null;

                            return (
                              <div
                                key={player}
                                className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                              >
                                <span className="text-white font-semibold">{name}</span>
                                {stat && (
                                  <span className="font-mono text-sm text-burnt-orange">{stat}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    </ScrollReveal>
                  )}

                  {/* BSI Outlook */}
                  {hasPreseason && (
                    <ScrollReveal direction="up" delay={100}>
                      <Card padding="lg">
                        <h2 className="font-display text-xl font-bold text-white uppercase tracking-wide mb-4">
                          BSI Outlook
                        </h2>
                        <Badge
                          variant="accent"
                          className="mb-4"
                        >
                          {getTierLabel(preseason.tier)}
                        </Badge>
                        <p className="text-white/60 leading-relaxed">
                          {preseason.outlook}
                        </p>
                      </Card>
                    </ScrollReveal>
                  )}

                  {/* Team Info (always show) */}
                  {!hasPreseason && (
                    <ScrollReveal direction="up">
                      <Card padding="lg">
                        <h2 className="font-display text-xl font-bold text-white uppercase tracking-wide mb-6">
                          Team Information
                        </h2>
                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <span className="text-white/40">Conference</span>
                            <span className="text-white font-semibold">{meta.conference}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/40">Stadium</span>
                            <span className="text-white font-semibold">{meta.location.stadium}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/40">Location</span>
                            <span className="text-white font-semibold">
                              {meta.location.city}, {meta.location.state}
                            </span>
                          </div>
                        </div>
                      </Card>
                    </ScrollReveal>
                  )}
                </div>

                {/* Scouting Intelligence */}
                <ScrollReveal direction="up" className="mt-8">
                  <AITeamPreview
                    teamId={teamId}
                    teamName={meta.name}
                    stats={liveStats ?? undefined}
                    conference={meta.conference}
                  />
                </ScrollReveal>
              </>
            )}

            {activeTab === 'schedule' && (
              <ScrollReveal direction="up">
                <Card padding="lg" className="text-center">
                  <div className="py-8">
                    <div className="text-burnt-orange text-4xl mb-4 font-display">2026</div>
                    <h3 className="text-xl font-display font-bold text-white uppercase tracking-wide mb-3">
                      Season Schedule
                    </h3>
                    <p className="text-white/50 max-w-md mx-auto mb-6">
                      The 2026 college baseball season opens February 14. Game-by-game schedule
                      and results will populate here once the season is underway.
                    </p>
                    {preseason?.editorialLink && (
                      <Link
                        href={preseason.editorialLink}
                        className="inline-block px-6 py-2 bg-burnt-orange text-white font-semibold rounded-lg hover:bg-burnt-orange/90 transition-colors"
                      >
                        View Schedule Preview
                      </Link>
                    )}
                  </div>
                </Card>
              </ScrollReveal>
            )}

            {activeTab === 'roster' && (
              <ScrollReveal direction="up">
                <Card padding="lg" className="text-center">
                  <div className="py-8">
                    <div className="text-burnt-orange text-4xl mb-4 font-display font-bold">
                      {meta.abbreviation}
                    </div>
                    <h3 className="text-xl font-display font-bold text-white uppercase tracking-wide mb-3">
                      {meta.shortName} Roster
                    </h3>
                    <p className="text-white/50 max-w-md mx-auto mb-6">
                      Full roster data populates once the season is underway. For a complete
                      breakdown of key returnees and transfer additions, check the editorial preview.
                    </p>
                    {preseason?.editorialLink && (
                      <Link
                        href={preseason.editorialLink}
                        className="inline-block px-6 py-2 bg-burnt-orange text-white font-semibold rounded-lg hover:bg-burnt-orange/90 transition-colors"
                      >
                        View Full Breakdown
                      </Link>
                    )}
                  </div>
                </Card>
              </ScrollReveal>
            )}

            {/* Data Attribution */}
            <div className="mt-12 pt-6 border-t border-white/5 text-center">
              <div className="flex items-center justify-center gap-2 text-xs text-white/20">
                <span>BSI Preseason Intelligence</span>
                <span>|</span>
                <span>NCAA / D1Baseball</span>
                {liveStats && (
                  <>
                    <span>|</span>
                    <Badge variant="success" size="sm">Live Stats Active</Badge>
                  </>
                )}
                {statsUnavailable && !liveStats && (
                  <>
                    <span>|</span>
                    <span className="text-yellow-500/60 text-xs">Live stats temporarily unavailable</span>
                  </>
                )}
              </div>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
