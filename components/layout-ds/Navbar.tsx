'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { MobileMenuDrawer } from './MobileMenuDrawer';

interface NavItem {
  label: string;
  href: string;
}

interface NavbarProps {
  items: NavItem[];
}

export function Navbar({ items }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav
        className="sticky top-0 z-40 bg-midnight/90 backdrop-blur-md border-b border-white/5"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/images/brand/logo-full.webp"
                alt="Blaze Sports Intel"
                width={120}
                height={32}
                className="h-8 w-auto"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-[#BF5700]'
                      : 'text-white/60 hover:text-white'
                  }`}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              ))}
              <SearchBar />
            </div>

            {/* Mobile Hamburger */}
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
      </nav>

      {/* Mobile Drawer */}
      <MobileMenuDrawer
        items={items}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
    </>
  );
}
