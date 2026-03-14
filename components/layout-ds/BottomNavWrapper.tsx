'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { MobileBottomNav } from '@/components/layout-ds/MobileBottomNav';
import { lockScroll, unlockScroll } from '@/lib/utils/scroll-lock';
import { getMorePanelNav } from '@/lib/navigation';

/* ── SVG close icon ── */

const IconX = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
);

/**
 * Fixed bottom nav for mobile with "More" slide-up panel.
 * Shows Home / Scores / CBB / Intel / More.
 */
export function BottomNavWrapper() {
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();

  const sections = useMemo(() => getMorePanelNav(), []);

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

    lockScroll();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMore();
    };
    document.addEventListener('keydown', handleKey);

    return () => {
      unlockScroll();
      document.removeEventListener('keydown', handleKey);
    };
  }, [moreOpen, closeMore]);

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
              className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface-scoreboard,#0A0A0A)]/95 backdrop-blur-xl border-t border-white/[0.06] rounded-t-sm"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <span className="text-xs uppercase tracking-widest text-[var(--bsi-dust)] font-medium">
                  More
                </span>
                <button
                  onClick={closeMore}
                  className="p-2 hover:bg-[var(--surface-dugout)] rounded-sm transition-colors"
                  aria-label="Close panel"
                >
                  <IconX />
                </button>
              </div>

              {/* Sections */}
              <nav className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
                {sections.map((section, si) => (
                  <div key={section.label}>
                    {si > 0 && (
                      <div className="mx-1 my-2 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                    )}
                    <p className="text-[9px] uppercase tracking-[0.15em] font-mono text-[var(--bsi-dust)] px-2 mb-1 mt-2">
                      {section.label}
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {section.items.map((item) => {
                        const active = !item.external && isActive(item.href);
                        const classes = `flex flex-col items-center gap-1.5 py-3 px-2 rounded-sm transition-colors ${
                          active
                            ? 'bg-[var(--bsi-primary)]/15 text-[var(--bsi-primary)]'
                            : 'text-[var(--bsi-dust)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-dugout)]'
                        }`;

                        if (item.external) {
                          return (
                            <a
                              key={item.href}
                              href={item.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={closeMore}
                              className={classes}
                            >
                              <span className="text-[11px] font-medium text-center leading-tight">
                                {item.label}
                                <span className="text-[8px] ml-0.5 opacity-50" aria-hidden="true">&#8599;</span>
                              </span>
                            </a>
                          );
                        }

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={closeMore}
                            className={classes}
                            aria-current={active ? 'page' : undefined}
                          >
                            <span className="text-[11px] font-medium text-center leading-tight">
                              {item.label}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom nav bar — 4 primary tabs + More */}
      <MobileBottomNav onMorePress={toggleMore} />
    </>
  );
}
