'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const FAVORITES_KEY = 'bsi_favorites';

const SPORT_META: Record<string, { label: string; href: string }> = {
  'college-baseball': { label: 'College Baseball', href: '/college-baseball/scores' },
  mlb: { label: 'MLB', href: '/mlb/scores' },
  nfl: { label: 'NFL', href: '/nfl/scores' },
  nba: { label: 'NBA', href: '/nba/scores' },
  cfb: { label: 'College Football', href: '/cfb' },
};

/**
 * Shows quick-access links for sports the user selected during onboarding.
 * Falls back to nothing if no favorites are stored.
 */
export function YourTeamsToday() {
  const [sports, setSports] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.sports) && parsed.sports.length > 0) {
          setSports(parsed.sports);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  if (sports.length === 0) return null;

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-4">
          Your Sports
        </h2>
        <div className="flex flex-wrap gap-3">
          {sports.map((id) => {
            const meta = SPORT_META[id];
            if (!meta) return null;
            return (
              <Link
                key={id}
                href={meta.href}
                className="px-5 py-3 rounded-xl bg-charcoal-900/50 border border-border-subtle hover:border-burnt-orange/40 hover:shadow-glow-sm transition-all group"
              >
                <span className="font-semibold text-white group-hover:text-burnt-orange transition-colors">
                  {meta.label}
                </span>
                <span className="block text-xs text-text-muted mt-0.5">View scores</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
