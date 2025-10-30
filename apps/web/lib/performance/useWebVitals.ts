'use client';

import { useEffect } from 'react';
import type { Metric } from 'web-vitals';
import { formatMetric, sendToAnalytics, storeMetric } from './web-vitals';

/**
 * React hook to automatically track Core Web Vitals
 *
 * Usage:
 * ```tsx
 * function MyApp() {
 *   useWebVitals();
 *   return <div>...</div>;
 * }
 * ```
 */
export function useWebVitals() {
  useEffect(() => {
    // Dynamically import web-vitals to avoid SSR issues
    if (typeof window === 'undefined') return;

    // Import all Core Web Vitals metrics
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      const handleMetric = (metric: Metric) => {
        const formatted = formatMetric(metric);

        // Store locally for dashboard
        storeMetric(formatted);

        // Send to analytics
        void sendToAnalytics(formatted);
      };

      // Track all Core Web Vitals
      onCLS(handleMetric);
      onFCP(handleMetric);
      onLCP(handleMetric);
      onTTFB(handleMetric);
      onINP(handleMetric);
    });
  }, []);
}
