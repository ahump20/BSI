/**
 * useSwipeGesture Hook
 *
 * Detects horizontal swipe gestures for mobile navigation.
 * Returns callbacks for swipe left/right with customizable thresholds.
 */

import { useRef, useCallback, type RefObject } from 'react';

interface SwipeOptions {
  /** Minimum horizontal distance to trigger swipe (default: 50px) */
  threshold?: number;
  /** Maximum vertical distance allowed (default: 100px) */
  verticalThreshold?: number;
  /** Callback when swiping left (next) */
  onSwipeLeft?: () => void;
  /** Callback when swiping right (previous) */
  onSwipeRight?: () => void;
  /** Whether swipe is enabled (default: true) */
  enabled?: boolean;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
}

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export function useSwipeGesture({
  threshold = 50,
  verticalThreshold = 100,
  onSwipeLeft,
  onSwipeRight,
  enabled = true,
}: SwipeOptions): SwipeHandlers {
  const touchState = useRef<TouchState | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;

      const touch = e.touches[0];
      touchState.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
      };
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !touchState.current) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchState.current.startX;
      const deltaY = Math.abs(touch.clientY - touchState.current.startY);

      // If scrolling vertically, abort swipe detection
      if (deltaY > verticalThreshold) {
        touchState.current = null;
        return;
      }

      // Prevent default scrolling if horizontal swipe is detected
      if (Math.abs(deltaX) > 10) {
        // Small threshold for early detection
        e.preventDefault?.();
      }
    },
    [enabled, verticalThreshold]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !touchState.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchState.current.startX;
      const deltaY = Math.abs(touch.clientY - touchState.current.startY);
      const duration = Date.now() - touchState.current.startTime;

      // Reset state
      touchState.current = null;

      // Check if swipe is valid
      if (deltaY > verticalThreshold) return;
      if (Math.abs(deltaX) < threshold) return;

      // Velocity check - swipe should complete within 500ms for quick gestures
      const velocity = Math.abs(deltaX) / duration;
      if (velocity < 0.1 && duration > 500) return; // Too slow

      // Trigger appropriate callback
      if (deltaX < -threshold && onSwipeLeft) {
        onSwipeLeft();
      } else if (deltaX > threshold && onSwipeRight) {
        onSwipeRight();
      }
    },
    [enabled, threshold, verticalThreshold, onSwipeLeft, onSwipeRight]
  );

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}

/**
 * Hook that returns a ref to attach to an element for swipe detection.
 * Useful when you can't use the handlers directly on the element.
 */
export function useSwipeRef<T extends HTMLElement>(
  options: SwipeOptions
): RefObject<T> & { handlers: SwipeHandlers } {
  const ref = useRef<T>(null);
  const handlers = useSwipeGesture(options);

  return Object.assign(ref, { handlers });
}
