import type { HTMLAttributes } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 1,
  className = '',
  ...props
}: SkeletonProps) {
  const baseStyles = 'skeleton';

  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'rounded-xl',
  };

  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseStyles} ${variantStyles.text}`}
            style={{
              ...style,
              width: i === lines - 1 ? '75%' : style.width, // Last line shorter
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={style}
      {...props}
    />
  );
}

// Skeleton Card - Full card loading state
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`glass-card p-4 ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1">
          <Skeleton variant="text" width="60%" className="mb-2" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <Skeleton variant="text" width="50%" className="mb-1" />
            <Skeleton variant="text" width="70%" height={24} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton Table Row
export function SkeletonTableRow({ columns = 4 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton variant="text" width={`${60 + Math.random() * 40}%`} />
        </td>
      ))}
    </tr>
  );
}

// Skeleton Score Card
export function SkeletonScoreCard({ className = '' }: { className?: string }) {
  return (
    <div className={`glass-card p-4 ${className}`}>
      <div className="flex justify-between items-center mb-3">
        <Skeleton variant="text" width={80} />
        <Skeleton variant="text" width={60} />
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton variant="text" width={100} />
          </div>
          <Skeleton variant="text" width={30} height={28} />
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton variant="text" width={100} />
          </div>
          <Skeleton variant="text" width={30} height={28} />
        </div>
      </div>
    </div>
  );
}
