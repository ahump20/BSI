'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
  /** Navigation items to display */
  items: NavItem[];
  /** Optional className for the container */
  className?: string;
}

/**
 * BottomNav - Fixed bottom navigation for mobile
 *
 * ESPN-style bottom navigation bar with icons and labels.
 * Features:
 * - Fixed to bottom of viewport
 * - Safe area inset for notched devices
 * - Automatic active state detection via pathname
 * - Touch-friendly tap targets (44px minimum)
 */
export function BottomNav({ items, className = '' }: BottomNavProps) {
  const pathname = usePathname();

  const isActive = (href: string): boolean => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={`
        fixed bottom-0 left-0 right-0 z-[1000]
        flex justify-around
        bg-charcoal border-t border-gray-700
        py-2 pb-[max(8px,env(safe-area-inset-bottom))]
        ${className}
      `}
      role="navigation"
      aria-label="Main navigation"
    >
      {items.map((item) => {
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
  );
}

// Default navigation items matching the design package
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
    id: 'watch',
    label: 'Watch',
    href: '/watch',
    icon: 'M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12zM10 8v6l5-3z',
  },
  {
    id: 'teams',
    label: 'Teams',
    href: '/teams',
    icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  },
  {
    id: 'more',
    label: 'More',
    href: '/more',
    icon: 'M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
  },
];

export default BottomNav;
