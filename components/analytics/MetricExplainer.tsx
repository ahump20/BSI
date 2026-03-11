'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { METRIC_DEFINITIONS } from '@/lib/data/metric-definitions';

interface MetricExplainerProps {
  /** Metric key matching METRIC_DEFINITIONS (e.g., "wOBA", "FIP", "K%") */
  metric: string;
  children: ReactNode;
  className?: string;
}

/**
 * MetricExplainer — wraps a stat label with a small help icon.
 * Hover (desktop) or tap (mobile) shows a tooltip explaining the metric.
 * Pulls definitions from the centralized metric-definitions glossary.
 */
export function MetricExplainer({
  metric,
  children,
  className = '',
}: MetricExplainerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const def = METRIC_DEFINITIONS[metric];

  // Close on outside tap (mobile)
  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [open]);

  // If no definition exists, render children as-is
  if (!def) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span
      ref={ref}
      className={`relative inline-flex items-center gap-0.5 cursor-help ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => {
        e.stopPropagation();
        setOpen((prev) => !prev);
      }}
    >
      {children}
      <svg
        className="w-3 h-3 text-text-muted opacity-40 hover:opacity-70 transition-opacity shrink-0"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 2.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM6.5 7h2v4.5h-2V7h1z" />
        <rect x="7" y="7" width="2" height="4" rx="0.5" />
        <circle cx="8" cy="4.5" r="1" />
      </svg>

      {open && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 sm:w-64 p-3 rounded-lg bg-background-secondary border border-border shadow-xl pointer-events-auto">
          <span className="block text-xs font-mono text-burnt-orange font-bold mb-1">
            {def.abbr}
          </span>
          <span className="block text-[11px] text-text-secondary leading-relaxed">
            {def.description}
          </span>
          {def.context && (
            <span className="block text-[10px] text-text-muted mt-1.5 font-mono">
              {def.context}
            </span>
          )}
          {/* Arrow */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-border" />
        </span>
      )}
    </span>
  );
}
