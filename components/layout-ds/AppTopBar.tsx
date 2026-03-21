'use client';

import { usePathname } from 'next/navigation';

/* ========================================================================== */
/* ROUTE → TITLE MAP                                                          */
/* ========================================================================== */

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/scores': 'Live Scores',
  '/college-baseball': 'College Baseball',
  '/college-baseball/editorial': 'Editorial',
  '/college-baseball/savant': 'BSI Savant',
  '/college-baseball/rankings': 'Rankings',
  '/college-baseball/standings': 'Standings',
  '/college-baseball/conferences': 'Conferences',
  '/college-baseball/compare': 'Compare',
  '/college-baseball/transfer-portal': 'Transfer Portal',
  '/college-baseball/watchlist': 'Watchlist',
  '/mlb': 'MLB',
  '/mlb/the-show-26/diamond-dynasty': 'Diamond Dynasty',
  '/nfl': 'NFL',
  '/nba': 'NBA',
  '/cfb': 'College Football',
  '/college-baseball/savant/glossary': 'Glossary',
  '/pricing': 'Pricing',
  '/search': 'Search',
  '/settings': 'Settings',
  '/intel': 'Intelligence',
  '/nil-valuation': 'NIL Valuation',
  '/nil-valuation/tools': 'NIL Tools',
  '/nil-valuation/performance-index': 'Performance Index',
  '/about': 'About',
  '/contact': 'Contact',
  '/status': 'System Status',
  '/data-sources': 'Data Sources',
  '/arcade': 'Arcade',
  '/dashboard': 'Dashboard',
  '/dashboard/intel': 'Intel Dashboard',
  '/research': 'Research',
  '/vision-ai': 'Vision AI',
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
/* SEARCH ICON                                                                 */
/* ========================================================================== */

const IconSearch = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5L14 14" />
  </svg>
);

/* ========================================================================== */
/* COMPONENT                                                                   */
/* ========================================================================== */

export function AppTopBar() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  const openSearch = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  };

  return (
    <header className="h-14 border-b border-white/[0.05] flex items-center justify-between px-4 md:px-6 shrink-0 relative bg-[color-mix(in_srgb,var(--bsi-surface)_80%,transparent)] backdrop-blur-glass shadow-[0_1px_0_rgba(var(--bsi-primary-rgb),0.06)]">
      {/* Left: page title (shifted right on mobile to avoid hamburger) */}
      <div className="flex items-center gap-4 ml-10 md:ml-0">
        <h1 className="font-display text-sm font-semibold tracking-wider uppercase hidden sm:block">
          {title}
        </h1>
      </div>

      {/* Right: search button + live indicator */}
      <div className="flex items-center gap-3">
        {/* Search trigger — visible, clickable button */}
        <button
          onClick={openSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-sm border border-white/[0.08] hover:border-[var(--bsi-primary)]/30 hover:bg-white/[0.04] transition-all cursor-pointer group"
          aria-label="Search (Cmd+K)"
        >
          <IconSearch />
          <span className="hidden sm:inline text-[11px] text-[var(--bsi-dust)] group-hover:text-[var(--bsi-bone)] transition-colors">
            Search
          </span>
          <kbd className="hidden sm:inline text-[10px] text-[var(--bsi-dust)] bg-white/[0.06] px-1.5 py-0.5 rounded-sm font-mono ml-1">
            ⌘K
          </kbd>
        </button>

        <div className="w-px h-4 bg-white/[0.06]" />

        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--bsi-success)] pulse-dot" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--bsi-text-dim)]">
            Live
          </span>
        </span>
      </div>
    </header>
  );
}
