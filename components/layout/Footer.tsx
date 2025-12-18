'use client';

/**
 * BSI Footer - Redesigned
 *
 * Premium editorial footer with:
 * - Three-column layout (Brand, Coverage, Connect)
 * - "Tennessee Born · Texas Soil" tagline
 * - Minimal, focused design
 */

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

const COVERAGE_LINKS = [
  { name: 'MLB', href: '/mlb' },
  { name: 'NFL', href: '/nfl' },
  { name: 'NBA', href: '/nba' },
  { name: 'College Baseball', href: '/college-baseball' },
  { name: 'CFB', href: '/cfb' },
];

const CONNECT_LINKS = [
  { name: 'About', href: '/about' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Contact', href: 'mailto:austin@blazesportsintel.com' },
  { name: 'Privacy', href: '/privacy' },
  { name: 'Terms', href: '/terms' },
];

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn('bg-true-black border-t border-white/10', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {/* Brand Column */}
          <div>
            <Link href="/" className="inline-block">
              <span className="text-2xl font-display font-bold text-burnt-orange-500">
                Blaze Sports Intel
              </span>
            </Link>
            <p className="mt-4 text-white/50 text-sm leading-relaxed max-w-xs">
              Tennessee Born · Texas Soil. Every game matters to someone.
            </p>
            <p className="mt-4 text-white/30 text-xs">
              © {new Date().getFullYear()} Blaze Sports Intel. All rights reserved.
            </p>
          </div>

          {/* Coverage Column */}
          <div>
            <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">
              Coverage
            </h4>
            <ul className="space-y-3">
              {COVERAGE_LINKS.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-white/50 hover:text-burnt-orange-400 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect Column */}
          <div>
            <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">
              Connect
            </h4>
            <ul className="space-y-3">
              {CONNECT_LINKS.map((link) => (
                <li key={link.name}>
                  {link.href.startsWith('mailto:') ? (
                    <a
                      href={link.href}
                      className="text-white/50 hover:text-burnt-orange-400 transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-white/50 hover:text-burnt-orange-400 transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-white/30 text-xs font-serif-quote italic">
            Born to Blaze the Path Less Beaten
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
