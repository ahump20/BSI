'use client';

import { useEffect, useState } from 'react';

interface SwipeIndicatorProps {
  tabs: string[];
  activeIndex: number;
  /** Show animated hint on first load */
  showHint?: boolean;
}

/**
 * SwipeIndicator Component
 *
 * Displays dots indicating current tab position and swipe capability.
 * Shows animated hint arrows on mobile to teach swipe gesture.
 */
export function SwipeIndicator({ tabs, activeIndex, showHint = true }: SwipeIndicatorProps) {
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile and show hint
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Show hint briefly on first mobile view
    if (showHint && isMobile) {
      const hasSeenHint = sessionStorage.getItem('bsi-swipe-hint-seen');
      if (!hasSeenHint) {
        setShowSwipeHint(true);
        const timer = setTimeout(() => {
          setShowSwipeHint(false);
          sessionStorage.setItem('bsi-swipe-hint-seen', 'true');
        }, 3000);
        return () => clearTimeout(timer);
      }
    }

    return () => window.removeEventListener('resize', checkMobile);
  }, [showHint, isMobile]);

  const canGoLeft = activeIndex > 0;
  const canGoRight = activeIndex < tabs.length - 1;

  return (
    <div className="flex items-center justify-center gap-3 py-2 md:hidden">
      {/* Left swipe hint */}
      <div
        className={`transition-opacity duration-300 ${
          showSwipeHint && canGoLeft ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <svg
          className="w-4 h-4 text-burnt-orange animate-pulse"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center gap-1.5">
        {tabs.map((_, index) => (
          <button
            key={index}
            className={`transition-all duration-200 rounded-full ${
              index === activeIndex
                ? 'w-6 h-2 bg-burnt-orange'
                : 'w-2 h-2 bg-white/20 hover:bg-white/40'
            }`}
            aria-label={`Go to tab ${index + 1}`}
            aria-current={index === activeIndex ? 'true' : undefined}
          />
        ))}
      </div>

      {/* Right swipe hint */}
      <div
        className={`transition-opacity duration-300 ${
          showSwipeHint && canGoRight ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <svg
          className="w-4 h-4 text-burnt-orange animate-pulse"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* Swipe text hint */}
      {showSwipeHint && (
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-white/40 whitespace-nowrap animate-fade-in">
          Swipe to navigate tabs
        </span>
      )}
    </div>
  );
}

/**
 * Compact version for tight spaces
 */
export function SwipeIndicatorCompact({
  tabs,
  activeIndex,
}: Omit<SwipeIndicatorProps, 'showHint'>) {
  return (
    <div className="flex items-center justify-center gap-1 py-1 md:hidden">
      {tabs.map((_, index) => (
        <div
          key={index}
          className={`transition-all duration-200 rounded-full ${
            index === activeIndex ? 'w-4 h-1.5 bg-burnt-orange' : 'w-1.5 h-1.5 bg-white/20'
          }`}
        />
      ))}
    </div>
  );
}
