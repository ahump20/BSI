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
        className={`flex items-center gap-1 px-3 py-1.5 rounded-sm text-sm font-medium transition-all ${
          hasActiveSport
            ? 'bg-[var(--bsi-primary)]/15 text-ember'
            : 'text-[var(--bsi-dust)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)]'
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
          className="absolute top-full left-0 mt-2 w-56 bg-[var(--surface-scoreboard)]/95 backdrop-blur-xl border border-[var(--border-vintage)] rounded-sm shadow-2xl py-1 z-50"
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
                {showDivider && <div className="border-t border-[var(--border-vintage)] my-1" />}
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  role="menuitem"
                  className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                    isFeatured
                      ? active
                        ? 'text-ember bg-[var(--bsi-primary)]/10'
                        : 'text-[var(--bsi-primary)] hover:text-[var(--bsi-primary)] hover:bg-[var(--bsi-primary)]/10'
                      : active
                        ? 'text-ember bg-[var(--surface-press-box)]'
                        : 'text-[var(--bsi-dust)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)]'
                  }`}
                >
                  <span className={isFeatured ? 'font-semibold' : ''}>{item.label}</span>
                  <span className="flex items-center gap-2">
                    {item.phaseLabel && (
                      <span className={`text-[10px] ${isFeatured ? 'text-[var(--bsi-primary)]/80' : 'text-[rgba(196,184,165,0.35)]'}`}>
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
        className={`flex items-center gap-1 px-3 py-1.5 rounded-sm text-sm font-medium transition-all ${
          hasActiveItem
            ? 'bg-[var(--bsi-primary)]/15 text-ember'
            : 'text-[var(--bsi-dust)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)]'
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
          className="absolute top-full left-0 mt-2 w-52 bg-[var(--surface-scoreboard)]/95 backdrop-blur-xl border border-[var(--border-vintage)] rounded-sm shadow-2xl py-1 z-50"
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
                    ? 'text-ember bg-[var(--surface-press-box)]'
                    : 'text-[var(--bsi-dust)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)]'
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
        className="flex items-center gap-1 px-3 py-1.5 rounded-sm text-sm font-medium text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)] transition-all"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="more-menu"
      >
        More
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div id="more-menu" className="absolute top-full right-0 mt-2 w-48 bg-[var(--surface-scoreboard)]/95 backdrop-blur-xl border border-[var(--border-vintage)] rounded-sm shadow-2xl py-1 z-50" role="menu">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              role="menuitem"
              className="block px-4 py-2.5 text-sm text-[var(--bsi-dust)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)] transition-colors"
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
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const tickerText = useNewsTicker();
  const isHome = pathname === '/';

  useEffect(() => {
    if (!isHome) {
      setScrolled(true);
      return;
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 36);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome]);

  const navIsOverlay = isHome && !scrolled && !menuOpen;

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
        className={`transition-all duration-500 ${
          isHome ? 'fixed inset-x-0 top-0 z-50' : 'sticky top-0 z-40'
        } ${
          navIsOverlay
            ? 'border-transparent bg-gradient-to-b from-black/80 via-black/35 to-transparent'
            : 'border-b border-[var(--border-vintage)] bg-[var(--surface-scoreboard)]/92 backdrop-blur-xl shadow-[0_18px_50px_rgba(0,0,0,0.28)]'
        }`}
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
                  className={`px-3 py-1.5 rounded-sm text-sm font-medium transition-all ${
                    isActive(item.href)
                      ? 'bg-[var(--bsi-primary)]/15 text-ember'
                      : 'text-[var(--bsi-dust)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)]'
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
                className={`hidden lg:block max-w-[200px] truncate text-xs ${isHome ? 'xl:hidden' : ''} text-[rgba(196,184,165,0.35)]`}
                aria-live="polite"
              >
                {tickerText}
              </span>

              {/* Cmd+K search trigger */}
              <button
                onClick={openCommandPalette}
                className={`hidden md:flex items-center gap-2 rounded-sm border px-3 py-1.5 text-sm transition-all ${
                  navIsOverlay
                    ? 'border-white/10 bg-black/20 text-[rgba(245,240,235,0.78)] hover:bg-black/35 hover:text-[var(--bsi-bone)]'
                    : 'border-[var(--border-vintage)] bg-[var(--surface-press-box)] text-[rgba(196,184,165,0.35)] hover:bg-[var(--surface-press-box)] hover:text-[var(--bsi-dust)]'
                }`}
                aria-label="Open search"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Search...</span>
                <kbd
                  className={`hidden rounded-sm px-1.5 py-0.5 font-mono text-[10px] lg:inline ${
                    navIsOverlay ? 'bg-black/35 text-[rgba(245,240,235,0.65)]' : 'bg-[var(--surface-press-box)] text-[rgba(196,184,165,0.35)]'
                  }`}
                >
                  ⌘K
                </kbd>
              </button>

              {/* Mobile: search icon */}
              <button
                onClick={openCommandPalette}
                className="md:hidden h-11 w-11 flex items-center justify-center rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-press-box)]/70 text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)] transition-colors"
                aria-label="Open search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden h-11 w-11 flex items-center justify-center rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-press-box)]/70 text-[var(--bsi-dust)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)] transition-colors"
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
