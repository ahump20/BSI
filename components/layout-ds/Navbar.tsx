'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Container } from '../ui/Container';
import { MobileMenu } from './MobileMenu';
import { SearchBar } from './SearchBar';

export interface NavItem {
  label: string;
  href: string;
  badge?: string;
  children?: NavItem[];
}

export interface NavbarProps {
  /** Navigation items */
  items: NavItem[];
  /** Logo component or element */
  logo?: React.ReactNode;
  /** Right side actions */
  actions?: React.ReactNode;
  /** Fixed/sticky behavior */
  variant?: 'fixed' | 'sticky' | 'static';
  /** Additional class names */
  className?: string;
}

/**
 * Navbar component
 *
 * Main site navigation with:
 * - Sticky positioning with blur on scroll
 * - Active route highlighting
 * - Mobile menu toggle
 * - Smooth show/hide on scroll
 */
export function Navbar({ items, logo, actions, variant = 'sticky', className }: NavbarProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Handle scroll for blur effect and hide/show
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;

    // Blur effect kicks in after 50px scroll
    setIsScrolled(currentScrollY > 50);

    // Hide on scroll down, show on scroll up (only after 100px)
    if (currentScrollY > 100) {
      setIsVisible(currentScrollY < lastScrollY || currentScrollY < 100);
    } else {
      setIsVisible(true);
    }

    setLastScrollY(currentScrollY);
  }, [lastScrollY]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Check if link is active
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <header
        className={cn(
          'w-full z-sticky transition-all duration-300',
          variant === 'fixed' && 'fixed top-0 left-0',
          variant === 'sticky' && 'sticky top-0',
          variant === 'static' && 'relative',
          isScrolled
            ? 'bg-midnight/80 backdrop-blur-xl border-b border-border-subtle shadow-lg'
            : 'bg-transparent',
          !isVisible && variant !== 'static' && '-translate-y-full',
          className
        )}
      >
        <Container>
          <nav
            className="flex items-center justify-between h-16 md:h-20"
            role="navigation"
            aria-label="Main navigation"
          >
            {/* Logo */}
            <div className="flex-shrink-0">
              {logo || (
                <Link
                  href="/"
                  className="font-display text-xl font-bold text-text-primary hover:text-burnt-orange transition-colors"
                >
                  BLAZE<span className="text-burnt-orange">SPORTS</span>INTEL
                </Link>
              )}
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {items.map((item) => (
                <NavLink key={item.href} item={item} isActive={isActive(item.href)} />
              ))}
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:block">
              <SearchBar variant="navbar" placeholder="Search teams, players..." />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {/* Desktop actions */}
              <div className="hidden lg:flex items-center gap-3">{actions}</div>

              {/* Mobile menu button */}
              <button
                className="lg:hidden p-2 -mr-2 text-text-primary hover:text-burnt-orange transition-colors"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open menu"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
              >
                <MenuIcon />
              </button>
            </div>
          </nav>
        </Container>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        items={items}
        actions={actions}
      />
    </>
  );
}

// Nav link component
function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        'relative px-4 py-2 text-sm font-medium transition-colors',
        'hover:text-burnt-orange',
        isActive ? 'text-burnt-orange' : 'text-text-secondary'
      )}
    >
      {item.label}
      {item.badge && (
        <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-burnt-orange/20 text-burnt-orange">
          {item.badge}
        </span>
      )}
      {/* Active indicator */}
      {isActive && (
        <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-burnt-orange rounded-full" />
      )}
    </Link>
  );
}

// Menu icon
function MenuIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export default Navbar;
