'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { SkeletonTableRow } from '@/components/ui/Skeleton';
import { ScrollReveal } from '@/components/cinematic';
import { teamMetadata, getLogoUrl } from '@/lib/data/team-metadata';
import { formatTimestamp } from '@/lib/utils/timezone';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RankedTeam {
  rank: number;
  team: string;
  conference: string;
  record?: string;
  slug?: string;
}

interface PreviousRank {
  rank: number;
  team: string;
}

interface EnrichedRankingsTableProps {
  rankings: RankedTeam[];
  previousRankings?: PreviousRank[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  isLive: boolean;
  pollName: string;
  dataSource: string;
  lastUpdated: string;
  preseasonFallback: RankedTeam[];
}

// ---------------------------------------------------------------------------
// Team name → slug reverse-lookup (same as page.tsx)
// ---------------------------------------------------------------------------

const teamNameToSlug: Record<string, string> = {};
for (const [slug, meta] of Object.entries(teamMetadata)) {
  teamNameToSlug[meta.name.toLowerCase()] = slug;
  teamNameToSlug[meta.shortName.toLowerCase()] = slug;
}

// ---------------------------------------------------------------------------
// Rank change indicator
// ---------------------------------------------------------------------------

function RankChange({ current, previous }: { current: number; previous: number | null }) {
  if (previous === null) {
    return <span className="text-[10px] text-blue-400/70 font-semibold uppercase tracking-wider">NR</span>;
  }
  const diff = previous - current;
  if (diff === 0) {
    return <span className="text-text-muted text-xs">—</span>;
  }
  if (diff > 0) {
    return (
      <span className="text-green-400 text-xs font-semibold flex items-center gap-0.5">
        <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="currentColor">
          <path d="M5 1L9 7H1z" />
        </svg>
        {diff}
      </span>
    );
  }
  return (
    <span className="text-red-400 text-xs font-semibold flex items-center gap-0.5">
      <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="currentColor">
        <path d="M5 9L1 3h8z" />
      </svg>
      {Math.abs(diff)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// EnrichedRankingsTable
// ---------------------------------------------------------------------------

export function EnrichedRankingsTable({
  rankings,
  previousRankings,
  loading,
  error,
  onRetry,
  isLive,
  pollName,
  dataSource,
  lastUpdated,
  preseasonFallback,
}: EnrichedRankingsTableProps) {
  // Build previous rank lookup
  const prevMap = useMemo(() => {
    if (!previousRankings?.length) return null;
    const map = new Map<string, number>();
    for (const r of previousRankings) {
      map.set(r.team.toLowerCase(), r.rank);
    }
    return map;
  }, [previousRankings]);

  // Enrich each team with logo, conference from metadata
  const enriched = useMemo(() => {
    return rankings.map((team) => {
      const slug = team.slug || teamNameToSlug[team.team.toLowerCase()];
      const meta = slug ? teamMetadata[slug] : undefined;
      const conference = team.conference || meta?.conference || '';
      const logoUrl = meta ? getLogoUrl(meta.espnId, meta.logoId) : null;
      const prevRank = prevMap?.get(team.team.toLowerCase()) ?? null;

      return { ...team, slug, conference, logoUrl, prevRank };
    });
  }, [rankings, prevMap]);

  return (
    <ScrollReveal>
      <Card variant="default" padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-burnt-orange/15 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-burnt-orange fill-none stroke-[2]">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              {isLive ? (pollName || '2026 Top 25') : '2026 Preseason Top 25'}
            </div>
            <Badge variant="primary">
              {dataSource === 'espn' ? 'ESPN' : 'D1Baseball'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <table className="w-full">
              <tbody>
                {Array.from({ length: 25 }).map((_, i) => (
                  <SkeletonTableRow key={i} columns={5} />
                ))}
              </tbody>
            </table>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
              <p className="text-red-400 font-semibold">Rankings Unavailable</p>
              <p className="text-text-secondary text-sm mt-1">{error}</p>
              <button
                onClick={onRetry}
                className="mt-4 px-4 py-2 bg-burnt-orange text-white rounded-lg text-sm font-medium hover:bg-ember transition-colors"
              >
                Retry
              </button>
              {preseasonFallback.length > 0 && (
                <p className="text-text-muted text-xs mt-3">Showing preseason rankings as fallback below.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-burnt-orange">
                    <th className="text-left p-3 text-text-muted font-semibold text-xs w-12">Rank</th>
                    {prevMap && (
                      <th className="text-center p-3 text-text-muted font-semibold text-xs w-10">+/-</th>
                    )}
                    <th className="text-left p-3 text-text-muted font-semibold text-xs">Team</th>
                    <th className="text-left p-3 text-text-muted font-semibold text-xs hidden sm:table-cell">Conference</th>
                    <th className="text-left p-3 text-text-muted font-semibold text-xs">Record</th>
                  </tr>
                </thead>
                <tbody>
                  {enriched.map((team) => (
                    <tr
                      key={team.rank}
                      className="border-b border-border-subtle hover:bg-surface-light transition-colors"
                    >
                      <td className="p-3 text-burnt-orange font-bold text-lg tabular-nums">
                        {team.rank}
                      </td>
                      {prevMap && (
                        <td className="p-3 text-center">
                          <RankChange current={team.rank} previous={team.prevRank} />
                        </td>
                      )}
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {team.logoUrl && (
                            <Image
                              src={team.logoUrl}
                              alt=""
                              width={28}
                              height={28}
                              className="w-7 h-7 object-contain flex-shrink-0"
                              unoptimized
                            />
                          )}
                          {team.slug ? (
                            <Link
                              href={`/college-baseball/teams/${team.slug}`}
                              className="font-semibold text-text-primary hover:text-burnt-orange transition-colors"
                            >
                              {team.team}
                            </Link>
                          ) : (
                            <span className="font-semibold text-text-primary">{team.team}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-text-secondary hidden sm:table-cell">
                        {team.conference || '—'}
                      </td>
                      <td className="p-3 text-text-secondary tabular-nums">
                        {team.record || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DataSourceBadge source="D1Baseball / NCAA" timestamp={formatTimestamp(lastUpdated)} />
              {!isLive && !loading && !error && (
                <span className="text-xs text-yellow-400/60 bg-yellow-400/10 px-2 py-0.5 rounded">
                  Using preseason data
                </span>
              )}
            </div>
            <Link
              href="/college-baseball/rankings"
              className="text-sm text-burnt-orange hover:text-ember transition-colors"
            >
              Full Rankings →
            </Link>
          </div>
        </CardContent>
      </Card>
    </ScrollReveal>
  );
}
