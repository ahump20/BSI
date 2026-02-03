'use client';

import Link from 'next/link';
import Image from 'next/image';
import { SearchBar } from './SearchBar';

interface NavItem {
  label: string;
  href: string;
}

interface NavbarProps {
  items: NavItem[];
}

export function Navbar({ items }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-40 bg-midnight/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/images/brand/logo-full.webp" alt="BSI" width={120} height={32} className="h-8 w-auto" />
            <div className="hidden sm:block">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Blaze Sports Intel</p>
              <p className="text-sm font-display text-white">Command Layer</p>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-white/60 hover:text-white transition-colors font-medium"
              >
                {item.label}
              </Link>
            ))}
            <SearchBar />
            <Link href="/dashboard" className="btn-primary px-4 py-2 rounded-full text-xs">
              Command Center
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
