'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface TickerItem {
  id: string;
  content: string;
  type?: 'default' | 'live' | 'alert';
  href?: string;
}

export interface IntelTickerProps {
  /** Items to display in ticker */
  items: TickerItem[];
  /** Speed in pixels per second */
  speed?: number;
  /** Pause on hover */
  pauseOnHover?: boolean;
  /** Background variant */
  variant?: 'default' | 'dark' | 'accent';
  /** Separator between items */
  separator?: React.ReactNode;
  /** Additional class names */
  className?: string;
}

const variantClasses = {
  default: 'bg-charcoal border-y border-border-subtle',
  dark: 'bg-midnight border-y border-border-subtle',
  accent: 'bg-burnt-orange/10 border-y border-burnt-orange/20',
};

const typeClasses = {
  default: 'text-text-secondary',
  live: 'text-error',
  alert: 'text-warning',
};

/**
 * IntelTicker component
 *
 * Horizontally scrolling ticker for news, scores, or alerts.
 * Respects prefers-reduced-motion by showing static content.
 */
export function IntelTicker({
  items,
  speed = 25,
  pauseOnHover = true,
  variant = 'default',
  separator = '•',
  className,
}: IntelTickerProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);

  // Check reduced motion preference
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    motionQuery.addEventListener('change', handler);
    return () => motionQuery.removeEventListener('change', handler);
  }, []);

  // Measure content width for animation
  useEffect(() => {
    if (contentRef.current) {
      setContentWidth(contentRef.current.scrollWidth);
    }
  }, [items]);

  // Calculate animation duration based on content width and speed
  const duration = contentWidth / speed;

  if (items.length === 0) return null;

  // Static display for reduced motion or single item
  if (prefersReducedMotion || items.length === 1) {
    return (
      <div className={cn(variantClasses[variant], 'py-2 px-4', className)}>
        <div className="flex items-center gap-3 justify-center text-sm">
          {items.map((item, index) => (
            <span key={item.id}>
              {item.type === 'live' && (
                <span className="inline-block w-2 h-2 rounded-full bg-error mr-2 animate-pulse" />
              )}
              <span className={typeClasses[item.type || 'default']}>{item.content}</span>
              {index < items.length - 1 && (
                <span className="ml-3 text-text-muted">{separator}</span>
              )}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden py-2', variantClasses[variant], className)}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      role="marquee"
      aria-live="off"
      aria-label="News ticker"
    >
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-charcoal to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-charcoal to-transparent z-10 pointer-events-none" />

      {/* Scrolling content */}
      <div
        className="flex whitespace-nowrap"
        style={{
          animation: `ticker ${duration}s linear infinite`,
          animationPlayState: isPaused ? 'paused' : 'running',
        }}
      >
        {/* Duplicate content for seamless loop */}
        {[0, 1].map((copy) => (
          <div
            key={copy}
            ref={copy === 0 ? contentRef : undefined}
            className="flex items-center gap-6 px-4 text-sm"
          >
            {items.map((item) => (
              <TickerItemContent key={`${copy}-${item.id}`} item={item} separator={separator} />
            ))}
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}

// Individual ticker item
function TickerItemContent({ item, separator }: { item: TickerItem; separator: React.ReactNode }) {
  const content = (
    <span className="flex items-center">
      {item.type === 'live' && (
        <span className="inline-block w-2 h-2 rounded-full bg-error mr-2 animate-pulse" />
      )}
      <span
        className={cn(
          typeClasses[item.type || 'default'],
          item.href && 'hover:text-burnt-orange transition-colors'
        )}
      >
        {item.content}
      </span>
      <span className="ml-6 text-text-muted">{separator}</span>
    </span>
  );

  if (item.href) {
    return (
      <a href={item.href} className="hover:underline">
        {content}
      </a>
    );
  }

  return content;
}

export default IntelTicker;
