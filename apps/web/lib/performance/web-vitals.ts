/**
 * Web Vitals Performance Monitoring
 *
 * Implements Core Web Vitals tracking for performance monitoring:
 * - LCP (Largest Contentful Paint): Loading performance
 * - FID (First Input Delay): Interactivity
 * - CLS (Cumulative Layout Shift): Visual stability
 * - FCP (First Contentful Paint): Initial rendering
 * - TTFB (Time to First Byte): Server response time
 * - INP (Interaction to Next Paint): Responsiveness
 */

import type { Metric } from 'web-vitals';

export interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

export interface WebVitalsReport {
  metrics: WebVitalsMetric[];
  timestamp: string;
  url: string;
  userAgent: string;
}

// Performance thresholds based on Chrome User Experience Report
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
} as const;

/**
 * Rate metric performance based on thresholds
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Format metric for storage/transmission
 */
export function formatMetric(metric: Metric): WebVitalsMetric {
  return {
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  };
}

/**
 * Send metrics to analytics endpoint
 */
export async function sendToAnalytics(metric: WebVitalsMetric): Promise<void> {
  try {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Web Vitals]', metric);
    }

    // Send to analytics endpoint
    const endpoint = '/api/analytics/web-vitals';

    // Use sendBeacon if available (more reliable for page unload)
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(metric)], { type: 'application/json' });
      navigator.sendBeacon(endpoint, blob);
    } else {
      // Fallback to fetch with keepalive
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
        keepalive: true,
      });
    }
  } catch (error) {
    // Silently fail - don't disrupt user experience
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to send web vitals:', error);
    }
  }
}

/**
 * Store metrics in localStorage for dashboard display
 */
export function storeMetric(metric: WebVitalsMetric): void {
  try {
    const key = 'web-vitals-metrics';
    const stored = localStorage.getItem(key);
    const metrics: WebVitalsMetric[] = stored ? JSON.parse(stored) : [];

    // Keep only last 50 metrics
    metrics.push(metric);
    if (metrics.length > 50) {
      metrics.shift();
    }

    localStorage.setItem(key, JSON.stringify(metrics));
  } catch (error) {
    // Silently fail if localStorage is not available
  }
}

/**
 * Retrieve stored metrics from localStorage
 */
export function getStoredMetrics(): WebVitalsMetric[] {
  try {
    const key = 'web-vitals-metrics';
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}

/**
 * Clear stored metrics
 */
export function clearStoredMetrics(): void {
  try {
    localStorage.removeItem('web-vitals-metrics');
  } catch (error) {
    // Silently fail
  }
}

/**
 * Get average values for each metric type
 */
export function getAverageMetrics(): Record<string, { value: number; rating: string; count: number }> {
  const metrics = getStoredMetrics();
  const grouped: Record<string, { total: number; count: number; ratings: string[] }> = {};

  metrics.forEach((metric) => {
    if (!grouped[metric.name]) {
      grouped[metric.name] = { total: 0, count: 0, ratings: [] };
    }
    grouped[metric.name].total += metric.value;
    grouped[metric.name].count += 1;
    grouped[metric.name].ratings.push(metric.rating);
  });

  const averages: Record<string, { value: number; rating: string; count: number }> = {};

  Object.keys(grouped).forEach((name) => {
    const data = grouped[name];
    const avgValue = data.total / data.count;

    // Determine most common rating
    const ratingCounts: Record<string, number> = {};
    data.ratings.forEach((rating) => {
      ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
    });

    const mostCommonRating = Object.keys(ratingCounts).reduce((a, b) =>
      ratingCounts[a] > ratingCounts[b] ? a : b
    );

    averages[name] = {
      value: avgValue,
      rating: mostCommonRating,
      count: data.count,
    };
  });

  return averages;
}

/**
 * Get performance score (0-100) based on all metrics
 */
export function getPerformanceScore(): number {
  const averages = getAverageMetrics();
  const metricNames = Object.keys(averages);

  if (metricNames.length === 0) return 0;

  let totalScore = 0;
  let weightSum = 0;

  // Weights based on Google Lighthouse
  const weights: Record<string, number> = {
    LCP: 25,
    FID: 10,
    CLS: 15,
    FCP: 10,
    TTFB: 10,
    INP: 30,
  };

  metricNames.forEach((name) => {
    const avg = averages[name];
    const weight = weights[name] || 10;

    let score = 0;
    if (avg.rating === 'good') score = 100;
    else if (avg.rating === 'needs-improvement') score = 50;
    else score = 0;

    totalScore += score * weight;
    weightSum += weight;
  });

  return Math.round(totalScore / weightSum);
}
