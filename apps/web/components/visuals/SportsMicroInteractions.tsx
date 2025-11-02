'use client';

import { useState } from 'react';
import styles from './SportsMicroInteractions.module.css';

/**
 * Sports-Specific Micro-Interactions
 * Unique, delightful interactions for sports data
 */

// Baseball Swing Animation
export function BaseballSwing({ onClick }: { onClick?: () => void }) {
  const [isSwinging, setIsSwinging] = useState(false);

  const handleClick = () => {
    setIsSwinging(true);
    setTimeout(() => setIsSwinging(false), 600);
    onClick?.();
  };

  return (
    <button
      className={`${styles.baseballSwing} ${isSwinging ? styles.swinging : ''}`}
      onClick={handleClick}
      aria-label="Baseball swing animation"
    >
      <span className={styles.bat}>🏏</span>
      <span className={styles.ball}>⚾</span>
    </button>
  );
}

// Basketball Bounce
export function BasketballBounce({ score }: { score: number }) {
  return (
    <div className={styles.basketballBounce}>
      <span className={styles.basketball}>🏀</span>
      <span className={styles.score}>{score}</span>
    </div>
  );
}

// Football Spiral
export function FootballSpiral({ isActive }: { isActive: boolean }) {
  return (
    <div className={`${styles.footballSpiral} ${isActive ? styles.active : ''}`}>
      <span className={styles.football}>🏈</span>
    </div>
  );
}

// Score Counter with Animation
export function ScoreCounter({
  score,
  teamColor = '#BF5700',
}: {
  score: number;
  teamColor?: string;
}) {
  return (
    <div
      className={styles.scoreCounter}
      style={{ '--team-color': teamColor } as React.CSSProperties}
    >
      <span className={styles.scoreDigit}>{score}</span>
      <div className={styles.scoreRipple} />
    </div>
  );
}

// Win Celebration Confetti
export function WinCelebration({ show }: { show: boolean }) {
  if (!show) return null;

  const confetti = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.5}s`,
    duration: `${2 + Math.random() * 2}s`,
    color: ['#BF5700', '#FF7D3C', '#FFD700', '#B0E0E6'][
      Math.floor(Math.random() * 4)
    ],
  }));

  return (
    <div className={styles.winCelebration}>
      {confetti.map(c => (
        <div
          key={c.id}
          className={styles.confetti}
          style={
            {
              left: c.left,
              '--delay': c.delay,
              '--duration': c.duration,
              '--color': c.color,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

// Live Pulse Indicator
export function LivePulse({ isLive }: { isLive: boolean }) {
  if (!isLive) return null;

  return (
    <div className={styles.livePulse}>
      <span className={styles.liveText}>LIVE</span>
      <span className={styles.liveDot} />
    </div>
  );
}

// Stat Change Flash
export function StatChangeFlash({
  value,
  change,
}: {
  value: number | string;
  change?: 'up' | 'down';
}) {
  return (
    <div
      className={`${styles.statChange} ${change ? styles[`change-${change}`] : ''}`}
    >
      <span className={styles.statValue}>{value}</span>
      {change && (
        <span className={styles.changeIndicator}>
          {change === 'up' ? '↑' : '↓'}
        </span>
      )}
    </div>
  );
}

// Loading Sports Equipment
export function SportsLoadingSpinner({ sport }: { sport: 'baseball' | 'football' | 'basketball' }) {
  const icons = {
    baseball: '⚾',
    football: '🏈',
    basketball: '🏀',
  };

  return (
    <div className={styles.sportsSpinner}>
      <span className={styles.spinnerIcon}>{icons[sport]}</span>
    </div>
  );
}

// Hover Card with Team Colors
export function TeamHoverCard({
  children,
  teamColor,
}: {
  children: React.ReactNode;
  teamColor: string;
}) {
  return (
    <div
      className={styles.teamHoverCard}
      style={{ '--team-color': teamColor } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

// Momentum Arrow
export function MomentumArrow({ direction }: { direction: 'up' | 'down' | 'neutral' }) {
  return (
    <div className={`${styles.momentumArrow} ${styles[direction]}`}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        {direction === 'up' && (
          <path
            d="M12 4L19 11H13V20H11V11H5L12 4Z"
            fill="currentColor"
            className={styles.arrowPath}
          />
        )}
        {direction === 'down' && (
          <path
            d="M12 20L5 13H11V4H13V13H19L12 20Z"
            fill="currentColor"
            className={styles.arrowPath}
          />
        )}
        {direction === 'neutral' && (
          <path
            d="M4 12L11 5V11H20V13H11V19L4 12Z"
            fill="currentColor"
            className={styles.arrowPath}
          />
        )}
      </svg>
    </div>
  );
}

// Interactive Scoreboard Flip
export function ScoreboardFlip({ score }: { score: number }) {
  return (
    <div className={styles.scoreboardFlip}>
      <div className={styles.flipCard}>
        <div className={styles.flipCardInner}>
          <div className={styles.flipCardFront}>{score}</div>
          <div className={styles.flipCardBack}>{score}</div>
        </div>
      </div>
    </div>
  );
}
