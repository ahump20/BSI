'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface TeamData {
  slug: string;
  name: string;
  abbreviation: string;
  logo: string;
  conference: string;
  record: { wins: number; losses: number };
}

interface MyTeamsPanelProps {
  /** Team slugs from user preferences */
  teamSlugs: string[];
}

/**
 * Shows favorite teams with logo, record, and link to team page.
 * Fetches from /api/college-baseball/teams/all and filters to favorites.
 */
export function MyTeamsPanel({ teamSlugs }: MyTeamsPanelProps) {
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (teamSlugs.length === 0) {
      setTeams([]);
      setLoading(false);
      return;
    }

    fetch('/api/college-baseball/teams/all')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { teams?: TeamData[] } | null) => {
        if (data?.teams) {
          const slugSet = new Set(teamSlugs);
          const matched = data.teams.filter((t) => slugSet.has(t.slug));
          // Preserve user's ordering
          const ordered = teamSlugs
            .map((slug) => matched.find((t) => t.slug === slug))
            .filter((t): t is TeamData => !!t);
          setTeams(ordered);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [teamSlugs]);

  if (teamSlugs.length === 0) return null;

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {teamSlugs.map((slug) => (
          <div key={slug} className="flex-shrink-0 w-36 h-20 bg-surface-medium rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (teams.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {teams.map((team) => (
        <Link
          key={team.slug}
          href={`/college-baseball/teams/${team.slug}`}
          className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-surface-light border border-border rounded-lg hover:border-burnt-orange/40 transition-all group min-w-[160px]"
        >
          <Image
            src={team.logo}
            alt={team.name}
            width={32}
            height={32}
            className="object-contain"
            unoptimized
          />
          <div>
            <p className="text-sm font-semibold text-text-primary group-hover:text-burnt-orange transition-colors">
              {team.abbreviation}
            </p>
            <p className="text-xs text-text-muted">
              {team.record.wins}-{team.record.losses}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
