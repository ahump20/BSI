'use client';

import { ReactNode } from 'react';

interface MetricGateProps {
  /** Is the user on Pro tier? */
  isPro: boolean;
  /** Content to show/blur */
  children: ReactNode;
  /** Label for the upgrade prompt */
  metricName?: string;
  className?: string;
}

/**
 * MetricGate — visual paywall wrapper.
 * Pro users see content normally. Free users see a blur overlay with upgrade CTA.
 * The actual data gating happens at the API level (handlers strip Pro fields).
 * This component is the visual signal that more depth exists.
 */
export function MetricGate({
  isPro,
  children,
  metricName = 'advanced metrics',
  className = '',
}: MetricGateProps) {
  if (isPro) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`relative ${className}`}>
      <div className="blur-[6px] select-none pointer-events-none" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0D0D0D]/60 rounded-lg">
        <span className="text-[10px] font-display uppercase tracking-widest text-[#BF5700] mb-1">
          PRO
        </span>
        <span className="text-xs text-white/50 text-center max-w-[200px]">
          Unlock {metricName}
        </span>
        <a
          href="/pricing"
          className="mt-2 text-[10px] font-mono text-[#FF6B35] hover:text-white transition-colors uppercase tracking-wider"
        >
          Upgrade →
        </a>
      </div>
    </div>
  );
}
