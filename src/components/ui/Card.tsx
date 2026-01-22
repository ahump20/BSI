import { forwardRef, type HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover' | 'stat' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantStyles = {
  default: 'glass-card',
  hover: 'glass-card-hover',
  stat: 'stat-card',
  interactive: 'glass-card-hover hover:-translate-y-1 transition-transform duration-300',
};

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', className = '', children, ...props }, ref) => {
    const variantClass = variantStyles[variant];
    const paddingClass = paddingStyles[padding];

    return (
      <div ref={ref} className={`${variantClass} ${paddingClass} ${className}`} {...props}>
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
export function CardTitle({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-lg font-semibold text-white ${className}`} {...props}>
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
