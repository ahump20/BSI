'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getBottomNav, type NavIconKey } from '@/lib/navigation';

/* ── SVG Icons — 16x16 stroke-based, inherits currentColor ── */

const IconHome = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M1.5 7L8 1.5 14.5 7V14H10V10H6v4H1.5V7z" />
  </svg>
);

const IconActivity = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M1 8h3l2-5 2 10 2-5h3" />
    <circle cx="14" cy="8" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const IconBaseball = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="8" cy="8" r="6.5" />
    <path d="M4.5 2.5c1 1.5 1 3.5 0 5s-1 3.5 0 5" />
    <path d="M11.5 2.5c-1 1.5-1 3.5 0 5s1 3.5 0 5" />
  </svg>
);

const IconBrain = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M8 14V8M5 8c-2 0-3-1.5-3-3s1-3 3-3c.5 0 1 .1 1.5.3C7 1.5 7.5 1 8 1s1 .5 1.5 1.3C10 2.1 10.5 2 11 2c2 0 3 1.5 3 3s-1 3-3 3" />
    <path d="M5 8c0 2 1.5 3.5 3 6M11 8c0 2-1.5 3.5-3 6" />
  </svg>
);

const IconChart = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M2 14V9M6 14V6M10 14V4M14 14V2" />
  </svg>
);

const IconMore = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="3" cy="8" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="13" cy="8" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

/* ── Icon map ── */

const ICON_MAP: Record<NavIconKey, () => React.JSX.Element> = {
  home: IconHome,
  activity: IconActivity,
  baseball: IconBaseball,
  brain: IconBrain,
  // Unused keys in bottom nav — fallback to IconHome
  grid: IconHome, football: IconHome, basketball: IconHome, chart: IconChart,
  list: IconHome, target: IconHome, book: IconHome, tag: IconHome,
  globe: IconHome, pen: IconHome, info: IconHome, flask: IconHome,
  dollar: IconHome, star: IconHome, more: IconMore,
};

/* ── Component ── */

export function MobileBottomNav({ onMorePress }: { onMorePress?: () => void }) {
  const pathname = usePathname();
  const navItems = getBottomNav();
  // Defer active state to avoid hydration mismatch on placeholder-shell pages
  // where the server-rendered pathname differs from the client URL.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isActive = (href: string) => {
    if (!mounted) return false; // Match server render: no active state
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-scoreboard border-t border-border-vintage shadow-[0_-4px_24px_rgba(0,0,0,0.4)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch">
        {navItems.map(({ href, label, iconKey }) => {
          const active = isActive(href);
          const Icon = ICON_MAP[iconKey];
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 flex-1 min-h-[48px] py-2.5 px-1 transition-colors ${
                active
                  ? 'text-burnt-orange'
                  : 'text-[rgba(245,240,235,0.35)] hover:text-[rgba(245,240,235,0.65)]'
              }`}
            >
              {/* Active indicator bar */}
              <span
                className={`absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-b-full transition-opacity ${
                  active ? 'bg-bsi-primary opacity-100' : 'opacity-0'
                }`}
                aria-hidden="true"
              />
              <span aria-hidden="true" className="relative">
                <Icon />
                {active && (
                  <span
                    className="absolute inset-0 rounded-full blur-sm bg-bsi-primary/20"
                    aria-hidden="true"
                  />
                )}
              </span>
              <span
                className="relative"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  lineHeight: 1,
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}

        {/* More button — toggles the slide-up panel */}
        <button
          onClick={onMorePress}
          className="flex flex-col items-center justify-center gap-1 flex-1 min-h-[48px] py-2.5 px-1 transition-colors text-[rgba(245,240,235,0.35)] hover:text-[rgba(245,240,235,0.65)]"
          aria-label="More navigation options"
        >
          <span aria-hidden="true" className="relative">
            <IconMore />
          </span>
          <span
            className="relative"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              lineHeight: 1,
            }}
          >
            More
          </span>
        </button>
      </div>
    </nav>
  );
}
