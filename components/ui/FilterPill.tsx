import React, { type ReactNode, type ButtonHTMLAttributes } from 'react';

export interface FilterPillProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  active: boolean;
  children: ReactNode;
  size?: 'sm' | 'md';
  /** Uppercase + letter-spacing. Default true. Set false for mixed-case labels (e.g. date names). */
  uppercase?: boolean;
}

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs min-h-[44px] min-w-[44px]',
  md: 'px-4 py-2 text-sm min-h-[44px]',
};

const ACTIVE = 'bg-[var(--bsi-primary)]/15 text-[var(--bsi-primary)] border-[var(--bsi-primary)]/30';
const INACTIVE = 'bg-transparent text-[rgba(196,184,165,0.35)] border-white/[0.06] hover:text-[var(--bsi-bone)] hover:border-white/10';

export function FilterPill({
  active,
  children,
  size = 'md',
  uppercase = true,
  className = '',
  ...rest
}: FilterPillProps) {
  return (
    <button
      className={`rounded-sm font-mono border transition-all ${sizeClasses[size] ?? sizeClasses.md} ${uppercase ? 'uppercase tracking-wider' : ''} ${active ? ACTIVE : INACTIVE} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
