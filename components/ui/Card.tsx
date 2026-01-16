import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

export type CardVariant = 'default' | 'hover' | 'stat' | 'sport' | 'feature' | 'live';
export type SportAccent = 'baseball' | 'football' | 'basketball' | 'default';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Sport accent color for 'sport' variant */
  sportAccent?: SportAccent;
  /** Icon element for 'feature' variant */
  icon?: ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'glass-card',
  hover: 'glass-card-hover',
  stat: 'stat-card',
  sport: 'glass-card border-l-4',
  feature: 'glass-card-hover relative overflow-visible',
  live: 'glass-card relative border border-error/30',
};

const sportAccentStyles: Record<SportAccent, string> = {
  baseball: 'border-l-[#6b8e23]',
  football: 'border-l-[#355e3b]',
  basketball: 'border-l-[#e25822]',
  default: 'border-l-burnt-orange',
};

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      sportAccent = 'default',
      icon,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const variantClass = variantStyles[variant];
    const paddingClass = paddingStyles[padding];
    const sportClass = variant === 'sport' ? sportAccentStyles[sportAccent] : '';

    return (
      <div
        ref={ref}
        className={`${variantClass} ${sportClass} ${paddingClass} ${className}`}
        {...props}
      >
        {variant === 'feature' && icon && (
          <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-burnt-orange/20 border border-burnt-orange/30 flex items-center justify-center text-burnt-orange">
            {icon}
          </div>
        )}
        {variant === 'live' && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 bg-error rounded text-[10px] font-semibold uppercase tracking-wide text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </div>
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header subcomponent
export function CardHeader({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

// Card Title subcomponent
export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  size?: 'sm' | 'md' | 'lg';
}

const titleSizeStyles = {
  sm: 'text-base font-semibold',
  md: 'text-lg font-semibold',
  lg: 'text-xl font-bold',
};

export function CardTitle({ className = '', size = 'md', children, ...props }: CardTitleProps) {
  return (
    <h3 className={`${titleSizeStyles[size]} text-white ${className}`} {...props}>
      {children}
    </h3>
  );
}

// Card Content subcomponent
export function CardContent({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

// Stat Card for displaying statistics
export interface StatCardProps {
  label: string;
  value: string | number;
  change?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  className?: string;
}

export function StatCard({ label, value, change, className = '' }: StatCardProps) {
  const changeColor =
    change?.direction === 'up'
      ? 'text-success'
      : change?.direction === 'down'
        ? 'text-error'
        : 'text-white/50';

  const changeIcon = change?.direction === 'up' ? '�' : change?.direction === 'down' ? '�' : '�';

  return (
    <Card variant="stat" className={className}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {change && (
        <p className={`text-sm mt-1 ${changeColor}`}>
          {changeIcon} {Math.abs(change.value)}%
        </p>
      )}
    </Card>
  );
}
