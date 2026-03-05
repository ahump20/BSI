'use client';

import { usePathname } from 'next/navigation';

/* ========================================================================== */
/* ROUTE → TITLE MAP                                                          */
/* ========================================================================== */

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/scores': 'Live Scores',
  '/college-baseball': 'College Baseball',
  '/mlb': 'MLB',
  '/nfl': 'NFL',
  '/nba': 'NBA',
  '/cfb': 'College Football',
  '/models': 'Models',
  '/glossary': 'Glossary',
  '/pricing': 'Pricing',
  '/analytics': 'Analytics',
  '/search': 'Search',
  '/settings': 'Settings',
  '/intel': 'Intel',
};

function getPageTitle(pathname: string): string {
  // Exact match first
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];

  // Prefix match — try progressively shorter segments
  const segments = pathname.split('/').filter(Boolean);
  while (segments.length > 0) {
    const prefix = '/' + segments.join('/');
    if (ROUTE_TITLES[prefix]) return ROUTE_TITLES[prefix];
    segments.pop();
  }

  return 'Blaze Sports Intel';
}

/* ========================================================================== */
/* COMPONENT                                                                   */
/* ========================================================================== */

export function AppTopBar() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="h-14 border-b border-white/[0.05] flex items-center justify-between px-4 md:px-6 shrink-0 relative bg-[color-mix(in_srgb,var(--bsi-surface)_80%,transparent)] backdrop-blur-glass shadow-[0_1px_0_rgba(var(--bsi-primary-rgb),0.06)]">
      {/* Left: page title (shifted right on mobile to avoid hamburger) */}
      <div className="flex items-center gap-4 ml-10 md:ml-0">
        <h1 className="font-display text-sm font-semibold tracking-wider uppercase hidden sm:block">
          {title}
        </h1>
      </div>

      {/* Right: live indicator + search hint */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--bsi-success)] pulse-dot" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--bsi-text-dim)]">
            Live
          </span>
        </span>
        <div className="w-px h-4 bg-white/[0.06]" />
        <span className="font-mono text-[11px] uppercase tracking-wider hidden sm:inline text-text-muted">
          ⌘K
        </span>
      </div>
    </header>
  );
}
