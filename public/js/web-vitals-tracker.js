/**
 * Blaze Sports Intel - Real User Monitoring (RUM)
 * Core Web Vitals tracker using web-vitals library
 *
 * Measures and reports:
 * - LCP (Largest Contentful Paint) - Target: < 2.5s
 * - INP (Interaction to Next Paint) - Target: < 200ms
 * - CLS (Cumulative Layout Shift) - Target: < 0.1
 * - FCP (First Contentful Paint) - Target: < 1.8s
 * - TTFB (Time to First Byte) - Target: < 600ms
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    // Analytics endpoint for reporting vitals
    endpoint: '/api/analytics/vitals',

    // Performance thresholds (good/needs-improvement/poor)
    thresholds: {
      LCP: { good: 2500, poor: 4000 },
      INP: { good: 200, poor: 500 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 600, poor: 1500 }
    },

    // Enable console logging for debugging
    debug: false
  };

  /**
   * Send vitals data to analytics endpoint
   */
  function sendToAnalytics(metric) {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,

      // Page context
      page: {
        url: window.location.pathname,
        referrer: document.referrer,
        title: document.title
      },

      // Device context
      device: {
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        connection: navigator.connection ? {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt
        } : null
      },

      // Timing
      timestamp: new Date().toISOString(),
      timezone: 'America/Chicago'
    });

    // Send via beacon (non-blocking, survives page unload)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(CONFIG.endpoint, body);
    } else {
      // Fallback to fetch
      fetch(CONFIG.endpoint, {
        method: 'POST',
        body: body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true
      }).catch(err => {
        if (CONFIG.debug) {
          console.error('[Web Vitals] Failed to send metric:', err);
        }
      });
    }

    // Log to console in debug mode
    if (CONFIG.debug) {
      console.log('[Web Vitals]', {
        metric: metric.name,
        value: Math.round(metric.value),
        rating: metric.rating,
        threshold: CONFIG.thresholds[metric.name]
      });
    }
  }

  /**
   * Display vitals badge on page (development only)
   */
  function showVitalsBadge() {
    if (window.location.hostname !== 'localhost' && !window.location.search.includes('debug=vitals')) {
      return;
    }

    const badge = document.createElement('div');
    badge.id = 'vitals-badge';
    badge.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: #fff;
      padding: 12px 16px;
      border-radius: 12px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 11px;
      z-index: 999999;
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      min-width: 200px;
    `;

    badge.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px; color: #FFB84D;">⚡ Web Vitals</div>
      <div id="vitals-content" style="font-size: 10px; line-height: 1.6;">
        <div>LCP: <span id="lcp-value">—</span></div>
        <div>INP: <span id="inp-value">—</span></div>
        <div>CLS: <span id="cls-value">—</span></div>
        <div>FCP: <span id="fcp-value">—</span></div>
        <div>TTFB: <span id="ttfb-value">—</span></div>
      </div>
    `;

    document.body.appendChild(badge);

    // Update badge with metrics
    window.updateVitalsBadge = function(name, value, rating) {
      const element = document.getElementById(`${name.toLowerCase()}-value`);
      if (element) {
        const displayValue = name === 'CLS'
          ? value.toFixed(3)
          : `${Math.round(value)}ms`;

        const color = rating === 'good' ? '#4CAF50' : rating === 'needs-improvement' ? '#FFB84D' : '#FF5252';
        element.innerHTML = `<span style="color: ${color};">${displayValue}</span>`;
      }
    };
  }

  /**
   * Initialize Web Vitals tracking
   * Uses self-hosted web-vitals library for reliability
   */
  function initWebVitals() {
    // Show debug badge if in development
    showVitalsBadge();

    // Dynamically import web-vitals library from self-hosted bundle
    // Falls back to CDN if local bundle fails to load
    const script = document.createElement('script');
    script.type = 'module';
    script.textContent = `
      // Try self-hosted first, fallback to CDN
      let webVitalsModule;
      try {
        webVitalsModule = await import('/js/web-vitals.min.js');
      } catch (error) {
        console.warn('[Web Vitals] Self-hosted module failed, using CDN fallback:', error);
        webVitalsModule = await import('https://cdn.jsdelivr.net/npm/web-vitals@4/dist/web-vitals.attribution.js');
      }

      const { onLCP, onINP, onCLS, onFCP, onTTFB } = webVitalsModule;

      function handleMetric(metric) {
        // Send to analytics
        window.parent.postMessage({
          type: 'web-vitals',
          metric: metric
        }, '*');

        // Update debug badge
        if (window.updateVitalsBadge) {
          window.updateVitalsBadge(metric.name, metric.value, metric.rating);
        }
      }

      // Register all Core Web Vitals
      onLCP(handleMetric);
      onINP(handleMetric);
      onCLS(handleMetric);
      onFCP(handleMetric);
      onTTFB(handleMetric);
    `;
    document.head.appendChild(script);

    // Listen for metrics from iframe
    window.addEventListener('message', (event) => {
      if (event.data.type === 'web-vitals') {
        sendToAnalytics(event.data.metric);
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWebVitals);
  } else {
    initWebVitals();
  }

  // Expose config for runtime modification
  window.WebVitalsTracker = {
    config: CONFIG,
    enable: () => CONFIG.debug = true,
    disable: () => CONFIG.debug = false
  };

})();
