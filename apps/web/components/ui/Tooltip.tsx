/**
 * Tooltip Component
 *
 * Hover tooltips with multiple placement options.
 * Usage: <Tooltip content="Info text"><button>Hover me</button></Tooltip>
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { graphicsTheme } from '@/lib/graphics/theme';
import { fadeIn, fadeOut } from '@/lib/graphics/animations';
import { usePrefersReducedMotion } from '@/lib/graphics/hooks';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
  className?: string;
}

export function Tooltip({
  content,
  children,
  placement = 'top',
  delay = 300,
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const calculatePosition = () => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 200; // Approximate
    const tooltipHeight = 40; // Approximate
    const offset = 8;

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = triggerRect.top - tooltipHeight - offset;
        left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + offset;
        left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2;
        left = triggerRect.left - tooltipWidth - offset;
        break;
      case 'right':
        top = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2;
        left = triggerRect.right + offset;
        break;
    }

    setPosition({ top, left });
  };

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      calculatePosition();
      setIsVisible(true);

      if (tooltipRef.current && !prefersReduced) {
        fadeIn(tooltipRef.current, { duration: 150 });
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (tooltipRef.current && !prefersReduced) {
      const animation = fadeOut(tooltipRef.current, { duration: 150 });
      animation.onfinish = () => setIsVisible(false);
    } else {
      setIsVisible(false);
    }
  };

  const childWithRef = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: (e: React.MouseEvent) => {
      children.props.onMouseEnter?.(e);
      showTooltip();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      children.props.onMouseLeave?.(e);
      hideTooltip();
    },
    onFocus: (e: React.FocusEvent) => {
      children.props.onFocus?.(e);
      showTooltip();
    },
    onBlur: (e: React.FocusEvent) => {
      children.props.onBlur?.(e);
      hideTooltip();
    },
  });

  const tooltipContent = isVisible && mounted ? (
    <div
      ref={tooltipRef}
      className={`tooltip ${className}`}
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        background: graphicsTheme.colors.background.tertiary,
        color: graphicsTheme.colors.text.primary,
        padding: '0.5rem 0.75rem',
        borderRadius: graphicsTheme.borderRadius.md,
        border: `1px solid rgba(148, 163, 184, 0.2)`,
        boxShadow: graphicsTheme.shadows.md,
        fontSize: '0.875rem',
        maxWidth: '200px',
        zIndex: 9999,
        pointerEvents: 'none',
        opacity: 0,
      }}
      role="tooltip"
    >
      {content}
    </div>
  ) : null;

  return (
    <>
      {childWithRef}
      {tooltipContent && createPortal(tooltipContent, document.body)}
    </>
  );
}

/**
 * InfoTooltip - Icon with tooltip for help text
 */
export interface InfoTooltipProps {
  content: React.ReactNode;
  placement?: 'top' | 'right' | 'bottom' | 'left';
}

export function InfoTooltip({ content, placement = 'top' }: InfoTooltipProps) {
  return (
    <Tooltip content={content} placement={placement}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: graphicsTheme.colors.background.tertiary,
          color: graphicsTheme.colors.text.secondary,
          fontSize: '0.75rem',
          fontWeight: '600',
          cursor: 'help',
          marginLeft: '0.25rem',
        }}
      >
        ?
      </span>
    </Tooltip>
  );
}
