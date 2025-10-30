/**
 * Advanced Animation Hooks
 *
 * React hooks for advanced animation patterns.
 * These wrap the advanced-animations utilities for easy React integration.
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  createSpring,
  SpringConfig,
  createParallax,
  ParallaxConfig,
  makeDraggable,
  DragConfig,
  createMagnetic,
  MagneticConfig,
  createRipple,
} from './advanced-animations';

/**
 * useSpring - Spring physics animation hook
 *
 * @example
 * const [target, setTarget] = useState(0);
 * const value = useSpring(target, { stiffness: 170, damping: 26 });
 */
export function useSpring(target: number, config: SpringConfig = {}): number {
  const [value, setValue] = useState(target);
  const springRef = useRef(createSpring(target, target, config));
  const rafRef = useRef<number>();

  useEffect(() => {
    springRef.current.setTarget(target);

    const animate = () => {
      const spring = springRef.current;
      spring.update(16); // Assume 60fps
      const currentValue = spring.getValue();
      setValue(currentValue);

      if (!spring.isResting()) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target]);

  return value;
}

/**
 * useParallax - Parallax scroll effect hook
 *
 * @example
 * const ref = useParallax({ speed: 0.5, direction: 'vertical' });
 * return <div ref={ref}>Content</div>;
 */
export function useParallax<T extends HTMLElement>(
  config: ParallaxConfig = {}
): React.RefObject<T> {
  const ref = useRef<T>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (ref.current) {
      cleanupRef.current = createParallax(ref.current, config);
    }

    return () => {
      cleanupRef.current?.();
    };
  }, [config.speed, config.direction, config.smooth]);

  return ref;
}

/**
 * useDraggable - Drag gesture hook
 *
 * @example
 * const { ref, position, isDragging } = useDraggable({
 *   onDrag: (x, y) => console.log('Dragging:', x, y),
 *   bounds: { minX: 0, maxX: 200 }
 * });
 */
export function useDraggable<T extends HTMLElement>(config: DragConfig = {}) {
  const ref = useRef<T>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (ref.current) {
      cleanupRef.current = makeDraggable(ref.current, {
        ...config,
        onDrag: (x, y) => {
          setPosition({ x, y });
          setIsDragging(true);
          config.onDrag?.(x, y);
        },
        onRelease: (vx, vy) => {
          setIsDragging(false);
          config.onRelease?.(vx, vy);
        },
      });
    }

    return () => {
      cleanupRef.current?.();
    };
  }, [config.bounds, config.momentum, config.springBack, config.axis]);

  return { ref, position, isDragging };
}

/**
 * useMagnetic - Magnetic cursor effect hook
 *
 * @example
 * const ref = useMagnetic({ strength: 0.3, radius: 100 });
 * return <button ref={ref}>Hover me</button>;
 */
export function useMagnetic<T extends HTMLElement>(
  config: MagneticConfig = {}
): React.RefObject<T> {
  const ref = useRef<T>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (ref.current) {
      cleanupRef.current = createMagnetic(ref.current, config);
    }

    return () => {
      cleanupRef.current?.();
    };
  }, [config.strength, config.radius]);

  return ref;
}

/**
 * useRipple - Material Design ripple effect hook
 *
 * @example
 * const ref = useRipple('rgba(255, 255, 255, 0.6)');
 * return <button ref={ref}>Click me</button>;
 */
export function useRipple<T extends HTMLElement>(
  color: string = 'rgba(255, 255, 255, 0.6)'
): React.RefObject<T> {
  const ref = useRef<T>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (ref.current) {
      cleanupRef.current = createRipple(ref.current, color);
    }

    return () => {
      cleanupRef.current?.();
    };
  }, [color]);

  return ref;
}

/**
 * useSequentialReveal - Reveal elements in sequence
 *
 * @example
 * const refs = useSequentialReveal(3, { delay: 100 });
 * return refs.map((ref, i) => <div key={i} ref={ref}>Item {i}</div>);
 */
export function useSequentialReveal<T extends HTMLElement>(
  count: number,
  options: {
    delay?: number;
    duration?: number;
    easing?: string;
    threshold?: number;
  } = {}
): React.RefObject<T>[] {
  const { delay = 100, duration = 400, easing = 'ease-out', threshold = 0.2 } = options;

  const refs = useRef<React.RefObject<T>[]>(
    Array.from({ length: count }, () => ({ current: null }))
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const index = refs.current.findIndex((ref) => ref.current === element);

            if (index >= 0) {
              setTimeout(() => {
                element.style.opacity = '0';
                element.style.transform = 'translateY(20px)';

                requestAnimationFrame(() => {
                  element.style.transition = `opacity ${duration}ms ${easing}, transform ${duration}ms ${easing}`;
                  element.style.opacity = '1';
                  element.style.transform = 'translateY(0)';
                });
              }, index * delay);

              observer.unobserve(element);
            }
          }
        });
      },
      { threshold }
    );

    refs.current.forEach((ref) => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [count, delay, duration, easing, threshold]);

  return refs.current;
}

/**
 * useScrollProgress - Track scroll progress through an element
 *
 * @example
 * const { ref, progress } = useScrollProgress();
 * return (
 *   <>
 *     <div ref={ref}>Long content</div>
 *     <ProgressBar value={progress} />
 *   </>
 * );
 */
export function useScrollProgress<T extends HTMLElement>(): {
  ref: React.RefObject<T>;
  progress: number;
} {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const elementHeight = rect.height;
      const viewportHeight = window.innerHeight;

      // Calculate how much of the element has been scrolled through
      const elementTop = rect.top;
      const scrollRange = elementHeight + viewportHeight;
      const scrolled = viewportHeight - elementTop;

      const calculatedProgress = Math.max(0, Math.min(1, scrolled / scrollRange));
      setProgress(calculatedProgress);
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress(); // Initial calculation

    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  return { ref, progress };
}

/**
 * usePageTransition - Smooth page transition effect
 *
 * @example
 * const { isTransitioning, startTransition } = usePageTransition();
 *
 * <button onClick={() => startTransition(() => router.push('/about'))}>
 *   Go to About
 * </button>
 */
export function usePageTransition(duration: number = 300) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const startTransition = useCallback(
    (callback: () => void) => {
      setIsTransitioning(true);

      setTimeout(() => {
        callback();
        setTimeout(() => {
          setIsTransitioning(false);
        }, duration);
      }, duration);
    },
    [duration]
  );

  return { isTransitioning, startTransition };
}

/**
 * useMousePosition - Track mouse position relative to element
 *
 * @example
 * const { ref, position, isHovering } = useMousePosition();
 * return (
 *   <div ref={ref}>
 *     Mouse at: {position.x}, {position.y}
 *   </div>
 * );
 */
export function useMousePosition<T extends HTMLElement>(): {
  ref: React.RefObject<T>;
  position: { x: number; y: number };
  isHovering: boolean;
} {
  const ref = useRef<T>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      setPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => {
      setIsHovering(false);
      setPosition({ x: 0, y: 0 });
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return { ref, position, isHovering };
}

/**
 * useAnimatedPresence - Animate element entry and exit
 *
 * @example
 * const { shouldRender, style } = useAnimatedPresence(isVisible, {
 *   enter: { opacity: 1, transform: 'scale(1)' },
 *   exit: { opacity: 0, transform: 'scale(0.8)' },
 *   duration: 300
 * });
 *
 * return shouldRender ? <div style={style}>Content</div> : null;
 */
export function useAnimatedPresence(
  isVisible: boolean,
  config: {
    enter: React.CSSProperties;
    exit: React.CSSProperties;
    duration?: number;
    easing?: string;
  }
): {
  shouldRender: boolean;
  style: React.CSSProperties;
} {
  const { enter, exit, duration = 300, easing = 'ease-out' } = config;
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [style, setStyle] = useState<React.CSSProperties>(isVisible ? enter : exit);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      // Small delay to ensure element is rendered before animating
      requestAnimationFrame(() => {
        setStyle({
          ...enter,
          transition: `all ${duration}ms ${easing}`,
        });
      });
    } else {
      setStyle({
        ...exit,
        transition: `all ${duration}ms ${easing}`,
      });

      // Remove from DOM after animation completes
      const timeout = setTimeout(() => {
        setShouldRender(false);
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [isVisible, duration, easing]);

  return { shouldRender, style };
}

/**
 * useGesture - Comprehensive gesture detection
 *
 * @example
 * const { ref, gestures } = useGesture();
 * return (
 *   <div ref={ref}>
 *     Swipe direction: {gestures.swipeDirection}
 *   </div>
 * );
 */
export function useGesture<T extends HTMLElement>(): {
  ref: React.RefObject<T>;
  gestures: {
    swipeDirection: 'left' | 'right' | 'up' | 'down' | null;
    isLongPress: boolean;
    isPinching: boolean;
    pinchScale: number;
  };
} {
  const ref = useRef<T>(null);
  const [gestures, setGestures] = useState({
    swipeDirection: null as 'left' | 'right' | 'up' | 'down' | null,
    isLongPress: false,
    isPinching: false,
    pinchScale: 1,
  });

  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const longPressTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now(),
        };

        // Long press detection
        longPressTimerRef.current = setTimeout(() => {
          setGestures((prev) => ({ ...prev, isLongPress: true }));
        }, 500);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }

      // Pinch detection
      if (e.touches.length === 2) {
        setGestures((prev) => ({ ...prev, isPinching: true }));
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }

      if (e.changedTouches.length === 1 && !gestures.isPinching) {
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;
        const deltaTime = Date.now() - touchStartRef.current.time;

        // Swipe detection (must be fast and far enough)
        if (deltaTime < 300 && (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50)) {
          let direction: 'left' | 'right' | 'up' | 'down' | null = null;

          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            direction = deltaX > 0 ? 'right' : 'left';
          } else {
            direction = deltaY > 0 ? 'down' : 'up';
          }

          setGestures((prev) => ({ ...prev, swipeDirection: direction }));

          // Reset swipe direction after a delay
          setTimeout(() => {
            setGestures((prev) => ({ ...prev, swipeDirection: null }));
          }, 300);
        }
      }

      setGestures((prev) => ({
        ...prev,
        isLongPress: false,
        isPinching: false,
        pinchScale: 1,
      }));
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return { ref, gestures };
}
