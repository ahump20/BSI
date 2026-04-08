'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getSidebarNav, type NavIconKey } from '@/lib/navigation';
import { lockScroll, unlockScroll } from '@/lib/utils/scroll-lock';

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

const IconGlobe = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6.5" />
    <path d="M1.5 8h13" />
    <path d="M8 1.5c2 2.5 2 5.5 0 13" />
    <path d="M8 1.5c-2 2.5-2 5.5 0 13" />
  </svg>
);

const IconPen = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11.5 2.5l2 2-8 8H3.5v-2z" />
    <path d="M9.5 4.5l2 2" />
  </svg>
);

const IconInfo = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6.5" />
    <path d="M8 7v4" />
    <circle cx="8" cy="5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

const IconFlask = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2h4M7 2v4l-4 7h10l-4-7V2" />
  </svg>
);

const IconDollar = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6.5" />
    <path d="M8 4v8M6 6c0-.83 1-1.5 2-1.5s2 .67 2 1.5-1 1.5-2 1.5-2 .67-2 1.5 1 1.5 2 1.5 2-.67 2-1.5" />
  </svg>
);

const IconStar = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 1.5l2 4.5 5 .5-3.5 3.5 1 5L8 12.5 3.5 15l1-5L1 6.5l5-.5z" />
  </svg>
);

const IconBrain = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 14V8M5 8c-2 0-3-1.5-3-3s1-3 3-3c.5 0 1 .1 1.5.3C7 1.5 7.5 1 8 1s1 .5 1.5 1.3C10 2.1 10.5 2 11 2c2 0 3 1.5 3 3s-1 3-3 3" />
    <path d="M5 8c0 2 1.5 3.5 3 6M11 8c0 2-1.5 3.5-3 6" />
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
/* ICON MAP — resolves NavIconKey → React element                              */
/* ========================================================================== */

const ICON_MAP: Record<NavIconKey, () => React.JSX.Element> = {
  grid: IconGrid,
  activity: IconActivity,
  baseball: IconBaseball,
  football: IconFootball,
  basketball: IconBasketball,
  chart: IconChart,
  list: IconList,
  target: IconTarget,
  book: IconBook,
  tag: IconTag,
  globe: IconGlobe,
  pen: IconPen,
  info: IconInfo,
  flask: IconFlask,
  dollar: IconDollar,
  star: IconStar,
  brain: IconBrain,
  home: IconGrid,
  more: IconGrid,
};

/* ========================================================================== */
/* COMPONENT                                                                   */
/* ========================================================================== */

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const navGroups = useMemo(() => getSidebarNav(), []);

  // Close mobile on route change
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  // Escape key closes mobile drawer
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobile();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mobileOpen, closeMobile]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    lockScroll();
    return () => { unlockScroll(); };
  }, [mobileOpen]);

  /** Match active state — exact for "/", prefix for everything else */
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  /* Shared nav content for desktop + mobile */
  const navContent = (
    <nav className="flex flex-col gap-0.5 px-2">
      {navGroups.map((group, gi) => (
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
              ? { target: '_blank' as const, rel: 'noopener noreferrer' }
              : {};
            const Icon = ICON_MAP[item.iconKey];

            return (
              <Wrapper
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                className={`flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-all duration-200 relative ${
                  active
                    ? 'text-[var(--bsi-primary-light)]'
                    : 'text-[var(--bsi-text-muted)] hover:text-[var(--bsi-text)] hover:bg-white/[0.06]'
                }`}
                {...extraProps}
              >
                {active && (
                  <>
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-sm bg-burnt-orange/[0.12] shadow-[0_0_20px_rgba(191,87,0,0.08)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                    <motion.div
                      layoutId="sidebar-bar"
                      className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full bg-[var(--bsi-primary)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  </>
                )}
                <span aria-hidden="true" className="relative w-4 shrink-0 flex items-center justify-center">
                  <Icon />
                </span>
                {!collapsed && (
                  <span className="relative truncate">
                    {item.label}
                    {item.external && (
                      <span aria-hidden="true" className="ml-1 text-[9px] opacity-40">↗</span>
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
        className={`hidden md:flex flex-col border-r border-border-vintage transition-all duration-300 relative shrink-0 bg-surface-scoreboard shadow-[inset_-1px_0_0_rgba(140,98,57,0.08)] ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        {/* Logo bar */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-white/[0.05]">
          <img
            src="/images/brand/bsi-mascot-200.png"
            alt="BSI"
            width={28}
            height={28}
            className="rounded-sm"
            style={{ filter: 'drop-shadow(0 0 12px rgba(191, 87, 0, 0.3))' }}
          />
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
            <span aria-hidden="true">{collapsed ? '▸' : '◂'}</span>
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
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-sm bg-[var(--surface-dugout)] border border-[var(--border-vintage)] cursor-pointer text-text-primary"
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
              role="dialog"
              aria-modal="true"
              aria-label="Site navigation"
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
