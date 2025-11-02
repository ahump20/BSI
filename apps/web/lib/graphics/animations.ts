/**
 * Graphics Engine - Animation Utilities
 *
 * Performance-optimized animation utilities for smooth 60fps interactions.
 * Uses GPU-accelerated transforms and respects user motion preferences.
 */

import { graphicsTheme } from './theme';

/**
 * Animation configuration types
 */
export interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: keyof typeof graphicsTheme.animation.easing;
  fill?: 'forwards' | 'backwards' | 'both' | 'none';
}

/**
 * Stagger animation configuration
 */
export interface StaggerConfig extends AnimationConfig {
  staggerDelay?: number;
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation duration (0 if reduced motion preferred)
 */
export function getAnimationDuration(duration: number): number {
  return prefersReducedMotion() ? 0 : duration;
}

/**
 * Fade In Animation
 */
export function fadeIn(
  element: HTMLElement,
  config: AnimationConfig = {}
): Animation {
  const {
    duration = graphicsTheme.animation.duration.normal,
    delay = 0,
    easing = 'ease',
    fill = 'forwards',
  } = config;

  return element.animate(
    [
      { opacity: 0 },
      { opacity: 1 },
    ],
    {
      duration: getAnimationDuration(duration),
      delay,
      easing: graphicsTheme.animation.easing[easing],
      fill,
    }
  );
}

/**
 * Fade Out Animation
 */
export function fadeOut(
  element: HTMLElement,
  config: AnimationConfig = {}
): Animation {
  const {
    duration = graphicsTheme.animation.duration.normal,
    delay = 0,
    easing = 'ease',
    fill = 'forwards',
  } = config;

  return element.animate(
    [
      { opacity: 1 },
      { opacity: 0 },
    ],
    {
      duration: getAnimationDuration(duration),
      delay,
      easing: graphicsTheme.animation.easing[easing],
      fill,
    }
  );
}

/**
 * Slide In Animation (from direction)
 */
export function slideIn(
  element: HTMLElement,
  from: 'top' | 'right' | 'bottom' | 'left' = 'bottom',
  config: AnimationConfig = {}
): Animation {
  const {
    duration = graphicsTheme.animation.duration.normal,
    delay = 0,
    easing = 'ease',
    fill = 'forwards',
  } = config;

  const transforms = {
    top: 'translateY(-20px)',
    right: 'translateX(20px)',
    bottom: 'translateY(20px)',
    left: 'translateX(-20px)',
  };

  return element.animate(
    [
      { transform: transforms[from], opacity: 0 },
      { transform: 'translate(0)', opacity: 1 },
    ],
    {
      duration: getAnimationDuration(duration),
      delay,
      easing: graphicsTheme.animation.easing[easing],
      fill,
    }
  );
}

/**
 * Scale Animation (grow/shrink)
 */
export function scale(
  element: HTMLElement,
  fromScale: number,
  toScale: number,
  config: AnimationConfig = {}
): Animation {
  const {
    duration = graphicsTheme.animation.duration.normal,
    delay = 0,
    easing = 'spring',
    fill = 'forwards',
  } = config;

  return element.animate(
    [
      { transform: `scale(${fromScale})`, opacity: fromScale === 0 ? 0 : 1 },
      { transform: `scale(${toScale})`, opacity: toScale === 0 ? 0 : 1 },
    ],
    {
      duration: getAnimationDuration(duration),
      delay,
      easing: graphicsTheme.animation.easing[easing],
      fill,
    }
  );
}

/**
 * Stagger Animation for Lists
 * Animates elements in sequence with delay
 */
export function staggerAnimation(
  elements: HTMLElement[] | NodeListOf<Element>,
  animationFn: (el: HTMLElement, index: number) => Animation,
  config: StaggerConfig = {}
): Animation[] {
  const {
    staggerDelay = 50,
  } = config;

  const elementsArray = Array.from(elements) as HTMLElement[];

  return elementsArray.map((element, index) => {
    // Add stagger delay to animation
    const originalDelay = config.delay || 0;
    const staggeredDelay = originalDelay + (index * staggerDelay);

    return animationFn(element, index);
  });
}

/**
 * Reveal Animation (for scroll-triggered reveals)
 */
export function reveal(
  element: HTMLElement,
  config: AnimationConfig = {}
): Animation {
  const {
    duration = graphicsTheme.animation.duration.slow,
    delay = 0,
    easing = 'easeOut',
    fill = 'forwards',
  } = config;

  return element.animate(
    [
      {
        transform: 'translateY(30px)',
        opacity: 0,
      },
      {
        transform: 'translateY(0)',
        opacity: 1,
      },
    ],
    {
      duration: getAnimationDuration(duration),
      delay,
      easing: graphicsTheme.animation.easing[easing],
      fill,
    }
  );
}

/**
 * Shimmer/Pulse Animation (for loading states)
 */
export function shimmer(
  element: HTMLElement,
  config: AnimationConfig = {}
): Animation {
  const {
    duration = 1400,
    easing = 'ease',
  } = config;

  return element.animate(
    [
      { opacity: 0.6 },
      { opacity: 1 },
      { opacity: 0.6 },
    ],
    {
      duration: getAnimationDuration(duration),
      easing: graphicsTheme.animation.easing[easing],
      iterations: Infinity,
    }
  );
}

/**
 * Bounce Animation
 */
export function bounce(
  element: HTMLElement,
  config: AnimationConfig = {}
): Animation {
  const {
    duration = graphicsTheme.animation.duration.slow,
    delay = 0,
  } = config;

  return element.animate(
    [
      { transform: 'translateY(0)' },
      { transform: 'translateY(-10px)' },
      { transform: 'translateY(0)' },
    ],
    {
      duration: getAnimationDuration(duration),
      delay,
      easing: 'ease-in-out',
    }
  );
}

/**
 * Rotate Animation
 */
export function rotate(
  element: HTMLElement,
  degrees: number,
  config: AnimationConfig = {}
): Animation {
  const {
    duration = graphicsTheme.animation.duration.normal,
    delay = 0,
    easing = 'ease',
    fill = 'forwards',
  } = config;

  return element.animate(
    [
      { transform: 'rotate(0deg)' },
      { transform: `rotate(${degrees}deg)` },
    ],
    {
      duration: getAnimationDuration(duration),
      delay,
      easing: graphicsTheme.animation.easing[easing],
      fill,
    }
  );
}

/**
 * Intersection Observer for Scroll-Triggered Animations
 */
export function observeIntersection(
  elements: HTMLElement[] | NodeListOf<Element>,
  callback: (element: HTMLElement) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
    ...options,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry.target as HTMLElement);
        observer.unobserve(entry.target);
      }
    });
  }, defaultOptions);

  Array.from(elements).forEach((element) => observer.observe(element));

  return observer;
}

/**
 * Request Animation Frame with FPS limiting
 */
export class AnimationFrameScheduler {
  private fps: number;
  private frameDuration: number;
  private lastFrameTime: number = 0;
  private rafId: number | null = null;

  constructor(fps: number = 60) {
    this.fps = fps;
    this.frameDuration = 1000 / fps;
  }

  start(callback: (deltaTime: number) => void): void {
    const animate = (currentTime: number) => {
      this.rafId = requestAnimationFrame(animate);

      const elapsed = currentTime - this.lastFrameTime;

      if (elapsed >= this.frameDuration) {
        this.lastFrameTime = currentTime - (elapsed % this.frameDuration);
        callback(elapsed);
      }
    };

    this.rafId = requestAnimationFrame(animate);
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

/**
 * Easing Functions (for manual animations)
 */
export const easings = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
};

/**
 * Animate value over time
 */
export function animateValue(
  from: number,
  to: number,
  duration: number,
  callback: (value: number) => void,
  easing: (t: number) => number = easings.easeOutQuad
): void {
  const startTime = performance.now();

  function update(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);
    const currentValue = from + (to - from) * easedProgress;

    callback(currentValue);

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}
