'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

export interface NavItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Navigation href */
  href: string;
  /** SVG path data for icon (24x24 viewBox assumed) */
  icon: string;
}

interface BottomNavProps {
  /** Navigation items to display - if not provided, auto-detects based on route */
  items?: NavItem[];
  /** Force a specific sport context (overrides route detection) */
  sportContext?: string;
  /** Optional className for the container */
  className?: string;
}

const SPORT_OPTIONS = [
  {
    label: 'College Baseball',
    href: '/college-baseball',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.41 0 8 3.59 8 8 0 1.85-.63 3.55-1.69 4.9z',
  },
  {
    label: 'MLB',
    href: '/mlb',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.41 0 8 3.59 8 8 0 1.85-.63 3.55-1.69 4.9z',
  },
  {
    label: 'NFL',
    href: '/nfl',
    icon: 'M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 1zM12 18c-.83 0-1.5-.67-1.5-1.5S11.17 15 12 15s1.5.67 1.5 1.5S12.83 18 12 18zm4-6H7V4h9v8z',
  },
  {
    label: 'NBA',
    href: '/nba',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z',
  },
  {
    label: 'College Football',
    href: '/cfb',
    icon: 'M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 1zM12 18c-.83 0-1.5-.67-1.5-1.5S11.17 15 12 15s1.5.67 1.5 1.5S12.83 18 12 18zm4-6H7V4h9v8z',
  },
];

/**
 * BottomNav - Fixed bottom navigation for mobile
 *
 * ESPN-style bottom navigation bar with icons and labels.
 * Features:
 * - Fixed to bottom of viewport
 * - Safe area inset for notched devices
 * - Automatic active state detection via pathname
 * - Touch-friendly tap targets (44px minimum)
 * - Sport switcher half-sheet overlay
 */
export function BottomNav({ items, sportContext, className = '' }: BottomNavProps) {
  const pathname = usePathname();
  const [isSportSheetOpen, setIsSportSheetOpen] = useState(false);

  // Determine which items to show based on: explicit items > sportContext > auto-detect from pathname
  const navItems =
    items || (sportContext && SPORT_NAV_ITEMS[sportContext]) || getBottomNavItems(pathname);

  const isActive = (href: string): boolean => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav
        className={`
          fixed bottom-0 left-0 right-0 z-[1000]
          flex justify-around
          bg-charcoal border-t border-gray-700
          py-2 pb-[max(8px,env(safe-area-inset-bottom))]
          md:hidden
          ${className}
        `}
        role="navigation"
        aria-label="Main navigation"
      >
        {navItems.map((item) => {
          // Special handling for "Sports" item — opens half-sheet instead of navigating
          if (item.id === 'sports-switcher') {
            return (
              <button
                key={item.id}
                onClick={() => setIsSportSheetOpen(true)}
                className={`
                  flex flex-col items-center gap-0.5
                  px-4 py-1 min-w-16 min-h-11
                  text-[10px] uppercase no-underline
                  transition-colors duration-150
                  ${isSportSheetOpen ? 'text-burnt-orange' : 'text-gray-500 hover:text-gray-300'}
                `}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </button>
            );
          }

          const active = isActive(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`
                flex flex-col items-center gap-0.5
                px-4 py-1 min-w-16 min-h-11
                text-[10px] uppercase no-underline
                transition-colors duration-150
                ${active ? 'text-burnt-orange' : 'text-gray-500 hover:text-gray-300'}
              `}
              aria-current={active ? 'page' : undefined}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d={item.icon} />
              </svg>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sport Switcher Half-Sheet */}
      <AnimatePresence>
        {isSportSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-midnight/60 backdrop-blur-sm z-[1001] md:hidden"
              onClick={() => setIsSportSheetOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[1002] bg-charcoal rounded-t-2xl border-t border-border-subtle pb-[max(16px,env(safe-area-inset-bottom))] md:hidden"
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-gray-600" />
              </div>
              <div className="px-6 pb-2">
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                  Sports
                </h3>
              </div>
              <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                {SPORT_OPTIONS.map((sport) => (
                  <Link
                    key={sport.href}
                    href={sport.href}
                    onClick={() => setIsSportSheetOpen(false)}
                    className={`
                      flex items-center gap-3 p-4 rounded-xl
                      border transition-colors
                      ${
                        isActive(sport.href)
                          ? 'bg-burnt-orange/10 border-burnt-orange/30 text-burnt-orange'
                          : 'bg-midnight/50 border-border-subtle text-text-primary hover:border-burnt-orange/20'
                      }
                    `}
                  >
                    <svg
                      className="w-6 h-6 flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d={sport.icon} />
                    </svg>
                    <span className="text-sm font-medium">{sport.label}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Default navigation items — Home, Scores, Portal, Dashboard, Sports switcher
export const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  },
  {
    id: 'scores',
    label: 'Scores',
    href: '/scores',
    icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
  },
  {
    id: 'portal',
    label: 'Portal',
    href: '/transfer-portal',
    icon: 'M12 5.9c1.16 0 2.1.94 2.1 2.1s-.94 2.1-2.1 2.1S9.9 9.16 9.9 8s.94-2.1 2.1-2.1m0 9c2.97 0 6.1 1.46 6.1 2.1v1.1H5.9V17c0-.64 3.13-2.1 6.1-2.1M12 4C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 9c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
  },
  {
    id: 'sports-switcher',
    label: 'Sports',
    href: '#',
    icon: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
  },
];

// Sport-specific navigation items
export const SPORT_NAV_ITEMS: Record<string, NavItem[]> = {
  'college-baseball': [
    {
      id: 'scores',
      label: 'Scores',
      href: '/college-baseball/scores',
      icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
    },
    {
      id: 'standings',
      label: 'Standings',
      href: '/college-baseball/standings',
      icon: 'M4 14h4v7H4v-7zm6-5h4v12h-4V9zm6-4h4v16h-4V5z',
    },
    {
      id: 'rankings',
      label: 'Rankings',
      href: '/college-baseball/rankings',
      icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    },
    {
      id: 'portal',
      label: 'Portal',
      href: '/college-baseball/transfer-portal',
      icon: 'M12 5.9c1.16 0 2.1.94 2.1 2.1s-.94 2.1-2.1 2.1S9.9 9.16 9.9 8s.94-2.1 2.1-2.1m0 9c2.97 0 6.1 1.46 6.1 2.1v1.1H5.9V17c0-.64 3.13-2.1 6.1-2.1M12 4C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 9c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z',
    },
    {
      id: 'sports-switcher',
      label: 'Sports',
      href: '#',
      icon: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
    },
  ],
  mlb: [
    {
      id: 'scores',
      label: 'Scores',
      href: '/mlb/scores',
      icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
    },
    {
      id: 'standings',
      label: 'Standings',
      href: '/mlb/standings',
      icon: 'M4 14h4v7H4v-7zm6-5h4v12h-4V9zm6-4h4v16h-4V5z',
    },
    {
      id: 'stats',
      label: 'Stats',
      href: '/mlb/stats',
      icon: 'M3 3v18h18V3H3zm14 4v10H7V7h10z',
    },
    {
      id: 'teams',
      label: 'Teams',
      href: '/mlb/teams',
      icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
    },
    {
      id: 'sports-switcher',
      label: 'Sports',
      href: '#',
      icon: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
    },
  ],
  nfl: [
    {
      id: 'scores',
      label: 'Scores',
      href: '/nfl/scores',
      icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
    },
    {
      id: 'standings',
      label: 'Standings',
      href: '/nfl/standings',
      icon: 'M4 14h4v7H4v-7zm6-5h4v12h-4V9zm6-4h4v16h-4V5z',
    },
    {
      id: 'stats',
      label: 'Stats',
      href: '/nfl/stats',
      icon: 'M3 3v18h18V3H3zm14 4v10H7V7h10z',
    },
    {
      id: 'teams',
      label: 'Teams',
      href: '/nfl/teams',
      icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
    },
    {
      id: 'sports-switcher',
      label: 'Sports',
      href: '#',
      icon: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
    },
  ],
  nba: [
    {
      id: 'scores',
      label: 'Scores',
      href: '/nba/scores',
      icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
    },
    {
      id: 'standings',
      label: 'Standings',
      href: '/nba/standings',
      icon: 'M4 14h4v7H4v-7zm6-5h4v12h-4V9zm6-4h4v16h-4V5z',
    },
    {
      id: 'stats',
      label: 'Stats',
      href: '/nba/stats',
      icon: 'M3 3v18h18V3H3zm14 4v10H7V7h10z',
    },
    {
      id: 'teams',
      label: 'Teams',
      href: '/nba/teams',
      icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
    },
    {
      id: 'sports-switcher',
      label: 'Sports',
      href: '#',
      icon: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
    },
  ],
};

/**
 * Get sport-specific nav items based on current pathname
 */
export function getBottomNavItems(pathname: string): NavItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const sportKey = segments[0];

  if (sportKey && SPORT_NAV_ITEMS[sportKey]) {
    return SPORT_NAV_ITEMS[sportKey];
  }

  return DEFAULT_NAV_ITEMS;
}

export default BottomNav;
