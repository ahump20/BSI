'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

export interface CustomCursorProps {
  /** Dot size in pixels */
  dotSize?: number;
  /** Outline size in pixels */
  outlineSize?: number;
  /** Primary color */
  color?: string;
  /** Enable mix-blend-mode on dot */
  blendMode?: boolean;
}

/**
 * CustomCursor component
 * 
 * Custom cursor with dot + outline spotlight effect.
 * Automatically disabled on touch devices and when prefers-reduced-motion is set.
 */
export function CustomCursor({
  dotSize = 20,
  outlineSize = 40,
  color = '#BF5700',
  blendMode = true,
}: CustomCursorProps) {
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  const dotRef = useRef<HTMLDivElement>(null);
  const outlineRef = useRef<HTMLDivElement>(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  const outlinePosition = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);

  // Check if custom cursor should be enabled
  useEffect(() => {
    setMounted(true);

    // Check reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) {
      setEnabled(false);
      return;
    }

    // Check for touch device
    const isTouchDevice = 
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches;

    if (isTouchDevice) {
      setEnabled(false);
      return;
    }

    setEnabled(true);
    document.body.classList.add('custom-cursor-active');

    return () => {
      document.body.classList.remove('custom-cursor-active');
    };
  }, []);

  // Animate outline with easing
  const animateOutline = useCallback(() => {
    const dx = mousePosition.current.x - outlinePosition.current.x;
    const dy = mousePosition.current.y - outlinePosition.current.y;
    
    outlinePosition.current.x += dx * 0.15;
    outlinePosition.current.y += dy * 0.15;

    if (outlineRef.current) {
      outlineRef.current.style.transform = 
        `translate(${outlinePosition.current.x}px, ${outlinePosition.current.y}px) translate(-50%, -50%)`;
    }

    rafId.current = requestAnimationFrame(animateOutline);
  }, []);

  // Mouse move handler
  const handleMouseMove = useCallback((e: MouseEvent) => {
    mousePosition.current = { x: e.clientX, y: e.clientY };
    
    if (dotRef.current) {
      dotRef.current.style.transform = 
        `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    }
  }, []);

  // Mouse enter/leave handlers for hover detection
  const handleMouseEnter = useCallback(() => {
    setIsVisible(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false);
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (!enabled) return;

    // Start animation loop
    rafId.current = requestAnimationFrame(animateOutline);

    // Mouse events
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Hover detection on interactive elements
    const handleElementEnter = () => setIsHovering(true);
    const handleElementLeave = () => setIsHovering(false);

    const interactiveElements = document.querySelectorAll(
      'a, button, [role="button"], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', handleElementEnter);
      el.addEventListener('mouseleave', handleElementLeave);
    });

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      
      interactiveElements.forEach((el) => {
        el.removeEventListener('mouseenter', handleElementEnter);
        el.removeEventListener('mouseleave', handleElementLeave);
      });
    };
  }, [enabled, animateOutline, handleMouseMove, handleMouseEnter, handleMouseLeave]);

  // Don't render if not mounted or not enabled
  if (!mounted || !enabled) return null;

  return (
    <>
      {/* Dot (follows cursor exactly) */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full transition-transform duration-100"
        style={{
          width: dotSize,
          height: dotSize,
          backgroundColor: color,
          mixBlendMode: blendMode ? 'difference' : undefined,
          opacity: isVisible ? (isHovering ? 0.8 : 1) : 0,
          transform: isHovering ? 'scale(0.5)' : undefined,
        }}
      />
      
      {/* Outline (follows with delay) */}
      <div
        ref={outlineRef}
        aria-hidden="true"
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full transition-[width,height,opacity] duration-200"
        style={{
          width: isHovering ? outlineSize * 1.5 : outlineSize,
          height: isHovering ? outlineSize * 1.5 : outlineSize,
          border: `1px solid ${color}`,
          opacity: isVisible ? (isHovering ? 0.3 : 0.5) : 0,
        }}
      />
    </>
  );
}

export default CustomCursor;
