import React from 'react';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * Reusable loading state component with spinner
 * Provides visual feedback during async operations
 */
export function LoadingState({
  message = 'Loading...',
  size = 'medium',
  className = ''
}: LoadingStateProps) {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4'
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div
        className={`${sizeClasses[size]} border-gray-300 border-t-blue-600 rounded-full animate-spin`}
      />
      {message && (
        <p className="mt-4 text-gray-600 text-sm">{message}</p>
      )}
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

/**
 * Skeleton loader component for content placeholders
 * Shows loading state for specific UI elements
 */
export function Skeleton({
  className = '',
  width = '100%',
  height = '1rem',
  variant = 'text'
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md'
  };

  return (
    <div
      className={`bg-gray-200 animate-pulse ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

interface SkeletonCardProps {
  lines?: number;
  className?: string;
  showAvatar?: boolean;
}

/**
 * Pre-built skeleton card for common loading patterns
 * Useful for list items, cards, and table rows
 */
export function SkeletonCard({
  lines = 3,
  className = '',
  showAvatar = false
}: SkeletonCardProps) {
  return (
    <div className={`p-4 border border-gray-200 rounded-lg ${className}`} aria-hidden="true">
      <div className="flex items-start gap-4">
        {showAvatar && (
          <Skeleton variant="circular" width="3rem" height="3rem" />
        )}
        <div className="flex-1 space-y-3">
          <Skeleton width="60%" height="1.25rem" />
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
              key={i}
              width={i === lines - 1 ? '40%' : '100%'}
              height="0.875rem"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

/**
 * Skeleton loader for data tables
 * Shows table structure while data loads
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className = ''
}: SkeletonTableProps) {
  return (
    <div className={`w-full ${className}`} aria-hidden="true">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-gray-200 bg-gray-50">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} width="100%" height="1rem" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4 p-4 border-b border-gray-100">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              width="100%"
              height="0.875rem"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
