'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import BlazeHotDogDash from './BlazeHotDogDash';

const KONAMI_CODE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'KeyB',
  'KeyA',
];

export default function KonamiCodeWrapper() {
  const [isGameActive, setIsGameActive] = useState(false);
  const [konamiIndex, setKonamiIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Konami code listener
  useEffect(() => {
    if (isGameActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === KONAMI_CODE[konamiIndex]) {
        const newIndex = konamiIndex + 1;
        setKonamiIndex(newIndex);

        if (newIndex === KONAMI_CODE.length) {
          setIsGameActive(true);
          setKonamiIndex(0);
        }
      } else {
        setKonamiIndex(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [konamiIndex, isGameActive]);

  // ESC key to close game
  useEffect(() => {
    if (!isGameActive) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsGameActive(false);
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isGameActive]);

  // Lock body scroll when game is active
  useEffect(() => {
    if (isGameActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isGameActive]);

  const handleClose = useCallback(() => {
    setIsGameActive(false);
  }, []);

  // Only render when mounted (client-side) and game is active
  if (!mounted || !isGameActive) return null;

  // Use portal to render at document body level
  return createPortal(<BlazeHotDogDash onClose={handleClose} />, document.body);
}
