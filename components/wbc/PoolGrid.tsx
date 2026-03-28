'use client';

import Link from 'next/link';

interface PoolTeam {
  name: string;
  rank: number;
  titlePct: number;
}

interface Pool {
  id: 'A' | 'B' | 'C' | 'D';
  venue: string;
  city: string;
  dates: string;
  danger: 'extreme' | 'high' | 'medium-high' | 'medium';
  dangerLabel: string;
  keyRace: string;
  teams: PoolTeam[];
}

const POOLS: Pool[] = [
  {
    id: 'A',
    venue: 'Hiram Bithorn Stadium',
    city: 'San Juan, Puerto Rico',
    dates: 'Mar 7–11',
    danger: 'medium',
    dangerLabel: 'Medium',
    keyRace: 'Cuba vs Netherlands for second seed',
    teams: [
      { name: 'Cuba', rank: 8, titlePct: 4.0 },
      { name: 'Netherlands', rank: 9, titlePct: 3.0 },
      { name: 'Italy', rank: 12, titlePct: 1.0 },
      { name: 'Chinese Taipei', rank: 14, titlePct: 0.5 },
      { name: 'Panama', rank: 15, titlePct: 0.4 },
    ],
  },
  {
    id: 'B',
    venue: 'Minute Maid Park',
    city: 'Houston, Texas',
    dates: 'Mar 7–11',
    danger: 'medium-high',
    dangerLabel: 'Medium-High',
    keyRace: 'USA expected to clinch; Mexico battles Canada for 2nd',
    teams: [
      { name: 'USA', rank: 3, titlePct: 15.0 },
      { name: 'Mexico', rank: 7, titlePct: 5.0 },
      { name: 'Canada', rank: 10, titlePct: 2.0 },
      { name: 'Colombia', rank: 13, titlePct: 0.8 },
      { name: 'Great Britain', rank: 20, titlePct: 0.1 },
    ],
  },
  {
    id: 'C',
    venue: 'Tokyo Dome',
    city: 'Tokyo, Japan',
    dates: 'Mar 5–9',
    danger: 'high',
    dangerLabel: 'High',
    keyRace: 'Japan vs South Korea — only 2 advance',
    teams: [
      { name: 'Japan', rank: 1, titlePct: 22.0 },
      { name: 'South Korea', rank: 6, titlePct: 8.0 },
      { name: 'Australia', rank: 11, titlePct: 1.5 },
      { name: 'Czech Republic', rank: 17, titlePct: 0.3 },
      { name: 'China', rank: 19, titlePct: 0.1 },
    ],
  },
  {
    id: 'D',
    venue: 'LoanDepot Park',
    city: 'Miami, Florida',
    dates: 'Mar 7–11',
    danger: 'extreme',
    dangerLabel: 'POOL OF DEATH',
    keyRace: 'DomRep + Venezuela + Puerto Rico — one won\'t survive',
    teams: [
      { name: 'Dominican Republic', rank: 2, titlePct: 18.0 },
      { name: 'Venezuela', rank: 4, titlePct: 10.0 },
      { name: 'Puerto Rico', rank: 5, titlePct: 9.0 },
      { name: 'Nicaragua', rank: 18, titlePct: 0.1 },
      { name: 'Israel', rank: 16, titlePct: 0.3 },
    ],
  },
];

const DANGER_STYLES = {
  extreme: {
    border: 'border-ember/40',
    badge: 'text-ember bg-ember/10 border-ember/30',
    accent: 'bg-ember/10',
  },
  high: {
    border: 'border-[var(--bsi-warning)]/30',
    badge: 'text-[var(--bsi-warning)] bg-[var(--bsi-warning)]/10 border-[var(--bsi-warning)]/20',
    accent: 'bg-[var(--bsi-warning)]/5',
  },
  'medium-high': {
    border: 'border-[var(--bsi-primary)]/25',
    badge: 'text-[var(--bsi-primary)] bg-[var(--bsi-primary)]/10 border-[var(--bsi-primary)]/20',
    accent: 'bg-[var(--bsi-primary)]/5',
  },
  medium: {
    border: 'border-[var(--border-vintage)]',
    badge: 'text-[rgba(196,184,165,0.35)] bg-[var(--surface-press-box)] border-[var(--border-vintage)]',
    accent: 'bg-[var(--surface-press-box)]/30',
  },
};

export function PoolGrid() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-[var(--bsi-bone)]">
          Pool Breakdown
        </h2>
        <p className="text-[rgba(196,184,165,0.35)] text-sm mt-1">Double-elimination pool play · Top 2 from each pool advance to Miami</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {POOLS.map((pool) => {
          const danger = DANGER_STYLES[pool.danger];
          return (
            <Link
              key={pool.id}
              href={`/wbc/pool/${pool.id.toLowerCase()}`}
              className="group block"
            >
              <div
                className={`p-6 rounded-sm border ${danger.border} ${danger.accent} hover:shadow-lg transition-all duration-200`}
              >
                {/* Pool header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-display text-3xl font-bold text-[var(--bsi-primary)]">
                        Pool {pool.id}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border ${danger.badge}`}>
                        {pool.dangerLabel}
                      </span>
                    </div>
                    <div className="text-[rgba(196,184,165,0.5)] text-sm">{pool.venue}</div>
                    <div className="text-[rgba(196,184,165,0.35)] text-xs">{pool.city} · {pool.dates}</div>
                  </div>
                  <span className="text-[var(--bsi-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>

                {/* Teams */}
                <div className="space-y-2 mb-4">
                  {pool.teams.map((team, i) => (
                    <div key={team.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[rgba(196,184,165,0.35)] text-xs w-4 tabular-nums">{i + 1}</span>
                        <span className="text-[var(--bsi-dust)] text-sm font-medium">
                          {team.name}
                        </span>
                        <span className="text-[rgba(196,184,165,0.35)] text-xs">#{team.rank}</span>
                      </div>
                      <span className="text-[rgba(196,184,165,0.35)] text-xs tabular-nums">{team.titlePct}% title</span>
                    </div>
                  ))}
                </div>

                {/* Key race */}
                <div className="pt-3 border-t border-[var(--border-vintage)]/50">
                  <span className="text-[rgba(196,184,165,0.35)] text-xs">
                    <span className="text-[var(--bsi-primary)] font-semibold">Key race: </span>
                    {pool.keyRace}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
