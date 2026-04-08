'use client';

import { TeamBrowser } from '@/components/dashboard/TeamBrowser';
import { ScrollReveal } from '@/components/cinematic';

/**
 * Client component wrapper for the TeamBrowser.
 * Fetches all ~300 teams from the worker endpoint with search and conference filtering.
 */
export function AllTeamsSearch() {
  return (
    <ScrollReveal direction="up" delay={100}>
      <div className="mb-12 p-6 bg-[var(--surface-dugout)] border border-[var(--border-vintage)] rounded-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-4 bg-burnt-orange rounded-full" />
          <h2 className="text-sm font-display uppercase tracking-wider text-text-primary">
            Search All Teams
          </h2>
        </div>
        <TeamBrowser />
      </div>
    </ScrollReveal>
  );
}
