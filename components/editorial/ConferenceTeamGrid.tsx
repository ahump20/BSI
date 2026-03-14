'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSportData } from '@/lib/hooks/useSportData';
import { ScrollReveal } from '@/components/cinematic';

// ── Types ────────────────────────────────────────────────────────────

export type Tier = 'Omaha Favorite' | 'Contender' | 'Dark Horse' | 'Bubble' | 'Sleeper' | 'Rebuilding';

export type Conference = 'SEC' | 'Big 12' | 'Big Ten';

export interface TeamEntry {
  name: string;
  slug: string;
  mascot: string;
  tier: Tier;
}

interface StandingsTeam {
  team: { id?: string; name?: string; shortName?: string };
  overallRecord?: { wins: number; losses: number };
}

interface StandingsResponse {
  success: boolean;
  data: StandingsTeam[];
}

// ── Tier badge ───────────────────────────────────────────────────────

const tierStyles: Record<Tier, string> = {
  'Omaha Favorite': 'bg-[#C9A227]/20 text-[#C9A227] border-[#C9A227]/30',
  Contender: 'bg-burnt-orange/20 text-ember border-burnt-orange/30',
  'Dark Horse': 'bg-surface-medium text-text-secondary border-border-strong',
  Bubble: 'bg-surface-light text-text-muted border-border',
  Sleeper: 'bg-surface-light text-text-muted border-border',
  Rebuilding: 'bg-surface-light text-text-muted border-border-subtle',
};

function TierBadge({ tier }: { tier: Tier }) {
  const style = tierStyles[tier] || tierStyles.Bubble;
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider border ${style}`}
    >
      {tier}
    </span>
  );
}

// ── Normalize helper ─────────────────────────────────────────────────

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, '');
}

// ── Team card ────────────────────────────────────────────────────────

function TeamPreviewCard({
  team,
  record,
  hoverColor,
}: {
  team: TeamEntry;
  record: string;
  hoverColor: string;
}) {
  return (
    <Link href={`/college-baseball/editorial/${team.slug}-2026`} className="block group">
      <div
        className="bg-surface-light border border-border-subtle rounded-sm p-4 hover:bg-surface-medium transition-all h-full"
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = hoverColor; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = ''; }}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0">
            <h4 className="font-display text-sm font-bold text-text-primary uppercase tracking-wide transition-colors truncate">
              {team.name}
            </h4>
            <p className="text-text-muted text-xs">{team.mascot}</p>
          </div>
          <TierBadge tier={team.tier} />
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-text-muted text-xs font-mono">{record}</span>
          <svg
            viewBox="0 0 24 24"
            className="w-3.5 h-3.5 text-text-muted transition-colors"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

// ── Grid component ───────────────────────────────────────────────────

interface ConferenceTeamGridProps {
  teams: TeamEntry[];
  conference: Conference;
  hoverColor?: string;
}

/**
 * Client component that fetches live standings and renders team preview cards
 * with current-season records instead of hardcoded ones.
 */
export function ConferenceTeamGrid({
  teams,
  conference,
  hoverColor = 'rgba(201, 162, 39, 0.4)',
}: ConferenceTeamGridProps) {
  const { data } = useSportData<StandingsResponse>(
    `/api/college-baseball/standings?conference=${encodeURIComponent(conference)}`
  );

  // Build a lookup: normalized team name → "W-L", memoized on data changes
  const recordMap = useMemo(() => {
    const map = new Map<string, string>();
    if (data?.success && Array.isArray(data.data)) {
      for (const entry of data.data) {
        const name = entry.team?.name || entry.team?.shortName || '';
        const rec = entry.overallRecord;
        if (name && rec) {
          map.set(normalize(name), `${rec.wins}-${rec.losses}`);
        }
      }
    }
    return map;
  }, [data]);

  function getRecord(teamName: string): string {
    const key = normalize(teamName);
    if (recordMap.has(key)) return recordMap.get(key)!;
    // Partial fallback for name mismatches (e.g., "Ole Miss" vs "Mississippi")
    for (const [k, v] of recordMap) {
      if (k.includes(key) || key.includes(k)) return v;
    }
    return '\u2014';
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {teams.map((team, i) => (
        <ScrollReveal key={team.slug} direction="up" delay={Math.min(i * 30, 300)}>
          <TeamPreviewCard
            team={team}
            record={getRecord(team.name)}
            hoverColor={hoverColor}
          />
        </ScrollReveal>
      ))}
    </div>
  );
}
