'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* ── SVG Icons — 16x16 stroke-based, inherits currentColor ── */

const IconHome = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M1.5 7L8 1.5 14.5 7V14H10V10H6v4H1.5V7z" />
  </svg>
);

const IconActivity = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M1 8h3l2-5 2 10 2-5h3" />
    <circle cx="14" cy="8" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const IconBaseball = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="8" cy="8" r="6.5" />
    <path d="M4.5 2.5c1 1.5 1 3.5 0 5s-1 3.5 0 5" />
    <path d="M11.5 2.5c-1 1.5-1 3.5 0 5s1 3.5 0 5" />
  </svg>
);

const IconTarget = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="8" cy="8" r="6.5" />
    <circle cx="8" cy="8" r="3.5" />
    <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const IconMore = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="3" cy="8" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="13" cy="8" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

/* ── Component ── */

export function MobileBottomNav({ onMorePress }: { onMorePress?: () => void }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const NAV_ITEMS = [
    { href: '/',                        label: 'Home',   icon: IconHome     },
    { href: '/scores',                  label: 'Scores', icon: IconActivity },
    { href: '/college-baseball',        label: 'CBB',    icon: IconBaseball },
    { href: '/college-baseball/savant', label: 'Savant', icon: IconTarget   },
  ] as const;

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0D0D0D] border-t border-white/[0.06] shadow-[0_-4px_24px_rgba(0,0,0,0.4)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-1 flex-1 py-2.5 px-1 transition-colors ${
                active
                  ? 'text-[#BF5700]'
                  : 'text-[rgba(245,240,235,0.35)] hover:text-[rgba(245,240,235,0.65)]'
              }`}
            >
              {/* Active indicator bar */}
              <span
                className={`absolute top-0 h-[2px] w-8 rounded-b-full transition-opacity ${
                  active ? 'bg-[#BF5700] opacity-100' : 'opacity-0'
                }`}
                aria-hidden="true"
              />
              <span aria-hidden="true" className="relative">
                <Icon />
                {active && (
                  <span
                    className="absolute inset-0 rounded-full blur-sm bg-[#BF5700]/20"
                    aria-hidden="true"
                  />
                )}
              </span>
              <span
                className="relative"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  lineHeight: 1,
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}

        {/* More button — toggles the slide-up panel */}
        <button
          onClick={onMorePress}
          className="flex flex-col items-center justify-center gap-1 flex-1 py-2.5 px-1 transition-colors text-[rgba(245,240,235,0.35)] hover:text-[rgba(245,240,235,0.65)]"
          aria-label="More navigation options"
        >
          <span aria-hidden="true" className="relative">
            <IconMore />
          </span>
          <span
            className="relative"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              lineHeight: 1,
            }}
          >
            More
          </span>
        </button>
      </div>
    </nav>
  );
}
