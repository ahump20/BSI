'use client';

import React, { ReactNode } from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'hover' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Team/accent color for left-border highlight */
  accentColor?: string;
  /** Enable warm glow effect on hover (uses accentColor or bsi-primary) */
  glow?: boolean;
  className?: string;
}

export interface StatCardProps {
  label: string;
  value: string | number;
  helperText?: string;
  className?: string;
}

const paddingClasses: Record<string, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const variantClasses: Record<string, string> = {
  default: 'bg-surface-dugout border border-border-vintage rounded-sm',
  hover:
    'bg-surface-dugout border border-border-vintage rounded-sm hover:-translate-y-1 hover:border-heritage-bronze/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300',
  elevated: 'bg-surface-press-box border border-border-vintage rounded-sm shadow-lg',
};

export function Card({
  children,
  variant = 'default',
  padding = 'none',
  accentColor,
  glow = false,
  className = '',
  onClick,
  role,
  tabIndex,
  onKeyDown,
  style,
  ...props
}: CardProps) {
  const interactive = typeof onClick === 'function';
  const glowColor = accentColor ?? 'var(--bsi-primary)';

  return (
    <div
      className={`${variantClasses[variant]} ${paddingClasses[padding]} ${interactive ? 'cursor-pointer' : ''} ${className}`}
      style={{
        borderLeft: accentColor ? `3px solid ${accentColor}` : undefined,
        boxShadow: glow
          ? `0 0 20px color-mix(in srgb, ${glowColor} 15%, transparent)`
          : undefined,
        ...style,
      }}
      onClick={onClick}
      role={role ?? (interactive ? 'button' : undefined)}
      tabIndex={tabIndex ?? (interactive ? 0 : undefined)}
      onKeyDown={(event) => {
        if (onKeyDown) onKeyDown(event);
        if (!interactive || event.defaultPrevented) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-6 py-4 border-b border-border ${className}`}>{children}</div>;
}

export function CardTitle({
  children,
  size,
  className = '',
}: {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClass = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-xl' : 'text-lg';
  return (
    <h3
      className={`${sizeClass} font-display uppercase tracking-wide font-semibold text-text-primary ${className}`}
    >
      {children}
    </h3>
  );
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}

export function StatCard({ label, value, helperText, className = '' }: StatCardProps) {
  return (
    <Card variant="default" padding="md" className={className}>
      <div className="text-xs uppercase tracking-wide text-text-tertiary">{label}</div>
      <div className="mt-1 text-2xl font-display text-text-primary">{value}</div>
      {helperText ? <div className="mt-1 text-xs text-text-muted">{helperText}</div> : null}
    </Card>
  );
}
