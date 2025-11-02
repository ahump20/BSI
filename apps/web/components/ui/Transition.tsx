/**
 * Transition Components
 *
 * Smooth transition components for page and state changes.
 * Usage: <FadeTransition show={isVisible}><Content /></FadeTransition>
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { fadeIn, fadeOut, slideIn, AnimationConfig } from '@/lib/graphics/animations';
import { usePrefersReducedMotion } from '@/lib/graphics/hooks';

interface TransitionProps {
  show: boolean;
  children: React.ReactNode;
  config?: AnimationConfig;
  unmountOnExit?: boolean;
  onEnter?: () => void;
  onExit?: () => void;
}

/**
 * Fade Transition - Fade in/out content
 */
export function FadeTransition({
  show,
  children,
  config,
  unmountOnExit = false,
  onEnter,
  onExit,
}: TransitionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(show);
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      if (ref.current && !prefersReduced) {
        const animation = fadeIn(ref.current, config);
        animation.onfinish = () => onEnter?.();
      } else {
        onEnter?.();
      }
    } else if (ref.current && !prefersReduced) {
      const animation = fadeOut(ref.current, config);
      animation.onfinish = () => {
        if (unmountOnExit) setShouldRender(false);
        onExit?.();
      };
    } else {
      if (unmountOnExit) setShouldRender(false);
      onExit?.();
    }
  }, [show, config, unmountOnExit, onEnter, onExit, prefersReduced]);

  if (!shouldRender) return null;

  return (
    <div ref={ref} style={{ opacity: show || prefersReduced ? 1 : 0 }}>
      {children}
    </div>
  );
}

/**
 * Slide Transition - Slide in/out content
 */
interface SlideTransitionProps extends TransitionProps {
  direction?: 'top' | 'right' | 'bottom' | 'left';
}

export function SlideTransition({
  show,
  direction = 'bottom',
  children,
  config,
  unmountOnExit = false,
  onEnter,
  onExit,
}: SlideTransitionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(show);
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      if (ref.current && !prefersReduced) {
        const animation = slideIn(ref.current, direction, config);
        animation.onfinish = () => onEnter?.();
      } else {
        onEnter?.();
      }
    } else if (ref.current && !prefersReduced) {
      // Slide out in opposite direction
      const oppositeDirection = {
        top: 'bottom',
        right: 'left',
        bottom: 'top',
        left: 'right',
      }[direction] as 'top' | 'right' | 'bottom' | 'left';

      const animation = slideIn(ref.current, oppositeDirection, config);
      animation.onfinish = () => {
        if (unmountOnExit) setShouldRender(false);
        onExit?.();
      };
    } else {
      if (unmountOnExit) setShouldRender(false);
      onExit?.();
    }
  }, [show, direction, config, unmountOnExit, onEnter, onExit, prefersReduced]);

  if (!shouldRender) return null;

  return (
    <div ref={ref} style={{ opacity: show || prefersReduced ? 1 : 0 }}>
      {children}
    </div>
  );
}

/**
 * Collapse Transition - Expand/collapse content
 */
export function CollapseTransition({
  show,
  children,
  config,
  onEnter,
  onExit,
}: TransitionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>(show ? 'auto' : 0);
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!ref.current) return;

    if (show) {
      // Get the full height
      const fullHeight = ref.current.scrollHeight;

      if (prefersReduced) {
        setHeight(fullHeight);
        onEnter?.();
      } else {
        // Animate from 0 to full height
        setHeight(0);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setHeight(fullHeight);
            setTimeout(() => {
              setHeight('auto');
              onEnter?.();
            }, config?.duration || 300);
          });
        });
      }
    } else {
      if (prefersReduced) {
        setHeight(0);
        onExit?.();
      } else {
        // Get current height before collapsing
        const currentHeight = ref.current.scrollHeight;
        setHeight(currentHeight);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setHeight(0);
            setTimeout(() => {
              onExit?.();
            }, config?.duration || 300);
          });
        });
      }
    }
  }, [show, config, onEnter, onExit, prefersReduced]);

  return (
    <div
      ref={ref}
      style={{
        height: height === 'auto' ? 'auto' : `${height}px`,
        overflow: 'hidden',
        transition: prefersReduced ? 'none' : `height ${config?.duration || 300}ms ease`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Scale Transition - Scale in/out content
 */
export function ScaleTransition({
  show,
  children,
  config,
  unmountOnExit = false,
  onEnter,
  onExit,
}: TransitionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(show);
  const [scale, setScale] = useState(show ? 1 : 0.95);
  const [opacity, setOpacity] = useState(show ? 1 : 0);
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    if (show) {
      setShouldRender(true);

      if (prefersReduced) {
        setScale(1);
        setOpacity(1);
        onEnter?.();
      } else {
        requestAnimationFrame(() => {
          setScale(1);
          setOpacity(1);
          setTimeout(() => {
            onEnter?.();
          }, config?.duration || 200);
        });
      }
    } else {
      if (prefersReduced) {
        setScale(0.95);
        setOpacity(0);
        if (unmountOnExit) setShouldRender(false);
        onExit?.();
      } else {
        setScale(0.95);
        setOpacity(0);
        setTimeout(() => {
          if (unmountOnExit) setShouldRender(false);
          onExit?.();
        }, config?.duration || 200);
      }
    }
  }, [show, config, unmountOnExit, onEnter, onExit, prefersReduced]);

  if (!shouldRender) return null;

  return (
    <div
      ref={ref}
      style={{
        transform: `scale(${scale})`,
        opacity,
        transition: prefersReduced
          ? 'none'
          : `transform ${config?.duration || 200}ms ease, opacity ${config?.duration || 200}ms ease`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Page Transition Wrapper
 * Wraps page content with fade transition
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
  }, []);

  return (
    <FadeTransition show={show} config={{ duration: 300 }}>
      {children}
    </FadeTransition>
  );
}
