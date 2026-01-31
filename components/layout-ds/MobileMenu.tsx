'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface MobileMenuItem {
  label: string;
  href: string;
  badge?: string;
  children?: MobileMenuItem[];
}

export interface MobileMenuProps {
  /** Whether menu is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Navigation items */
  items: MobileMenuItem[];
  /** Actions slot */
  actions?: React.ReactNode;
}

/**
 * MobileMenu component
 *
 * Full-screen mobile navigation with:
 * - Slide-in animation
 * - Accordion groups for items with children
 * - Focus trapping
 * - ESC to close
 * - Body scroll lock
 */
export function MobileMenu({ isOpen, onClose, items, actions }: MobileMenuProps) {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const firstFocusableRef = useRef<HTMLElement | null>(null);
  const lastFocusableRef = useRef<HTMLElement | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  // Close on route change
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.setProperty('--scroll-position', `-${scrollY}px`);
      document.body.classList.add('scroll-locked');

      return () => {
        document.body.classList.remove('scroll-locked');
        document.body.style.removeProperty('--scroll-position');
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const focusableElements = menuRef.current.querySelectorAll<HTMLElement>(
        'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length > 0) {
        firstFocusableRef.current = focusableElements[0];
        lastFocusableRef.current = focusableElements[focusableElements.length - 1];
        closeButtonRef.current?.focus();
      }
    }
  }, [isOpen]);

  // Focus trap
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    if (!firstFocusableRef.current || !lastFocusableRef.current) return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusableRef.current) {
        e.preventDefault();
        lastFocusableRef.current.focus();
      }
    } else {
      if (document.activeElement === lastFocusableRef.current) {
        e.preventDefault();
        firstFocusableRef.current.focus();
      }
    }
  }, []);

  // Check if link is active
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '#') return false;
    return pathname.startsWith(href);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-midnight/80 backdrop-blur-sm z-modal animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div
        ref={menuRef}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        onKeyDown={handleKeyDown}
        className={cn(
          'fixed top-0 right-0 h-full w-full max-w-sm bg-charcoal z-modal',
          'border-l border-border-subtle shadow-2xl',
          'animate-slide-in-right'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border-subtle">
          <span className="font-display text-lg font-bold text-text-primary">Menu</span>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 -mr-2 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
          <ul className="space-y-1">
            {items.map((item, index) => {
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedGroups.has(item.label);

              if (hasChildren) {
                return (
                  <li key={item.label}>
                    <button
                      onClick={() => toggleGroup(item.label)}
                      className={cn(
                        'flex items-center justify-between w-full px-4 py-3 rounded-lg',
                        'text-lg font-medium transition-colors',
                        'hover:bg-graphite text-text-primary'
                      )}
                      aria-expanded={isExpanded}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <span>{item.label}</span>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={cn(
                          'text-text-tertiary transition-transform duration-200',
                          isExpanded && 'rotate-180'
                        )}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                    {isExpanded && (
                      <ul className="ml-4 mt-1 space-y-0.5 border-l border-border-subtle pl-4">
                        {item.children!.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={cn(
                                'block px-4 py-2.5 rounded-lg text-base transition-colors',
                                'hover:bg-graphite',
                                isActive(child.href)
                                  ? 'text-burnt-orange bg-burnt-orange/10'
                                  : 'text-text-secondary'
                              )}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              }

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center justify-between px-4 py-3 rounded-lg',
                      'text-lg font-medium transition-colors',
                      'hover:bg-graphite',
                      isActive(item.href)
                        ? 'text-burnt-orange bg-burnt-orange/10'
                        : 'text-text-primary'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded bg-burnt-orange/20 text-burnt-orange">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Divider */}
        <div className="mx-6 h-px bg-border-subtle" />

        {/* Actions */}
        {actions && <div className="px-6 py-6">{actions}</div>}

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-border-subtle">
          <p className="text-xs text-text-muted text-center">
            &copy; {new Date().getFullYear()} Blaze Sports Intel
          </p>
        </div>
      </div>
    </>
  );
}

// Close icon
function CloseIcon() {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default MobileMenu;
