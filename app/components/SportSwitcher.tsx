'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type SportKey = 'baseball' | 'football' | 'basketball';

type SportRoute = {
  key: SportKey;
  name: string;
  icon: string;
  path: string;
};

interface SportSwitcherProps {
  /** Explicit override for the active sport; defaults to the path-derived value. */
  currentSport?: SportKey;
}

const SPORTS: SportRoute[] = [
  {
    key: 'baseball',
    name: 'Baseball',
    icon: '⚾',
    path: '/'
  },
  {
    key: 'football',
    name: 'Football',
    icon: '🏈',
    path: '/football'
  },
  {
    key: 'basketball',
    name: 'Basketball',
    icon: '🏀',
    path: '/basketball'
  }
];

export function SportSwitcher({ currentSport }: SportSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const activeSport = useMemo<SportKey>(() => {
    if (currentSport) {
      return currentSport;
    }

    if (pathname?.startsWith('/football')) {
      return 'football';
    }

    if (pathname?.startsWith('/basketball')) {
      return 'basketball';
    }

    return 'baseball';
  }, [currentSport, pathname]);

  const handleNavigate = (sport: SportRoute) => {
    setIsOpen(false);
    if (pathname !== sport.path) {
      router.push(sport.path);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 text-foreground">
      {isOpen && (
        <div className="mb-4 flex flex-col gap-3">
          {SPORTS.map((sport) => {
            const isActive = sport.key === activeSport;

            return (
              <button
                key={sport.key}
                type="button"
                onClick={() => handleNavigate(sport)}
                disabled={isActive}
                className={`flex min-w-[11rem] items-center gap-3 rounded-full border border-border/50 bg-background/80 px-4 py-2.5 text-sm font-semibold shadow-lg transition hover:-translate-x-1 hover:bg-background/95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-default disabled:opacity-60`}
              >
                <span className="text-xl" aria-hidden>
                  {sport.icon}
                </span>
                <span className="flex-1 text-left">{sport.name}</span>
                {!isActive && <span className="text-xs text-muted">Switch</span>}
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className={`fab-shadow flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-xl font-semibold text-background transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
          isOpen ? 'rotate-90' : 'hover:scale-105'
        }`}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close sport menu' : 'Switch sport'}
      >
        {isOpen ? '✕' : '⚡'}
      </button>
    </div>
  );
}
