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
      <div className="mb-12 p-6 bg-surface-light/30 border border-border/50 rounded-xl backdrop-blur-sm">
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
