'use client';

import { useState, useCallback, type RefObject } from 'react';

type UnmuteButtonProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
};

/**
 * UnmuteButton — toggles video audio on/off.
 * Bottom-right corner, minimal SVG speaker icon.
 */
export function UnmuteButton({ videoRef }: UnmuteButtonProps) {
  const [muted, setMuted] = useState(true);

  const toggle = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  }, [videoRef]);

  return (
    <button
      onClick={toggle}
      aria-label={muted ? 'Unmute video' : 'Mute video'}
      className="absolute bottom-6 right-6 z-20 p-3 rounded-full bg-charcoal-900/70 backdrop-blur-sm border border-border hover:border-burnt-orange-500/40 transition-all duration-300 group"
    >
      {muted ? (
        <svg
          className="w-5 h-5 text-text-secondary group-hover:text-text-primary transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-3.15a.75.75 0 011.28.53v13.74a.75.75 0 01-1.28.53L6.75 14.25H3.75a.75.75 0 01-.75-.75v-3a.75.75 0 01.75-.75h3z"
          />
        </svg>
      ) : (
        <svg
          className="w-5 h-5 text-burnt-orange-400 group-hover:text-burnt-orange-300 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-3.15a.75.75 0 011.28.53v12.74a.75.75 0 01-1.28.53l-4.72-3.15H3.75a.75.75 0 01-.75-.75v-3a.75.75 0 01.75-.75h3z"
          />
        </svg>
      )}
    </button>
  );
}
