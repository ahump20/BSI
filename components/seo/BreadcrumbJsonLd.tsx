'use client';

import { usePathname } from 'next/navigation';

const SEGMENT_LABELS: Record<string, string> = {
  'college-baseball': 'College Baseball',
  mlb: 'MLB',
  nfl: 'NFL',
  nba: 'NBA',
  cfb: 'College Football',
  intel: 'Intel',
  models: 'Models',
  'nil-valuation': 'NIL Valuation',
  arcade: 'Arcade',
  scores: 'Scores',
  standings: 'Standings',
  rankings: 'Rankings',
  teams: 'Teams',
  players: 'Players',
  news: 'News',
  games: 'Games',
  stats: 'Stats',
  editorial: 'Editorial',
  preseason: 'Preseason',
  conferences: 'Conferences',
  'transfer-portal': 'Transfer Portal',
  tournament: 'Tournament',
  hub: 'Hub',
  'game-briefs': 'Game Briefs',
  'team-dossiers': 'Team Dossiers',
  'weekly-brief': 'Weekly Brief',
  'data-quality': 'Data Quality',
  'monte-carlo': 'Monte Carlo',
  'win-probability': 'Win Probability',
  about: 'About',
  contact: 'Contact',
  pricing: 'Pricing',
  search: 'Search',
  dashboard: 'Dashboard',
  coverage: 'Coverage',
  glossary: 'Glossary',
  'data-sources': 'Data Sources',
  'live-scoreboards': 'Live Scoreboards',
  methodology: 'Methodology',
  tools: 'Tools',
  abs: 'At-Bats',
};

function labelFor(segment: string): string {
  return SEGMENT_LABELS[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Renders BreadcrumbList JSON-LD structured data based on the current pathname.
 * All data is derived from static route segments — no user input is interpolated.
 */
export function BreadcrumbJsonLd() {
  const pathname = usePathname();

  if (!pathname || pathname === '/') return null;

  const segments = pathname.replace(/\/$/, '').split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const items = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://blazesportsintel.com/' },
    ...segments.map((segment, i) => ({
      '@type': 'ListItem',
      position: i + 2,
      name: labelFor(segment),
      item: `https://blazesportsintel.com/${segments.slice(0, i + 1).join('/')}/`,
    })),
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };

  // Safe: jsonLd is built entirely from static route segments and a hardcoded label map.
  // No user-supplied content is interpolated.
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
