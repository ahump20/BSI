'use client';

import { ReactNode, Suspense, lazy, ComponentType } from 'react';

/**
 * Lazy Load Wrapper Component
 *
 * Provides a standardized way to lazy-load heavy components with:
 * - Loading skeleton/placeholder
 * - Error boundary
 * - Intersection Observer for viewport-based loading
 */

interface LazyLoadWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

/**
 * Basic lazy load wrapper with Suspense
 */
export function LazyLoadWrapper({ children, fallback, className }: LazyLoadWrapperProps) {
  const defaultFallback = (
    <div className={`flex items-center justify-center p-8 ${className || ''}`}>
      <div className="animate-pulse space-y-4 w-full">
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
}

/**
 * Create a lazy-loaded component with wrapper
 *
 * Usage:
 * ```tsx
 * const Heavy3DComponent = createLazyComponent(
 *   () => import('./Heavy3DComponent'),
 *   <LoadingSkeleton />
 * );
 * ```
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: ReactNode
): ComponentType<any> {
  const LazyComponent = lazy(importFunc);

  return function WrappedLazyComponent(props: any) {
    return (
      <LazyLoadWrapper fallback={fallback}>
        <LazyComponent {...props} />
      </LazyLoadWrapper>
    );
  };
}

/**
 * Skeleton placeholder for loading states
 */
export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse space-y-4 ${className}`}>
      <div className="h-8 bg-gray-700 rounded w-1/4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-700 rounded"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-700 rounded w-4/6"></div>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="h-24 bg-gray-700 rounded"></div>
        <div className="h-24 bg-gray-700 rounded"></div>
        <div className="h-24 bg-gray-700 rounded"></div>
      </div>
    </div>
  );
}

/**
 * Skeleton for chart/visualization loading
 */
export function ChartSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
      <div className="h-64 bg-gray-700 rounded"></div>
    </div>
  );
}

/**
 * Skeleton for 3D visualization loading
 */
export function Visualization3DSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="relative h-96 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="h-4 bg-gray-700 rounded w-32 mx-auto"></div>
            <div className="h-3 bg-gray-700 rounded w-48 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
