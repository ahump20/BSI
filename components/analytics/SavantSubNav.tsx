'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SAVANT_LINKS = [
  { href: '/college-baseball/savant', label: 'Explorer', exact: true },
  { href: '/college-baseball/savant/visuals', label: 'Visuals' },
  { href: '/college-baseball/savant/park-factors', label: 'Park Factors' },
  { href: '/college-baseball/savant/conference-index', label: 'Conferences' },
  { href: '/college-baseball/savant/team-compare', label: 'Compare Teams' },
  { href: '/college-baseball/savant/conference-comparison', label: 'Compare Conf.' },
  { href: '/college-baseball/savant/methodology', label: 'Methodology' },
  { href: '/college-baseball/savant/glossary', label: 'Glossary' },
];

export function SavantSubNav() {
  const pathname = usePathname();

  return (
    <nav
      className="overflow-x-auto scrollbar-none"
      style={{
        borderBottom: '1px solid var(--border-vintage, rgba(140,98,57,0.3))',
        background: 'var(--surface-scoreboard, #0A0A0A)',
      }}
      aria-label="Savant section navigation"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-0">
        {SAVANT_LINKS.map((link) => {
          const isActive = link.exact
            ? pathname === link.href || pathname === link.href + '/'
            : pathname?.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap px-3 py-2.5 text-[11px] uppercase tracking-wider transition-colors"
              style={{
                fontFamily: 'var(--bsi-font-display, Oswald, sans-serif)',
                color: isActive ? 'var(--bsi-primary, #BF5700)' : 'var(--bsi-dust, #C4B8A5)',
                borderBottom: isActive ? '2px solid var(--bsi-primary, #BF5700)' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
