'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { useSportData } from '@/lib/hooks/useSportData';
import { formatTimestamp } from '@/lib/utils/timezone';

interface TeamData {
  id: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName?: string;
  color?: string;
  logos?: Array<{ href: string }>;
  record?: string;
  conference?: string;
  location?: string;
}

interface RosterPlayer {
  id: string;
  name: string;
  jersey: string;
  position: string;
  height?: string;
  weight?: string;
  year?: string;
}

interface TeamDetailResponse {
  team: TeamData;
  roster: RosterPlayer[];
  meta?: {
    source: string;
    fetched_at: string;
    timezone: string;
  };
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center p-4 bg-[var(--surface-dugout)] rounded-sm">
      <p className="text-2xl md:text-3xl font-bold text-[var(--bsi-bone)]">{value}</p>
      <p className="text-xs text-[rgba(196,184,165,0.5)] uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}

function SkeletonTeamProfile() {
  return (
    <div className="animate-pulse">
      <div className="flex flex-col md:flex-row gap-8 items-center">
        <div className="w-32 h-32 bg-[var(--surface-dugout)] rounded-sm flex-shrink-0" />
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="h-10 bg-[var(--surface-dugout)] rounded-sm w-2/3 mx-auto md:mx-0" />
          <div className="h-6 bg-[var(--surface-dugout)]/50 rounded-sm w-1/3 mx-auto md:mx-0" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-[var(--surface-dugout)] rounded-sm" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Position sort order for roster display
const POSITION_ORDER: Record<string, number> = {
  QB: 1, RB: 2, FB: 3, WR: 4, TE: 5, OL: 6, OT: 7, OG: 8, C: 9,
  DL: 10, DE: 11, DT: 12, NT: 13, LB: 14, ILB: 15, OLB: 16,
  CB: 17, S: 18, FS: 19, SS: 20, DB: 21,
  K: 22, P: 23, LS: 24, KR: 25, PR: 26, ATH: 27,
};

interface CFBTeamDetailClientProps {
  teamId: string;
}

export default function CFBTeamDetailClient({ teamId }: CFBTeamDetailClientProps) {
  const [positionFilter, setPositionFilter] = useState<string>('All');

  const { data: teamData, loading, error, retry: fetchTeam, lastUpdated: lastUpdatedDate } = useSportData<TeamDetailResponse>(
    teamId ? `/api/cfb/teams/${teamId}` : null,
  );

  const team = teamData?.team || null;
  const roster = useMemo(() => teamData?.roster || [], [teamData]);
  const lastUpdated = lastUpdatedDate ? formatTimestamp(lastUpdatedDate.toISOString()) : formatTimestamp();

  const teamColor = team?.color ? `#${team.color}` : 'var(--bsi-primary)';
  const logoUrl = team?.logos?.[0]?.href;

  // Sort roster by position, then name
  const sortedRoster = [...roster].sort((a, b) => {
    const posA = POSITION_ORDER[a.position] || 99;
    const posB = POSITION_ORDER[b.position] || 99;
    if (posA !== posB) return posA - posB;
    return a.name.localeCompare(b.name);
  });

  // Get unique positions for filter
  const positions = ['All', ...Array.from(new Set(roster.map(p => p.position))).sort((a, b) => {
    return (POSITION_ORDER[a] || 99) - (POSITION_ORDER[b] || 99);
  })];

  // Filter roster
  const displayRoster = positionFilter === 'All'
    ? sortedRoster
    : sortedRoster.filter(p => p.position === positionFilter);

  // Parse record for stat cards
  const recordParts = team?.record?.split('-') || [];
  const wins = recordParts[0] || '-';
  const losses = recordParts[1] || '-';

  return (
    <>
      <div>
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-[var(--border-vintage)]">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/cfb"
                className="text-[rgba(196,184,165,0.5)] hover:text-[var(--bsi-primary)] transition-colors"
              >
                CFB
              </Link>
              <span className="text-[rgba(196,184,165,0.5)]">/</span>
              <Link
                href="/cfb/teams"
                className="text-[rgba(196,184,165,0.5)] hover:text-[var(--bsi-primary)] transition-colors"
              >
                Teams
              </Link>
              <span className="text-[rgba(196,184,165,0.5)]">/</span>
              <span className="text-[var(--bsi-bone)] font-medium">
                {loading ? 'Loading...' : team?.displayName || team?.name || 'Team'}
              </span>
            </nav>
          </Container>
        </Section>

        {/* Team Header */}
        <Section padding="lg" className="relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at top right, ${teamColor} 0%, transparent 50%)`,
            }}
          />

          <Container>
            {error && (
              <Card variant="default" padding="lg" className="mb-6 bg-error/10 border-error/30">
                <p className="text-error font-semibold">Error loading team</p>
                <p className="text-[var(--bsi-dust)] text-sm mt-1">{error}</p>
                <button
                  onClick={fetchTeam}
                  className="mt-3 px-4 py-2 bg-[var(--bsi-primary)] text-white rounded-sm text-sm hover:bg-[var(--bsi-primary)]/80 transition-colors"
                >
                  Try Again
                </button>
              </Card>
            )}

            {loading ? (
              <SkeletonTeamProfile />
            ) : team ? (
              <ScrollReveal direction="up">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  {/* Team Logo */}
                  <div className="relative w-32 h-32 flex-shrink-0">
                    {logoUrl ? (
                      <Image
                        src={logoUrl}
                        alt={team.displayName || team.name}
                        fill
                        className="object-contain"
                        sizes="128px"
                        unoptimized
                        priority
                      />
                    ) : (
                      <div
                        className="w-full h-full rounded-sm flex items-center justify-center text-3xl font-bold"
                        style={{ backgroundColor: teamColor, color: '#fff' }}
                      >
                        {team.abbreviation}
                      </div>
                    )}
                  </div>

                  {/* Team Info */}
                  <div className="flex-1 text-center md:text-left">
                    <h1 className="font-display text-3xl md:text-4xl font-bold text-[var(--bsi-bone)]">
                      {team.displayName || team.name}
                    </h1>

                    <div className="flex items-center gap-3 justify-center md:justify-start mt-2">
                      <Badge
                        variant="primary"
                        style={{ backgroundColor: teamColor }}
                      >
                        {team.abbreviation}
                      </Badge>
                      {team.conference && (
                        <span className="text-[var(--bsi-dust)]">{team.conference}</span>
                      )}
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                      <StatCard label="Record" value={team.record || '-'} />
                      <StatCard label="Wins" value={wins} />
                      <StatCard label="Losses" value={losses} />
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ) : null}
          </Container>
        </Section>

        {/* Roster Section */}
        {team && (
          <Section padding="lg" background="charcoal" borderTop>
            <Container>
              <ScrollReveal direction="up">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <h2 className="font-display text-2xl font-bold text-[var(--bsi-bone)]">
                    Roster ({roster.length})
                  </h2>

                  {/* Position Filter */}
                  <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                    {positions.slice(0, 8).map((pos) => (
                      <button
                        key={pos}
                        onClick={() => setPositionFilter(pos)}
                        className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition-all whitespace-nowrap ${
                          positionFilter === pos
                            ? 'bg-[var(--bsi-primary)] text-white'
                            : 'bg-[var(--surface-dugout)] text-[var(--bsi-dust)] hover:bg-[var(--surface-press-box)]'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                    {positions.length > 8 && (
                      <select
                        value={positions.slice(8).includes(positionFilter) ? positionFilter : ''}
                        onChange={(e) => {
                          if (e.target.value) setPositionFilter(e.target.value);
                        }}
                        className="px-2 py-1.5 bg-[var(--surface-dugout)] border border-[var(--border-vintage)] rounded-sm text-[var(--bsi-dust)] text-xs focus:outline-none focus:border-[var(--bsi-primary)]"
                      >
                        <option value="">More...</option>
                        {positions.slice(8).map((pos) => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </ScrollReveal>

              {displayRoster.length === 0 ? (
                <Card variant="default" padding="lg" className="text-center">
                  <p className="text-[var(--bsi-dust)]">
                    {roster.length === 0 ? 'No roster data available' : 'No players at this position'}
                  </p>
                </Card>
              ) : (
                <Card variant="default" padding="none">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border-vintage)]">
                          <th className="text-left p-3 text-[rgba(196,184,165,0.5)] font-semibold">#</th>
                          <th className="text-left p-3 text-[rgba(196,184,165,0.5)] font-semibold">Name</th>
                          <th className="text-left p-3 text-[rgba(196,184,165,0.5)] font-semibold">Pos</th>
                          <th className="text-left p-3 text-[rgba(196,184,165,0.5)] font-semibold hidden sm:table-cell">Yr</th>
                          <th className="text-left p-3 text-[rgba(196,184,165,0.5)] font-semibold hidden md:table-cell">Ht</th>
                          <th className="text-left p-3 text-[rgba(196,184,165,0.5)] font-semibold hidden md:table-cell">Wt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayRoster.map((player) => (
                          <tr
                            key={player.id}
                            className="border-b border-[var(--border-vintage)] last:border-0 hover:bg-[var(--surface-press-box)] transition-colors"
                          >
                            <td className="p-3 font-mono text-[var(--bsi-primary)] font-bold">
                              {player.jersey || '-'}
                            </td>
                            <td className="p-3">
                              <Link
                                href={`/cfb/players/${player.id}`}
                                className="text-[var(--bsi-bone)] hover:text-[var(--bsi-primary)] transition-colors font-medium"
                              >
                                {player.name}
                              </Link>
                            </td>
                            <td className="p-3">
                              <Badge variant="secondary" className="text-xs">
                                {player.position}
                              </Badge>
                            </td>
                            <td className="p-3 text-[var(--bsi-dust)] hidden sm:table-cell">
                              {player.year || '-'}
                            </td>
                            <td className="p-3 text-[var(--bsi-dust)] hidden md:table-cell">
                              {player.height || '-'}
                            </td>
                            <td className="p-3 text-[var(--bsi-dust)] hidden md:table-cell">
                              {player.weight ? `${player.weight} lbs` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </Container>
          </Section>
        )}

        {/* Data Source */}
        <Section padding="sm" background="charcoal" borderTop>
          <Container>
            <DataSourceBadge source="ESPN CFB API" timestamp={lastUpdated} />
          </Container>
        </Section>

        {/* Quick Links */}
        <Section padding="md" background="midnight" borderTop>
          <Container>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/cfb/teams"
                className="px-6 py-3 bg-[var(--surface-dugout)] rounded-sm text-[var(--bsi-dust)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)] transition-all"
              >
                All Teams
              </Link>
              <Link
                href="/cfb/scores"
                className="px-6 py-3 bg-[var(--surface-dugout)] rounded-sm text-[var(--bsi-dust)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)] transition-all"
              >
                Live Scores
              </Link>
              <Link
                href="/cfb/standings"
                className="px-6 py-3 bg-[var(--surface-dugout)] rounded-sm text-[var(--bsi-dust)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)] transition-all"
              >
                Standings
              </Link>
            </div>
          </Container>
        </Section>
      </div>

      <Footer />
    </>
  );
}
