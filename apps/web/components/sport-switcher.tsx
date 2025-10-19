'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './sport-switcher.module.css';

type SportSlug = 'baseball' | 'football' | 'basketball';

type SportConfig = {
  name: string;
  icon: string;
  path: string;
  accent: string;
  slug: SportSlug;
};

const SPORTS: SportConfig[] = [
  {
    name: 'Baseball',
    icon: '⚾',
    path: '/baseball/ncaab',
    accent: '#00a86b',
    slug: 'baseball',
  },
  {
    name: 'Football',
    icon: '🏈',
    path: '/football',
    accent: '#ff6b00',
    slug: 'football',
  },
  {
    name: 'Basketball',
    icon: '🏀',
    path: '/basketball',
    accent: '#ff8c00',
    slug: 'basketball',
  },
];

export type SportSwitcherProps = {
  currentSport?: SportSlug;
};

export function SportSwitcher({ currentSport = 'baseball' }: SportSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleSportClick = (sport: SportConfig) => {
    if (sport.slug === currentSport) {
      setIsOpen(false);
      return;
    }

    router.push(sport.path);
    setIsOpen(false);
  };

  return (
    <div className={styles.switcher}>
      {isOpen && (
        <div className={styles.menu}>
          {SPORTS.map((sport) => {
            const isCurrent = sport.slug === currentSport;

            return (
              <button
                key={sport.slug}
                type="button"
                className={`${styles.option} ${isCurrent ? styles.optionCurrent : ''}`}
                onClick={() => handleSportClick(sport)}
                style={{ borderColor: sport.accent }}
                disabled={isCurrent}
              >
                <span aria-hidden="true" className={styles.optionIcon}>
                  {sport.icon}
                </span>
                <span className={styles.optionLabel}>{sport.name}</span>
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        className={`${styles.fab} ${isOpen ? styles.fabOpen : ''}`}
        onClick={() => setIsOpen((value) => !value)}
        aria-label={isOpen ? 'Close sport switcher' : 'Open sport switcher'}
      >
        {isOpen ? '✕' : '⚡'}
      </button>
    </div>
  );
}

export default SportSwitcher;
