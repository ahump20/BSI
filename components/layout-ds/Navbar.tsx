'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, Search } from 'lucide-react';
import { MobileMenuDrawer } from './MobileMenuDrawer';
import type { LeagueNavItem, MainNavItem } from '@/lib/navigation';
import { getReadApiUrl } from '@/lib/utils/public-api';

export interface NavItem {
  label: string;
  href: string;
}

export interface NavbarProps {
  primary: NavItem[];
  leagues: LeagueNavItem[];
  secondary: NavItem[];
  analytics?: MainNavItem[];
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
    fetch(getReadApiUrl('/api/intel/news'), {
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

  const itemsLengthRef = useRef(items.length);
  useEffect(() => { itemsLengthRef.current = items.length; }, [items.length]);

  const hasMultiple = items.length > 1;
  useEffect(() => {
    if (!hasMultiple) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % itemsLengthRef.current);
    }, 6000);
    return () => clearInterval(timer);
  }, [hasMultiple]);

  return items[index] ?? '';
}

// ---------------------------------------------------------------------------
// Reusable dropdown hook — handles outside click + escape
// ---------------------------------------------------------------------------

function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
  }, []);

  return { open, setOpen, ref, handleKeyDown };
}

// ---------------------------------------------------------------------------
// Leagues dropdown — sport links with season indicators
// ---------------------------------------------------------------------------

function LeaguesDropdown({ items }: { items: LeagueNavItem[] }) {
  const { open, setOpen, ref, handleKeyDown } = useDropdown();
  const pathname = usePathname();

  const hasActiveSport = items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  );

  return (
    <div ref={ref} className="relative" onKeyDown={handleKeyDown}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
          hasActiveSport
            ? 'bg-burnt-orange/15 text-ember'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-light'
        }`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="leagues-menu"
      >
        Sports
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          id="leagues-menu"
          className="absolute top-full left-0 mt-2 w-56 bg-midnight/95 backdrop-blur-xl border border-border rounded-sm shadow-2xl py-1 z-50"
          role="menu"
        >
          {items.map((item, idx) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            const isActive = item.phase !== 'offseason';
            const isFeatured = item.featured;

            const prevItem = items[idx - 1];
            const showDivider = idx > 0 && prevItem?.featured && !isFeatured;

            return (
              <div key={item.href}>
                {showDivider && <div className="border-t border-border-subtle my-1" />}
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  role="menuitem"
                  className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                    isFeatured
                      ? active
                        ? 'text-ember bg-burnt-orange/10'
                        : 'text-burnt-orange hover:text-ember hover:bg-burnt-orange/10'
                      : active
                        ? 'text-ember bg-surface-light'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-light'
                  }`}
                >
                  <span className={isFeatured ? 'font-semibold' : ''}>{item.label}</span>
                  <span className="flex items-center gap-2">
                    {item.phaseLabel && (
                      <span className={`text-[10px] ${isFeatured ? 'text-burnt-orange/80' : 'text-text-muted'}`}>
                        {item.phaseLabel}
                      </span>
                    )}
                    {isActive && (
                      <span className="relative flex h-2 w-2" title="In season">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--bsi-primary)] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--bsi-primary)]" />
                      </span>
                    )}
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Analytics dropdown — power tools
// ---------------------------------------------------------------------------

function AnalyticsDropdown({ items }: { items: MainNavItem[] }) {
  const { open, setOpen, ref, handleKeyDown } = useDropdown();
  const pathname = usePathname();

  const hasActiveItem = items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  );

  if (items.length === 0) return null;

  return (
    <div ref={ref} className="relative" onKeyDown={handleKeyDown}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
          hasActiveItem
            ? 'bg-burnt-orange/15 text-ember'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-light'
        }`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="analytics-menu"
      >
        Analytics
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          id="analytics-menu"
          className="absolute top-full left-0 mt-2 w-52 bg-midnight/95 backdrop-blur-xl border border-border rounded-sm shadow-2xl py-1 z-50"
          role="menu"
        >
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                role="menuitem"
                className={`block px-4 py-2.5 text-sm transition-colors ${
                  active
                    ? 'text-ember bg-surface-light'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-light'
                }`}
              >
                {item.label}
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
  const { open, setOpen, ref } = useDropdown();

  if (items.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-text-muted hover:text-text-primary hover:bg-surface-light transition-all"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="more-menu"
      >
        More
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div id="more-menu" className="absolute top-full right-0 mt-2 w-48 bg-midnight/95 backdrop-blur-xl border border-border rounded-sm shadow-2xl py-1 z-50" role="menu">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              role="menuitem"
              className="block px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors"
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

export function Navbar({ primary, leagues, secondary, analytics = [] }: NavbarProps) {
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
        className="sticky top-0 z-40 bg-midnight/95 backdrop-blur-xl border-b border-border-subtle"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left: Logo */}
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <Image
                src="/images/brand/bsi-lettermark-square.png"
                alt="Blaze Sports Intel"
                width={32}
                height={32}
                className="h-8 w-auto"
                priority
              />
            </Link>

            {/* Center: Primary + Sports + Analytics + More (desktop) */}
            <div className="hidden md:flex items-center gap-1">
              {primary.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive(item.href)
                      ? 'bg-burnt-orange/15 text-ember'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-light'
                  }`}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              ))}
              <LeaguesDropdown items={leagues} />
              <AnalyticsDropdown items={analytics} />
              <MoreDropdown items={secondary} />
            </div>

            {/* Right: Ticker + Cmd+K trigger + mobile hamburger */}
            <div className="flex items-center gap-3">
              {/* News ticker — desktop only, subtle */}
              <span
                className="hidden lg:block text-xs text-text-muted max-w-[200px] truncate"
                aria-live="polite"
              >
                {tickerText}
              </span>

              {/* Cmd+K search trigger */}
              <button
                onClick={openCommandPalette}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-sm bg-surface-light border border-border-subtle text-text-muted hover:text-text-secondary hover:bg-surface-medium transition-all text-sm"
                aria-label="Open search"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Search...</span>
                <kbd className="hidden lg:inline text-[10px] text-text-muted bg-surface-light px-1.5 py-0.5 rounded-sm font-mono">
                  ⌘K
                </kbd>
              </button>

              {/* Mobile: search icon */}
              <button
                onClick={openCommandPalette}
                className="md:hidden p-2 text-text-muted hover:text-text-primary transition-colors"
                aria-label="Open search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
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
        analytics={analytics}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
    </>
  );
}
