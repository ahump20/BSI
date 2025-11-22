/**
 * Analytics Tracking for API Endpoints
 *
 * Tracks:
 * - Response times
 * - Cache hit rates
 * - Error rates
 * - Popular endpoints
 * - Geographic distribution
 */

export interface AnalyticsEvent {
  timestamp: number;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  cacheStatus?: string;
  errorMessage?: string;
  userAgent?: string;
  country?: string;
  correlationId: string;
}

export interface AnalyticsMetrics {
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  topEndpoints: Array<{ endpoint: string; count: number }>;
}

/**
 * Track API request
 */
export function trackRequest(
  request: Request,
  response: Response,
  startTime: number,
  correlationId: string
): AnalyticsEvent {
  const url = new URL(request.url);
  const endpoint = url.pathname;
  const method = request.method;
  const statusCode = response.status;
  const responseTime = Date.now() - startTime;

  // Get cache status from headers
  const cacheStatus = response.headers.get('cf-cache-status') || undefined;

  // Get user agent and country
  const userAgent = request.headers.get('user-agent') || undefined;
  const country = (request as any).cf?.country || undefined;

  return {
    timestamp: Date.now(),
    endpoint,
    method,
    statusCode,
    responseTime,
    cacheStatus,
    userAgent,
    country,
    correlationId,
  };
}

/**
 * Log analytics event to Cloudflare Analytics Engine
 */
export async function logAnalytics(
  event: AnalyticsEvent,
  analyticsEngine?: AnalyticsEngineDataset
): Promise<void> {
  if (!analyticsEngine) {
    // Fallback to console logging in development
    console.log('Analytics:', JSON.stringify(event));
    return;
  }

  try {
    analyticsEngine.writeDataPoint({
      blobs: [
        event.endpoint,
        event.method,
        event.cacheStatus || 'UNKNOWN',
        event.country || 'UNKNOWN',
      ],
      doubles: [event.responseTime, event.statusCode],
      indexes: [event.correlationId],
    });
  } catch (error) {
    console.error('Failed to log analytics:', error);
  }
}

/**
 * Generate correlation ID for request tracking
 */
export function generateCorrelationId(): string {
  return crypto.randomUUID();
}

/**
 * Add analytics headers to response
 */
export function addAnalyticsHeaders(
  response: Response,
  correlationId: string,
  responseTime: number
): Response {
  const newResponse = new Response(response.body, response);

  newResponse.headers.set('X-Correlation-ID', correlationId);
  newResponse.headers.set('X-Response-Time', `${responseTime}ms`);
  newResponse.headers.set('X-Powered-By', 'Blaze Sports Intel');

  return newResponse;
}

/**
 * Analytics middleware for Cloudflare Functions
 */
export function withAnalytics(
  handler: (context: EventContext<any, any, any>) => Promise<Response>
) {
  return async (context: EventContext<any, any, any>): Promise<Response> => {
    const correlationId = generateCorrelationId();
    const startTime = Date.now();

    try {
      // Call the handler
      const response = await handler(context);

      // Track the request
      const event = trackRequest(context.request, response, startTime, correlationId);

      // Log to analytics engine if available
      const analyticsEngine = context.env?.ANALYTICS as AnalyticsEngineDataset | undefined;
      await logAnalytics(event, analyticsEngine);

      // Add analytics headers
      const responseTime = Date.now() - startTime;
      return addAnalyticsHeaders(response, correlationId, responseTime);
    } catch (error) {
      // Track error
      const errorEvent: AnalyticsEvent = {
        timestamp: Date.now(),
        endpoint: new URL(context.request.url).pathname,
        method: context.request.method,
        statusCode: 500,
        responseTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      };

      const analyticsEngine = context.env?.ANALYTICS as AnalyticsEngineDataset | undefined;
      await logAnalytics(errorEvent, analyticsEngine);

      // Re-throw error
      throw error;
    }
  };
}

/**
 * Get analytics metrics from Analytics Engine
 */
export async function getMetrics(
  startTime: Date,
  endTime: Date,
  analyticsEngine?: AnalyticsEngineDataset
): Promise<AnalyticsMetrics> {
  // This is a placeholder - actual implementation would query Analytics Engine
  // via GraphQL API or REST API

  // For now, return mock data
  return {
    totalRequests: 0,
    successRate: 0,
    avgResponseTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
    topEndpoints: [],
  };
}

/**
 * Calculate cache hit rate
 */
export function calculateCacheHitRate(events: AnalyticsEvent[]): number {
  const hits = events.filter((e) => e.cacheStatus === 'HIT').length;
  return events.length > 0 ? hits / events.length : 0;
}

/**
 * Calculate success rate
 */
export function calculateSuccessRate(events: AnalyticsEvent[]): number {
  const successes = events.filter((e) => e.statusCode >= 200 && e.statusCode < 300).length;
  return events.length > 0 ? successes / events.length : 0;
}

/**
 * Calculate average response time
 */
export function calculateAvgResponseTime(events: AnalyticsEvent[]): number {
  if (events.length === 0) return 0;
  const sum = events.reduce((acc, e) => acc + e.responseTime, 0);
  return sum / events.length;
}

/**
 * Get top endpoints by request count
 */
export function getTopEndpoints(events: AnalyticsEvent[], limit: number = 10): Array<{ endpoint: string; count: number }> {
  const counts = new Map<string, number>();

  for (const event of events) {
    const current = counts.get(event.endpoint) || 0;
    counts.set(event.endpoint, current + 1);
  }

  return Array.from(counts.entries())
    .map(([endpoint, count]) => ({ endpoint, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Performance alert thresholds
 */
export const ALERT_THRESHOLDS = {
  avgResponseTime: 2000, // 2 seconds
  errorRate: 0.01, // 1%
  cacheHitRate: 0.5, // 50%
};

/**
 * Check if metrics exceed alert thresholds
 */
export function checkAlerts(metrics: AnalyticsMetrics): Array<{ type: string; message: string }> {
  const alerts: Array<{ type: string; message: string }> = [];

  if (metrics.avgResponseTime > ALERT_THRESHOLDS.avgResponseTime) {
    alerts.push({
      type: 'performance',
      message: `Average response time (${metrics.avgResponseTime}ms) exceeds threshold (${ALERT_THRESHOLDS.avgResponseTime}ms)`,
    });
  }

  if (metrics.errorRate > ALERT_THRESHOLDS.errorRate) {
    alerts.push({
      type: 'reliability',
      message: `Error rate (${(metrics.errorRate * 100).toFixed(2)}%) exceeds threshold (${(ALERT_THRESHOLDS.errorRate * 100).toFixed(2)}%)`,
    });
  }

  if (metrics.cacheHitRate < ALERT_THRESHOLDS.cacheHitRate) {
    alerts.push({
      type: 'cache',
      message: `Cache hit rate (${(metrics.cacheHitRate * 100).toFixed(2)}%) below threshold (${(ALERT_THRESHOLDS.cacheHitRate * 100).toFixed(2)}%)`,
    });
  }

  return alerts;
}
