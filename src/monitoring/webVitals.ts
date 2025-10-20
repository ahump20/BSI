import type { Metric } from 'web-vitals'
import { onCLS, onFCP, onFID, onINP, onLCP, onTTFB } from 'web-vitals'
import { sentry } from './sentry'

const reportMetric = (metric: Metric): void => {
  if (!sentry || !('captureEvent' in sentry)) {
    return
  }

  sentry.captureEvent({
    message: `core-web-vital:${metric.name}`,
    level: 'info',
    tags: {
      metric: metric.name,
      rating: 'rating' in metric ? metric.rating ?? 'unknown' : 'unknown',
    },
    extra: {
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
    },
  })
}

export const trackCoreWebVitals = (): void => {
  onCLS(reportMetric)
  onFCP(reportMetric)
  onFID(reportMetric)
  onINP(reportMetric)
  onLCP(reportMetric)
  onTTFB(reportMetric)
}
