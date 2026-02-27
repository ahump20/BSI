'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  CircleDot,
  Hexagon,
  Circle,
  MoreHorizontal,
  X,
  Gamepad2,
  Trophy,
  BarChart3,
  Volleyball,
  Award,
  Target,
  BookOpen,
} from 'lucide-react';
import { BottomNav, type BottomNavItem } from '@/components/sports';

/** Secondary pages shown in the "More" slide-up panel. */
const MORE_ITEMS = [
  { label: 'NBA', href: '/nba', icon: Circle },
  { label: 'College Football', href: '/cfb', icon: Award },
  { label: 'Scores', href: '/scores', icon: BarChart3 },
  { label: 'Editorial', href: '/college-baseball/editorial', icon: BookOpen },
  { label: 'NIL Valuation', href: '/nil-valuation', icon: Trophy },
  { label: 'Arcade', href: '/arcade', icon: Gamepad2 },
  { label: 'Dashboard', href: '/dashboard', icon: Target },
];

/**
 * Fixed bottom nav for mobile with "More" slide-up panel.
 * Shows Home / MLB / NFL / NBA / More — predictable sport-switching pattern.
 */
export function BottomNavWrapper() {
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();

  const toggleMore = useCallback(() => {
    setMoreOpen((prev) => !prev);
  }, []);

  const closeMore = useCallback(() => {
    setMoreOpen(false);
  }, []);

  // Close panel on route change
  useEffect(() => {
    closeMore();
  }, [pathname, closeMore]);

  // Lock body scroll and handle Escape when panel is open
  useEffect(() => {
    if (!moreOpen) return;

    document.body.style.overflow = 'hidden';
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMore();
    };
    document.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKey);
    };
  }, [moreOpen, closeMore]);

  const items: BottomNavItem[] = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'CBB', href: '/college-baseball', icon: Volleyball },
    { label: 'MLB', href: '/mlb', icon: CircleDot },
    { label: 'NFL', href: '/nfl', icon: Hexagon },
    { label: 'More', href: '#more', icon: MoreHorizontal, onPress: toggleMore },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* More panel */}
      <AnimatePresence>
        {moreOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[45] bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMore}
              aria-hidden="true"
            />

            {/* Slide-up panel */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="More navigation"
              className="fixed bottom-0 left-0 right-0 z-50 bg-midnight/95 backdrop-blur-xl border-t border-border rounded-t-2xl"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <span className="text-xs uppercase tracking-widest text-text-muted font-medium">
                  More
                </span>
                <button
                  onClick={closeMore}
                  className="p-2 hover:bg-surface rounded-lg transition-colors"
                  aria-label="Close panel"
                >
                  <X className="w-4 h-4 text-text-muted" />
                </button>
              </div>

              {/* Links */}
              <nav className="px-4 pb-4 grid grid-cols-3 gap-2">
                {MORE_ITEMS.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMore}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-colors ${
                        active
                          ? 'bg-burnt-orange/15 text-burnt-orange'
                          : 'text-text-muted hover:text-text-primary hover:bg-surface-light'
                      }`}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[11px] font-medium text-center leading-tight">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom nav bar */}
      <BottomNav items={items} className="md:hidden" />
    </>
  );
}
