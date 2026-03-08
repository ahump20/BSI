/**
 * Shared rankings normalization — converts ESPN poll format or flat arrays
 * into a consistent RankedTeam shape. Used by the hub page, QuickRankings,
 * and EnrichedRankingsTable.
 */

import { teamNameToSlug } from '@/lib/data/team-metadata';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RankedTeam {
  rank: number;
  team: string;
  conference: string;
  record?: string;
  slug?: string;
}

/** ESPN poll entry — nested under rankings[0].ranks */
export interface ESPNRankEntry {
  current: number;
  team: { name: string; location?: string; nickname?: string };
  recordSummary?: string;
}

export interface ESPNPoll {
  name: string;
  ranks: ESPNRankEntry[];
}

export interface RankingsRawResponse {
  rankings?: ESPNPoll[] | RankedTeam[];
  previousRankings?: Record<string, unknown> | null;
  meta?: { lastUpdated?: string; dataSource?: string };
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/** Normalize ESPN poll format OR flat RankedTeam[] into a consistent shape. */
export function normalizeRankings(raw: { rankings?: ESPNPoll[] | RankedTeam[] }): {
  teams: RankedTeam[];
  pollName: string;
} {
  const rankings = raw?.rankings;
  if (!rankings?.length) return { teams: [], pollName: '' };

  // ESPN wraps polls in { rankings: [{ name, ranks: [...] }] }
  const first = rankings[0] as unknown as Record<string, unknown>;
  if ('ranks' in first && Array.isArray(first.ranks)) {
    const poll = first as unknown as ESPNPoll;
    return {
      pollName: poll.name || '',
      teams: poll.ranks.map((e) => {
        const teamName = e.team?.location
          ? `${e.team.location} ${e.team.name}`
          : e.team?.nickname || e.team?.name || 'Unknown';
        return {
          rank: e.current,
          team: teamName,
          conference: '',
          record: e.recordSummary || '',
          slug: teamNameToSlug[teamName.toLowerCase()],
        };
      }),
    };
  }

  // Already flat RankedTeam[]
  return {
    teams: (rankings as RankedTeam[]).map((t) => ({
      ...t,
      slug: t.slug || teamNameToSlug[t.team.toLowerCase()],
    })),
    pollName: '',
  };
}
