'use client';

import { useEffect, useState } from 'react';
import styles from './CinematicTransition.module.css';

interface CinematicTransitionProps {
  show: boolean;
  type?: 'wipe' | 'iris' | 'curtain' | 'shatter' | 'ripple';
  duration?: number;
  onComplete?: () => void;
}

/**
 * Cinematic Page Transition System
 * Hollywood-style transitions between pages/views
 * Features: Multiple transition types, smooth animations
 */
export default function CinematicTransition({
  show,
  type = 'wipe',
  duration = 1000,
  onComplete,
}: CinematicTransitionProps) {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'entering' | 'exiting' | 'idle'>('idle');

  useEffect(() => {
    if (show && !isActive) {
      setIsActive(true);
      setPhase('entering');

      const midpoint = setTimeout(() => {
        setPhase('exiting');
      }, duration / 2);

      const complete = setTimeout(() => {
        setIsActive(false);
        setPhase('idle');
        onComplete?.();
      }, duration);

      return () => {
        clearTimeout(midpoint);
        clearTimeout(complete);
      };
    }
  }, [show, duration, isActive, onComplete]);

  if (!isActive) return null;

  return (
    <div className={`${styles.container} ${styles[type]} ${styles[phase]}`}>
      {type === 'wipe' && <WipeTransition phase={phase} />}
      {type === 'iris' && <IrisTransition phase={phase} />}
      {type === 'curtain' && <CurtainTransition phase={phase} />}
      {type === 'shatter' && <ShatterTransition phase={phase} />}
      {type === 'ripple' && <RippleTransition phase={phase} />}
    </div>
  );
}

function WipeTransition({ phase }: { phase: string }) {
  return (
    <>
      <div className={`${styles.wipePanel} ${styles.wipeLeft}`} />
      <div className={`${styles.wipePanel} ${styles.wipeRight}`} />
    </>
  );
}

function IrisTransition({ phase }: { phase: string }) {
  return <div className={styles.irisCircle} />;
}

function CurtainTransition({ phase }: { phase: string }) {
  return (
    <>
      <div className={`${styles.curtainPanel} ${styles.curtainTop}`} />
      <div className={`${styles.curtainPanel} ${styles.curtainBottom}`} />
    </>
  );
}

function ShatterTransition({ phase }: { phase: string }) {
  const shards = Array.from({ length: 20 }, (_, i) => i);

  return (
    <div className={styles.shatterContainer}>
      {shards.map(i => (
        <div
          key={i}
          className={styles.shard}
          style={{
            '--delay': `${i * 0.05}s`,
            '--rotation': `${Math.random() * 360}deg`,
            '--tx': `${(Math.random() - 0.5) * 200}vw`,
            '--ty': `${(Math.random() - 0.5) * 200}vh`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

function RippleTransition({ phase }: { phase: string }) {
  const ripples = Array.from({ length: 5 }, (_, i) => i);

  return (
    <div className={styles.rippleContainer}>
      {ripples.map(i => (
        <div
          key={i}
          className={styles.ripple}
          style={{
            '--delay': `${i * 0.1}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
