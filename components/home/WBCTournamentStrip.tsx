'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/cinematic';

/* ═══════════════════════════════════════════════════════════════════════
 * WBC 2026 Tournament Strip — homepage feature
 * Compact pool overview + tournament status for the March 5-17 window.
 * Auto-hides after tournament ends.
 * ═══════════════════════════════════════════════════════════════════════ */

const TOURNAMENT_END = new Date('2026-03-18T23:59:59-05:00');

interface PoolData {
  id: string;
  venue: string;
  city: string;
  dates: string;
  teams: { name: string; flag: string; rank: number }[];
}

const POOLS: PoolData[] = [
  {
    id: 'A',
    venue: 'Hiram Bithorn Stadium',
    city: 'San Juan',
    dates: 'Mar 7-11',
    teams: [
      { name: 'Cuba', flag: '\uD83C\uDDE8\uD83C\uDDFA', rank: 8 },
      { name: 'Netherlands', flag: '\uD83C\uDDF3\uD83C\uDDF1', rank: 9 },
      { name: 'Italy', flag: '\uD83C\uDDEE\uD83C\uDDF9', rank: 12 },
      { name: 'Chinese Taipei', flag: '\uD83C\uDDF9\uD83C\uDDFC', rank: 14 },
      { name: 'Panama', flag: '\uD83C\uDDF5\uD83C\uDDE6', rank: 15 },
    ],
  },
  {
    id: 'B',
    venue: 'Minute Maid Park',
    city: 'Houston',
    dates: 'Mar 7-11',
    teams: [
      { name: 'USA', flag: '\uD83C\uDDFA\uD83C\uDDF8', rank: 3 },
      { name: 'Mexico', flag: '\uD83C\uDDF2\uD83C\uDDFD', rank: 7 },
      { name: 'Canada', flag: '\uD83C\uDDE8\uD83C\uDDE6', rank: 10 },
      { name: 'Colombia', flag: '\uD83C\uDDE8\uD83C\uDDF4', rank: 13 },
      { name: 'Great Britain', flag: '\uD83C\uDDEC\uD83C\uDDE7', rank: 20 },
    ],
  },
  {
    id: 'C',
    venue: 'Tokyo Dome',
    city: 'Tokyo',
    dates: 'Mar 5-9',
    teams: [
      { name: 'Japan', flag: '\uD83C\uDDEF\uD83C\uDDF5', rank: 1 },
      { name: 'South Korea', flag: '\uD83C\uDDF0\uD83C\uDDF7', rank: 6 },
      { name: 'Australia', flag: '\uD83C\uDDE6\uD83C\uDDFA', rank: 11 },
      { name: 'Czech Republic', flag: '\uD83C\uDDE8\uD83C\uDDFF', rank: 17 },
      { name: 'China', flag: '\uD83C\uDDE8\uD83C\uDDF3', rank: 19 },
    ],
  },
  {
    id: 'D',
    venue: 'LoanDepot Park',
    city: 'Miami',
    dates: 'Mar 7-11',
    teams: [
      { name: 'Dominican Rep.', flag: '\uD83C\uDDE9\uD83C\uDDF4', rank: 2 },
      { name: 'Venezuela', flag: '\uD83C\uDDFB\uD83C\uDDEA', rank: 4 },
      { name: 'Puerto Rico', flag: '\uD83C\uDDF5\uD83C\uDDF7', rank: 5 },
      { name: 'Israel', flag: '\uD83C\uDDEE\uD83C\uDDF1', rank: 16 },
      { name: 'Nicaragua', flag: '\uD83C\uDDF3\uD83C\uDDEE', rank: 18 },
    ],
  },
];

const DANGER_MAP: Record<string, { label: string; color: string }> = {
  A: { label: 'MEDIUM', color: 'text-text-secondary' },
  B: { label: 'MED-HIGH', color: 'text-amber-400' },
  C: { label: 'HIGH', color: 'text-yellow-400' },
  D: { label: 'POOL OF DEATH', color: 'text-[#FF6B35]' },
};

export function WBCTournamentStrip() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (new Date() > TOURNAMENT_END) setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal direction="up">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm bg-amber-500/15 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-amber-400 fill-none" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10" />
                  <path d="M2 12h20" />
                </svg>
              </div>
              <div>
                <span className="block text-[9px] font-mono uppercase tracking-[0.2em] text-amber-400/80">
                  Live Tournament
                </span>
                <h2 className="font-display text-lg md:text-xl font-bold uppercase tracking-wide text-text-primary">
                  World Baseball Classic 2026
                </h2>
              </div>
            </div>
            <Link
              href="/wbc"
              className="text-amber-400 text-xs font-semibold uppercase tracking-wider hover:text-amber-300 transition-colors"
            >
              Full Coverage &rarr;
            </Link>
          </div>

          {/* Pool Cards — horizontal scroll on mobile */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 sm:overflow-visible">
            {POOLS.map((pool) => {
              const danger = DANGER_MAP[pool.id];
              return (
                <Link
                  key={pool.id}
                  href={`/wbc/pool/${pool.id.toLowerCase()}`}
                  className="flex-shrink-0 w-64 sm:w-auto group"
                >
                  <div className="p-4 rounded-sm bg-[rgba(26,26,26,0.6)] border border-amber-500/10 hover:border-amber-500/30 transition-all duration-300 h-full">
                    {/* Pool header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold uppercase text-amber-400">
                          Pool {pool.id}
                        </span>
                        <span className="text-[9px] font-mono text-text-muted">{pool.city}</span>
                      </div>
                      <span className={`text-[8px] font-mono font-bold uppercase tracking-widest ${danger.color}`}>
                        {danger.label}
                      </span>
                    </div>

                    {/* Teams */}
                    <div className="space-y-1.5">
                      {pool.teams.map((team) => (
                        <div key={team.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{team.flag}</span>
                            <span className="text-xs text-text-primary truncate">{team.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-text-muted">#{team.rank}</span>
                        </div>
                      ))}
                    </div>

                    {/* Date footer */}
                    <div className="mt-3 pt-2 border-t border-white/[0.04]">
                      <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider">
                        {pool.dates}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <Link
              href="/wbc"
              className="text-xs text-text-muted hover:text-amber-400 transition-colors font-mono uppercase tracking-wider"
            >
              Power Rankings (200K sims)
            </Link>
            <span className="text-text-muted/30">|</span>
            <Link
              href="/wbc"
              className="text-xs text-text-muted hover:text-amber-400 transition-colors font-mono uppercase tracking-wider"
            >
              Bracket + Intelligence
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
