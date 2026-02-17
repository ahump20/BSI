'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, Search } from 'lucide-react';
import { MobileMenuDrawer } from './MobileMenuDrawer';
import type { LeagueNavItem } from '@/lib/navigation';

export interface NavItem {
  label: string;
  href: string;
}

export interface NavbarProps {
  primary: NavItem[];
  leagues: LeagueNavItem[];
  secondary: NavItem[];
}

// ---------------------------------------------------------------------------
// Inline news ticker (replaces standalone NewsTicker component)
// ---------------------------------------------------------------------------

const FALLBACK_TICKER = [
  'College Baseball scores updated live every 30 seconds',
  'Real-time analytics powered by official data sources',
];

interface IntelArticle { headline?: string; description?: string }
interface IntelBucket { sport: string; data: { articles: IntelArticle[] } }

function useNewsTicker(): string {
  const [items, setItems] = useState<string[]>(FALLBACK_TICKER);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/intel/news`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: IntelBucket[] | null) => {
        if (!Array.isArray(data)) return;
        const headlines = data
          .flatMap((bucket) =>
            (bucket.data?.articles ?? []).slice(0, 2).map((a) => a.headline).filter(Boolean)
          )
          .slice(0, 8) as string[];
        if (headlines.length > 0) setItems(headlines);
      })
      .catch(() => {
        /* keep fallbacks */
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [items.length]);

  return items[index] ?? '';
}

// ---------------------------------------------------------------------------
// Leagues dropdown — sport links with season indicators
// ---------------------------------------------------------------------------

function LeaguesDropdown({ items }: { items: LeagueNavItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
  }, []);

  // Check if any league is active
  const hasActiveSport = items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  );

  return (
    <div ref={ref} className="relative" onKeyDown={handleKeyDown}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
          hasActiveSport
            ? 'bg-[#BF5700]/15 text-[#FF6B35]'
            : 'text-white/60 hover:text-white hover:bg-white/5'
        }`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        Leagues
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-2 w-56 bg-midnight/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl py-1 z-50"
          role="menu"
        >
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            const isActive = item.phase !== 'offseason';

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                role="menuitem"
                className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                  active
                    ? 'text-[#FF6B35] bg-white/5'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{item.label}</span>
                <span className="flex items-center gap-2">
                  {item.phaseLabel && (
                    <span className="text-[10px] text-white/30">
                      {item.phaseLabel}
                    </span>
                  )}
                  {isActive && (
                    <span className="relative flex h-2 w-2" title="In season">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// More dropdown — secondary pages
// ---------------------------------------------------------------------------

function MoreDropdown({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (items.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all"
        aria-expanded={open}
        aria-haspopup="true"
      >
        More
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-midnight/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl py-1 z-50" role="menu">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              role="menuitem"
              className="block px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------

export function Navbar({ primary, leagues, secondary }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const tickerText = useNewsTicker();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // Emit custom event so CommandPalette can listen
  const openCommandPalette = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  };

  return (
    <>
      <nav
        className="sticky top-0 z-40 bg-midnight/95 backdrop-blur-xl border-b border-white/[0.06]"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left: Logo */}
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <Image
                src="/images/brand/logo-full.webp"
                alt="Blaze Sports Intel"
                width={120}
                height={32}
                className="h-8 w-auto"
                priority
              />
            </Link>

            {/* Center: Primary + Leagues + More (desktop) */}
            <div className="hidden md:flex items-center gap-1">
              {primary.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive(item.href)
                      ? 'bg-[#BF5700]/15 text-[#FF6B35]'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              ))}
              <LeaguesDropdown items={leagues} />
              <MoreDropdown items={secondary} />
            </div>

            {/* Right: Ticker + Cmd+K trigger + mobile hamburger */}
            <div className="flex items-center gap-3">
              {/* News ticker — desktop only, subtle */}
              <span
                className="hidden lg:block text-xs text-white/30 max-w-[200px] truncate"
                aria-live="polite"
              >
                {tickerText}
              </span>

              {/* Cmd+K search trigger */}
              <button
                onClick={openCommandPalette}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-all text-sm"
                aria-label="Open search"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Search...</span>
                <kbd className="hidden lg:inline text-[10px] text-white/20 bg-white/[0.06] px-1.5 py-0.5 rounded font-mono">
                  ⌘K
                </kbd>
              </button>

              {/* Mobile: search icon */}
              <button
                onClick={openCommandPalette}
                className="md:hidden p-2 text-white/50 hover:text-white transition-colors"
                aria-label="Open search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <MobileMenuDrawer
        primary={primary}
        leagues={leagues}
        secondary={secondary}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
    </>
  );
}
