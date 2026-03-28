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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    fetch('/api/college-baseball/teams/all', { signal: controller.signal })
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
      .catch((err) => {
        if ((err as Error).name === 'AbortError') return;
        setLoading(false);
      });

    return () => { controller.abort(); clearTimeout(timeout); };
  }, [teamSlugs]);

  if (teamSlugs.length === 0) return null;

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {teamSlugs.map((slug) => (
          <div key={slug} className="flex-shrink-0 w-36 h-20 bg-surface-medium rounded-sm animate-pulse" />
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
          className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-[var(--surface-press-box)] border border-[var(--border-vintage)] rounded-sm hover:border-[var(--bsi-primary)]/40 transition-all group min-w-[160px]"
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
            <p className="text-sm font-semibold text-[var(--bsi-bone)] group-hover:text-[var(--bsi-primary)] transition-colors">
              {team.abbreviation}
            </p>
            <p className="text-xs text-[rgba(196,184,165,0.35)]">
              {team.record.wins}-{team.record.losses}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
