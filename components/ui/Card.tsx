'use client';

import React, { ReactNode } from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'hover' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
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
  default: 'bg-surface-light border border-border rounded-xl',
  hover:
    'bg-surface-light border border-border rounded-xl hover:-translate-y-1 hover:border-burnt-orange/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300',
  elevated: 'bg-surface-medium border border-border rounded-xl shadow-lg',
};

export function Card({
  children,
  variant = 'default',
  padding = 'none',
  className = '',
  onClick,
  role,
  tabIndex,
  onKeyDown,
  ...props
}: CardProps) {
  const interactive = typeof onClick === 'function';

  return (
    <div
      className={`${variantClasses[variant]} ${paddingClasses[padding]} ${interactive ? 'cursor-pointer' : ''} ${className}`}
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
