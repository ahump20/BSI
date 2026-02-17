'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { X } from 'lucide-react';
import type { LeagueNavItem } from '@/lib/navigation';

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
}

export function MobileMenuDrawer({
  open,
  onClose,
  primary,
  leagues,
  secondary,
}: MobileMenuDrawerProps) {
  const pathname = usePathname();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  const renderLink = (item: MenuItem) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        aria-current={active ? 'page' : undefined}
        className={`block w-full px-4 py-3 rounded-lg transition-all min-h-12 flex items-center ${
          active
            ? 'text-[#BF5700] font-semibold bg-white/10'
            : 'text-white/60 hover:text-white'
        }`}
      >
        {item.label}
      </Link>
    );
  };

  const renderLeagueLink = (item: LeagueNavItem) => {
    const active = isActive(item.href);
    const isLive = item.phase !== 'offseason';
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        aria-current={active ? 'page' : undefined}
        className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all min-h-12 ${
          active
            ? 'text-[#BF5700] font-semibold bg-white/10'
            : 'text-white/60 hover:text-white'
        }`}
      >
        <span>{item.label}</span>
        <span className="flex items-center gap-2">
          {item.phaseLabel && (
            <span className="text-[10px] text-white/30">{item.phaseLabel}</span>
          )}
          {isLive && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
          )}
        </span>
      </Link>
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            transition={{ duration: 0.2 }}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="fixed top-0 left-0 right-0 z-50 bg-midnight/95 backdrop-blur-xl border-b border-white/10 max-h-[80vh] overflow-y-auto"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Close Button */}
            <div className="flex justify-end p-4">
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Primary */}
            <nav className="px-4 pb-2 space-y-1">
              {primary.map(renderLink)}
            </nav>

            {/* Leagues */}
            {leagues.length > 0 && (
              <>
                <div className="mx-4 my-2 border-t border-white/[0.06]" />
                <div className="px-4 pb-1">
                  <span className="text-[10px] uppercase tracking-widest text-white/25 font-medium px-4">
                    Leagues
                  </span>
                </div>
                <nav className="px-4 pb-2 space-y-1">
                  {leagues.map(renderLeagueLink)}
                </nav>
              </>
            )}

            {/* Secondary */}
            {secondary.length > 0 && (
              <>
                <div className="mx-4 my-2 border-t border-white/[0.06]" />
                <div className="px-4 pb-1">
                  <span className="text-[10px] uppercase tracking-widest text-white/25 font-medium px-4">
                    More
                  </span>
                </div>
                <nav className="px-4 pb-4 space-y-1">
                  {secondary.map(renderLink)}
                </nav>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
