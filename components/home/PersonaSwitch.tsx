'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Persona = 'fan' | 'scout' | 'coach';

interface PersonaConfig {
  headline: string;
  ctaText: string;
  ctaHref: string;
  cards: Array<{ title: string; description: string; href: string }>;
}

const PERSONAS: Record<Persona, PersonaConfig> = {
  fan: {
    headline: 'Follow every game that matters',
    ctaText: 'See Live Scores',
    ctaHref: '/scores',
    cards: [
      { title: 'Live Scores', description: 'Real-time updates across MLB, NFL, NBA, and college baseball.', href: '/scores' },
      { title: 'Standings', description: 'Conference and division standings — always current.', href: '/college-baseball/standings' },
      { title: 'Arcade', description: 'Sandlot Sluggers, Blaze Field, and more.', href: '/arcade' },
    ],
  },
  scout: {
    headline: 'Find the players everyone else misses',
    ctaText: 'Player Analytics',
    ctaHref: '/college-baseball/players',
    cards: [
      { title: 'Player Database', description: 'Search, compare, and evaluate across all divisions.', href: '/college-baseball/players' },
      { title: 'Team Profiles', description: 'Roster depth, pitching stats, program trajectory.', href: '/college-baseball/teams' },
      { title: 'Compare Tool', description: 'Side-by-side player comparisons with advanced metrics.', href: '/college-baseball/players/compare' },
    ],
  },
  coach: {
    headline: 'The data your program needs',
    ctaText: 'Full Dashboard',
    ctaHref: '/dashboard',
    cards: [
      { title: 'Dashboard', description: 'Centralized analytics across every sport you track.', href: '/dashboard' },
      { title: 'Rankings', description: 'National and conference rankings with predictive models.', href: '/college-baseball/rankings' },
      { title: 'Trends', description: 'Statistical trends and season projections.', href: '/college-baseball/trends' },
    ],
  },
};

const PERSONA_LABELS: Array<{ key: Persona; label: string }> = [
  { key: 'fan', label: 'Fan' },
  { key: 'scout', label: 'Scout' },
  { key: 'coach', label: 'Coach' },
];

const STORAGE_KEY = 'bsi-persona';

/**
 * PersonaSwitch — "Start Here" entry point segmentation.
 * Three toggles that reshape which cards/CTAs a visitor sees.
 * Persists in localStorage so returning visitors land where they left off.
 */
export function PersonaSwitch() {
  const [active, setActive] = useState<Persona>('fan');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Persona | null;
    if (stored && stored in PERSONAS) setActive(stored);
    setMounted(true);
  }, []);

  function handleSelect(persona: Persona) {
    setActive(persona);
    localStorage.setItem(STORAGE_KEY, persona);
  }

  const config = PERSONAS[active];

  return (
    <div>
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h2 className="text-2xl md:text-3xl font-display text-text-primary uppercase tracking-wide">
          <span className="text-gradient-brand">Start Here</span>
        </h2>

        {/* Toggle pills */}
        <div className="flex gap-2" role="radiogroup" aria-label="Select your role">
          {PERSONA_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              role="radio"
              aria-checked={active === key}
              className={`
                px-5 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${active === key
                  ? 'text-white shadow-glow-sm'
                  : 'glass-subtle text-text-secondary hover:text-text-primary hover:bg-surface'
                }
              `}
              style={
                active === key
                  ? { background: 'linear-gradient(135deg, #BF5700, #FF6B35)' }
                  : undefined
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Headline + CTA */}
      <p className={`text-lg text-text-secondary mb-6 transition-opacity duration-200 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        {config.headline}
      </p>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {config.cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="glass-default rounded-xl p-6 border border-border-subtle hover:border-burnt-orange/40 transition-all duration-300 group"
          >
            <h3 className="text-base font-display text-text-primary uppercase tracking-wide mb-2 group-hover:text-burnt-orange transition-colors">
              {card.title}
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">
              {card.description}
            </p>
          </Link>
        ))}
      </div>

      {/* Primary CTA */}
      <div className="mt-6 text-center sm:text-left">
        <Link
          href={config.ctaHref}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-burnt-orange to-burnt-orange/80 hover:from-burnt-orange/90 hover:to-burnt-orange text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300"
        >
          {config.ctaText}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
