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
    <header
      className="h-14 border-b border-white/[0.05] flex items-center justify-between px-4 md:px-6 shrink-0 relative"
      style={{
        background: 'color-mix(in srgb, var(--bsi-surface) 80%, transparent)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 1px 0 rgba(var(--bsi-primary-rgb), 0.06)',
      }}
    >
      {/* Left: page title (shifted right on mobile to avoid hamburger) */}
      <div className="flex items-center gap-4 ml-10 md:ml-0">
        <h1
          className="text-sm font-semibold tracking-wider uppercase hidden sm:block"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h1>
      </div>

      {/* Right: live indicator + search hint */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--bsi-success)] pulse-dot" />
          <span
            className="text-[10px] uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--bsi-text-dim)' }}
          >
            Live
          </span>
        </span>
        <div className="w-px h-4 bg-white/[0.06]" />
        <span
          className="text-[11px] uppercase tracking-wider hidden sm:inline"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--bsi-text-muted)' }}
        >
          ⌘K
        </span>
      </div>
    </header>
  );
}
