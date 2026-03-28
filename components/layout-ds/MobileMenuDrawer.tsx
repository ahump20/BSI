'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { X, ChevronDown } from 'lucide-react';
import type { LeagueNavItem } from '@/lib/navigation';
import { lockScroll, unlockScroll } from '@/lib/utils/scroll-lock';

interface MenuItem {
  label: string;
  href: string;
}

interface MobileMenuDrawerProps {
  open: boolean;
  onClose: () => void;
  primary: MenuItem[];
  leagues: LeagueNavItem[];
  secondary: MenuItem[];
  analytics?: MenuItem[];
}

/** Sub-links shown when a league is expanded. */
const SPORT_SUB_LINKS: Record<string, { label: string; suffix: string }[]> = {
  '/mlb': [
    { label: 'Scores', suffix: '/scores' },
    { label: 'Standings', suffix: '/standings' },
  ],
  '/nfl': [
    { label: 'Scores', suffix: '/scores' },
    { label: 'Standings', suffix: '/standings' },
  ],
  '/nba': [
    { label: 'Scores', suffix: '/scores' },
    { label: 'Standings', suffix: '/standings' },
  ],
  '/college-baseball': [
    { label: 'Scores', suffix: '/scores' },
    { label: 'Standings', suffix: '/standings' },
    { label: 'Teams', suffix: '/teams' },
    { label: 'Rankings', suffix: '/rankings' },
    { label: 'Savant', suffix: '/savant' },
  ],
  '/cfb': [
    { label: 'Scores', suffix: '/scores' },
    { label: 'Standings', suffix: '/standings' },
  ],
};

const SWIPE_CLOSE_THRESHOLD = 100;

const drawerVariants = {
  hidden: { x: '100%' },
  visible: { x: 0 },
  exit: { x: '100%' },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const linkStagger = {
  visible: {
    transition: { staggerChildren: 0.03 },
  },
};

const linkItem = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
};

export function MobileMenuDrawer({
  open,
  onClose,
  primary,
  leagues,
  secondary,
  analytics = [],
}: MobileMenuDrawerProps) {
  const pathname = usePathname();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [expandedLeague, setExpandedLeague] = useState<string | null>(null);
  const [dragX, setDragX] = useState(0);

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      closeButtonRef.current?.focus();
      lockScroll();
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (open) unlockScroll();
    };
  }, [open, handleKeyDown]);

  // Reset expanded league on close
  useEffect(() => {
    if (!open) setExpandedLeague(null);
  }, [open]);

  const handlePan = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 0) {
      setDragX(info.offset.x);
    }
  };

  const handlePanEnd = (_: unknown, info: PanInfo) => {
    setDragX(0);
    if (info.offset.x > SWIPE_CLOSE_THRESHOLD || info.velocity.x > 500) {
      onClose();
    }
  };

  const renderLink = (item: MenuItem) => {
    const active = isActive(item.href);
    return (
      <motion.div key={item.href} variants={linkItem}>
        <Link
          href={item.href}
          onClick={onClose}
          aria-current={active ? 'page' : undefined}
          className={`block w-full px-4 py-3 rounded-sm transition-all min-h-12 flex items-center relative ${
            active
              ? 'text-[var(--bsi-primary)] font-semibold bg-surface'
              : 'text-[var(--bsi-dust)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)]'
          }`}
        >
          {active && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--bsi-primary)] rounded-r" />
          )}
          <span className={active ? 'pl-2' : ''}>{item.label}</span>
        </Link>
      </motion.div>
    );
  };

  const renderLeagueLink = (item: LeagueNavItem) => {
    const active = isActive(item.href);
    const isLive = item.phase !== 'offseason';
    const isExpanded = expandedLeague === item.href;
    const subLinks = SPORT_SUB_LINKS[item.href];

    return (
      <motion.div key={item.href} variants={linkItem}>
        <div className="relative">
          {active && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--bsi-primary)] rounded-r z-10" />
          )}
          <div className="flex items-center">
            <Link
              href={item.href}
              onClick={onClose}
              aria-current={active ? 'page' : undefined}
              className={`flex-1 flex items-center justify-between px-4 py-3 rounded-l-sm transition-all min-h-12 ${
                active
                  ? 'text-[var(--bsi-primary)] font-semibold bg-surface'
                  : 'text-[var(--bsi-dust)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)]'
              }`}
            >
              <span className={active ? 'pl-2' : ''}>{item.label}</span>
              <span className="flex items-center gap-2">
                {item.phaseLabel && (
                  <span className="text-[10px] text-[rgba(196,184,165,0.35)]">{item.phaseLabel}</span>
                )}
                {isLive && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--bsi-primary)] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--bsi-primary)]" />
                  </span>
                )}
              </span>
            </Link>
            {subLinks && subLinks.length > 0 && (
              <button
                onClick={() => setExpandedLeague(isExpanded ? null : item.href)}
                className={`px-3 py-3 rounded-r-sm transition-colors min-h-12 ${
                  active ? 'bg-surface' : 'hover:bg-[var(--surface-press-box)]'
                }`}
                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${item.label} links`}
                aria-expanded={isExpanded}
              >
                <ChevronDown
                  className={`w-4 h-4 text-[rgba(196,184,165,0.35)] transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>
            )}
          </div>
        </div>

        {/* Expandable sub-links */}
        <AnimatePresence>
          {isExpanded && subLinks && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="pl-8 py-1 space-y-0.5">
                {subLinks.map((sub) => {
                  const subHref = `${item.href}${sub.suffix}`;
                  const subActive = pathname === subHref;
                  return (
                    <Link
                      key={subHref}
                      href={subHref}
                      onClick={onClose}
                      className={`block px-3 py-2 rounded-sm text-sm transition-colors ${
                        subActive
                          ? 'text-[var(--bsi-primary)] font-medium'
                          : 'text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-dust)]'
                      }`}
                    >
                      {sub.label}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const renderSectionHeader = (label: string) => (
    <span className="text-[10px] uppercase tracking-widest text-[rgba(196,184,165,0.35)] font-medium px-4 flex items-center gap-2">
      {label}
      <span className="h-px flex-1 bg-border-subtle" />
    </span>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/60"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            transition={{ duration: 0.2 }}
            aria-hidden="true"
          />

          {/* Drawer — slide from right */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="fixed top-0 right-0 bottom-0 z-50 w-[85vw] max-w-sm bg-[var(--surface-scoreboard)]/95 backdrop-blur-xl border-l border-border overflow-y-auto"
            style={{
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              x: dragX,
            }}
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            onPan={handlePan}
            onPanEnd={handlePanEnd}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-vintage)]">
              <span className="text-xs uppercase tracking-widest text-[rgba(196,184,165,0.35)] font-medium">
                Menu
              </span>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className="p-2 hover:bg-surface rounded-sm transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-[var(--bsi-bone)]" />
              </button>
            </div>

            {/* Primary */}
            <motion.nav
              className="px-4 pt-4 pb-2 space-y-1"
              variants={linkStagger}
              initial="hidden"
              animate="visible"
            >
              {primary.map(renderLink)}
            </motion.nav>

            {/* Sports */}
            {leagues.length > 0 && (
              <>
                <div className="mx-4 my-2 border-t border-[var(--border-vintage)]" />
                <div className="px-4 pb-1">
                  {renderSectionHeader('Sports')}
                </div>
                <motion.nav
                  className="px-4 pb-2 space-y-1"
                  variants={linkStagger}
                  initial="hidden"
                  animate="visible"
                >
                  {leagues.map(renderLeagueLink)}
                </motion.nav>
              </>
            )}

            {/* Analytics & Tools */}
            {analytics.length > 0 && (
              <>
                <div className="mx-4 my-2 border-t border-[var(--border-vintage)]" />
                <div className="px-4 pb-1">
                  {renderSectionHeader('Analytics & Tools')}
                </div>
                <motion.nav
                  className="px-4 pb-2 space-y-1"
                  variants={linkStagger}
                  initial="hidden"
                  animate="visible"
                >
                  {analytics.map(renderLink)}
                </motion.nav>
              </>
            )}

            {/* More */}
            {secondary.length > 0 && (
              <>
                <div className="mx-4 my-2 border-t border-[var(--border-vintage)]" />
                <div className="px-4 pb-1">
                  {renderSectionHeader('More')}
                </div>
                <motion.nav
                  className="px-4 pb-4 space-y-1"
                  variants={linkStagger}
                  initial="hidden"
                  animate="visible"
                >
                  {secondary.map(renderLink)}
                </motion.nav>
              </>
            )}

            {/* Bottom safe area spacer for notch phones */}
            <div className="h-[env(safe-area-inset-bottom,0px)]" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
