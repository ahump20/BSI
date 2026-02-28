'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

/* ========================================================================== */
/* SVG ICONS — 16x16 stroke-based, inherits currentColor                      */
/* ========================================================================== */

const IconGrid = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="1.5" width="5" height="5" rx="1" />
    <rect x="9.5" y="1.5" width="5" height="5" rx="1" />
    <rect x="1.5" y="9.5" width="5" height="5" rx="1" />
    <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
  </svg>
);

const IconActivity = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 8h3l2-5 2 10 2-5h3" />
    <circle cx="14" cy="8" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const IconBaseball = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6.5" />
    <path d="M4.5 2.5c1 1.5 1 3.5 0 5s-1 3.5 0 5" />
    <path d="M11.5 2.5c-1 1.5-1 3.5 0 5s1 3.5 0 5" />
  </svg>
);

const IconFootball = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="8" cy="8" rx="6.5" ry="4" transform="rotate(-45 8 8)" />
    <path d="M5.5 5.5l5 5" />
    <path d="M7 5.5L6 6.5M8.5 5.5L7 7M10.5 9L9 10.5M10.5 10.5L9.5 11.5" />
  </svg>
);

const IconBasketball = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6.5" />
    <path d="M1.5 8h13" />
    <path d="M8 1.5v13" />
    <path d="M3 3c2.5 1.5 4 3 5 5" />
    <path d="M13 3c-2.5 1.5-4 3-5 5" />
  </svg>
);

const IconChart = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 14l4-6 3 3 5-8" />
    <path d="M11 3h3v3" />
  </svg>
);

const IconList = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 4h10M3 8h10M3 12h10" />
    <circle cx="1" cy="4" r="0.5" fill="currentColor" stroke="none" />
    <circle cx="1" cy="8" r="0.5" fill="currentColor" stroke="none" />
    <circle cx="1" cy="12" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

const IconTarget = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6.5" />
    <circle cx="8" cy="8" r="3.5" />
    <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const IconBook = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 2.5h4.5c1 0 1.5.5 1.5 1.5v9.5c0-.75-.5-1.25-1.5-1.25H2V2.5z" />
    <path d="M14 2.5H9.5c-1 0-1.5.5-1.5 1.5v9.5c0-.75.5-1.25 1.5-1.25H14V2.5z" />
  </svg>
);

const IconTag = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1.5 9.25V2.5a1 1 0 011-1h6.75L14.5 6.75l-5.25 5.25a1 1 0 01-1.41 0L1.5 9.25z" />
    <circle cx="5" cy="5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const IconMenu = () => (
  <svg className="w-5 h-5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M2 4h12M2 8h12M2 12h12" />
  </svg>
);

const IconX = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
);

/* ========================================================================== */
/* NAV STRUCTURE — 5-sport site, rankings under flagship, labs external       */
/* ========================================================================== */

interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: React.ReactNode;
  readonly external?: boolean;
}

interface NavGroup {
  readonly label: string;
  readonly items: readonly NavItem[];
}

const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/', label: 'Dashboard', icon: <IconGrid /> },
      { href: '/scores', label: 'Live Scores', icon: <IconActivity /> },
    ],
  },
  {
    label: 'Sports',
    items: [
      { href: '/college-baseball', label: 'College Baseball', icon: <IconBaseball /> },
      { href: '/college-baseball/rankings', label: 'Rankings', icon: <IconList /> },
      { href: '/mlb', label: 'MLB', icon: <IconBaseball /> },
      { href: '/nfl', label: 'NFL', icon: <IconFootball /> },
      { href: '/nba', label: 'NBA', icon: <IconBasketball /> },
      { href: '/cfb', label: 'CFB', icon: <IconFootball /> },
    ],
  },
  {
    label: 'Tools',
    items: [
      { href: 'https://labs.blazesportsintel.com', label: 'BSI Savant', icon: <IconTarget />, external: true },
      { href: '/models', label: 'Models', icon: <IconChart /> },
      { href: '/glossary', label: 'Glossary', icon: <IconBook /> },
      { href: '/pricing', label: 'Pricing', icon: <IconTag /> },
    ],
  },
  {
    label: 'Ecosystem',
    items: [
      { href: 'https://blazecraft.app', label: 'BlazeCraft', icon: <IconGrid />, external: true },
      { href: '/arcade', label: 'Arcade', icon: <IconActivity /> },
    ],
  },
] as const;

/* ========================================================================== */
/* COMPONENT                                                                   */
/* ========================================================================== */

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Close mobile on route change
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  /** Match active state — exact for "/", prefix for everything else */
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  /* Shared nav content for desktop + mobile */
  const navContent = (
    <nav className="flex flex-col gap-0.5 px-2">
      {NAV_GROUPS.map((group, gi) => (
        <div key={group.label}>
          {/* Section divider line */}
          {gi > 0 && (
            <div className="mx-2 my-2 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          )}
          {/* Section label */}
          {!collapsed && (
            <span
              className="block px-3 pt-3 pb-1.5 text-[9px] uppercase tracking-[0.15em] font-mono text-[var(--bsi-text-dim)]"
            >
              {group.label}
            </span>
          )}
          {/* Items */}
          {group.items.map((item) => {
            const active = !item.external && isActive(item.href);
            const Wrapper = item.external ? 'a' : Link;
            const extraProps = item.external
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {};

            return (
              <Wrapper
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 relative ${
                  active
                    ? 'text-[var(--bsi-primary-light)]'
                    : 'text-[var(--bsi-text-muted)] hover:text-[var(--bsi-text)] hover:bg-white/[0.04]'
                }`}
                {...extraProps}
              >
                {active && (
                  <>
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-lg bg-burnt-orange/[0.12] shadow-[0_0_20px_rgba(191,87,0,0.08)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                    <motion.div
                      layoutId="sidebar-bar"
                      className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full bg-[var(--bsi-primary)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  </>
                )}
                <span className="relative w-4 shrink-0 flex items-center justify-center">
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="relative truncate">
                    {item.label}
                    {item.external && (
                      <span className="ml-1 text-[9px] opacity-40">↗</span>
                    )}
                  </span>
                )}
              </Wrapper>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className={`hidden md:flex flex-col border-r border-white/[0.05] transition-all duration-300 relative shrink-0 bg-midnight shadow-[inset_-1px_0_0_rgba(255,255,255,0.03)] ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        {/* Logo bar */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-white/[0.05]">
          <span
            className="text-xl font-bold font-display text-burnt-orange"
            style={{ textShadow: '0 0 20px rgba(191, 87, 0, 0.3)' }}
          >
            B
          </span>
          {!collapsed && (
            <div className="flex flex-col">
              <span
                className="text-xs font-semibold tracking-wider uppercase font-display"
              >
                BSI
              </span>
              <span
                className="text-[9px] uppercase tracking-[0.2em] text-[var(--bsi-text-dim)]"
              >
                Sports Intel
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-xs cursor-pointer transition-colors text-[var(--bsi-text-dim)]"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '▸' : '◂'}
          </button>
        </div>

        {/* Nav items */}
        <div className="flex-1 py-2 overflow-y-auto">{navContent}</div>

        {/* Footer */}
        {!collapsed && (
          <div className="px-4 py-3 border-t border-white/[0.05]">
            <a
              href="https://blazesportsintel.com"
              className="text-[9px] hover:text-[var(--bsi-text-muted)] transition-colors uppercase tracking-[0.15em] font-mono text-[var(--bsi-text-dim)]"
            >
              blazesportsintel.com
            </a>
          </div>
        )}
      </aside>

      {/* ── Mobile hamburger ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-lg glass-default cursor-pointer text-text-primary"
        aria-label="Open navigation"
      >
        <IconMenu />
      </button>

      {/* ── Mobile overlay drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={closeMobile}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-64 border-r border-white/[0.06] flex flex-col bg-midnight"
              style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              <div className="flex items-center justify-between px-4 h-14 border-b border-white/[0.06]">
                <span
                  className="text-sm font-semibold tracking-wider uppercase font-display"
                >
                  BSI
                </span>
                <button
                  onClick={closeMobile}
                  className="cursor-pointer p-1 text-[var(--bsi-text-dim)]"
                  aria-label="Close navigation"
                >
                  <IconX />
                </button>
              </div>
              <div className="flex-1 py-3 overflow-y-auto">{navContent}</div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
