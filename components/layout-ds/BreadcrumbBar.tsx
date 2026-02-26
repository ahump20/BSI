'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/Breadcrumb';

/** Known slug → display label mappings. */
const SEGMENT_LABELS: Record<string, string> = {
  'college-baseball': 'College Baseball',
  'college-football': 'College Football',
  mlb: 'MLB',
  nfl: 'NFL',
  nba: 'NBA',
  cfb: 'CFB',
  cbb: 'CBB',
  'nil-valuation': 'NIL Valuation',
  'vision-ai': 'Vision AI',
  'presence-coach': 'Presence Coach',
  arcade: 'Arcade',
  dashboard: 'Dashboard',
  scores: 'Scores',
  standings: 'Standings',
  rankings: 'Rankings',
  teams: 'Teams',
  players: 'Players',
  news: 'News',
  editorial: 'Editorial',
  daily: 'Daily',
  game: 'Game',
  compare: 'Compare',
  trends: 'Trends',
  live: 'Live',
  conferences: 'Conferences',
  // Conference slugs
  sec: 'SEC',
  acc: 'ACC',
  'big-12': 'Big 12',
  'big-ten': 'Big Ten',
  'pac-12': 'Pac-12',
  'big-east': 'Big East',
  aac: 'AAC',
  'sun-belt': 'Sun Belt',
  'mountain-west': 'Mountain West',
  'c-usa': 'C-USA',
  'a-10': 'A-10',
  colonial: 'Colonial',
  'missouri-valley': 'Missouri Valley',
  wcc: 'WCC',
  'big-west': 'Big West',
  southland: 'Southland',
  asun: 'ASUN',
  wac: 'WAC',
};

/** Convert a URL slug to a display label. */
function segmentToLabel(segment: string): string {
  const known = SEGMENT_LABELS[segment];
  if (known) return known;

  // Title-case fallback: "some-slug" → "Some Slug", truncate at 30 chars
  const label = segment
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return label.length > 30 ? label.slice(0, 27) + '...' : label;
}

/**
 * Auto-generating breadcrumb bar.
 * Reads the current pathname and builds breadcrumb items from URL segments.
 * Returns null on homepage. Non-sticky — scrolls with page content.
 */
export function BreadcrumbBar() {
  const pathname = usePathname();

  const items = useMemo<BreadcrumbItem[]>(() => {
    if (pathname === '/') return [];

    const segments = pathname.split('/').filter(Boolean);
    const crumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

    segments.forEach((segment, i) => {
      const href = '/' + segments.slice(0, i + 1).join('/');
      crumbs.push({
        label: segmentToLabel(segment),
        href,
      });
    });

    return crumbs;
  }, [pathname]);

  if (items.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-2">
      <Breadcrumb items={items} />
    </div>
  );
}
