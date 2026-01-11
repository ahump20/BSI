/**
 * BSI Error Boundary System
 * Global error handling to prevent blank screens
 *
 * Usage:
 *   // Wrap fetch calls
 *   const data = await BSIErrorBoundary.safeFetch('/api/scores', { timeout: 10000 });
 *
 *   // Check for errors
 *   if (data.error) {
 *     BSIDataState.renderError(container, { message: data.error });
 *   }
 *
 *   // Manual error reporting
 *   BSIErrorBoundary.report('Custom error message', { context: 'optional data' });
 */

const BSIErrorBoundary = (function() {
  'use strict';

  // Track errors to prevent duplicate reporting
  const reportedErrors = new Set();
  const MAX_ERRORS_PER_SESSION = 10;
  let errorCount = 0;

  /**
   * Initialize global error handlers
   */
  function init() {
    // Global error handler
    window.onerror = function(message, source, lineno, colno, error) {
      handleError({
        type: 'uncaught',
        message: message,
        source: source,
        line: lineno,
        column: colno,
        stack: error?.stack
      });
      // Don't prevent default - let browser handle it too
      return false;
    };

    // Unhandled promise rejections
    window.onunhandledrejection = function(event) {
      handleError({
        type: 'unhandled_rejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack
      });
    };

    // React hydration error detection
    const originalConsoleError = console.error;
    console.error = function() {
      var args = Array.prototype.slice.call(arguments);
      var message = args.join(' ');
      if (message.indexOf('Minified React error') !== -1 || message.indexOf('Hydration') !== -1) {
        handleError({
          type: 'react_hydration',
          message: message
        });
      }
      originalConsoleError.apply(console, args);
    };

    console.log('[BSI ErrorBoundary] Initialized');
  }

  /**
   * Central error handler
   */
  function handleError(errorData) {
    // Deduplicate errors
    var errorKey = errorData.type + ':' + (errorData.message ? errorData.message.substring(0, 100) : '');
    if (reportedErrors.has(errorKey)) {
      return;
    }
    reportedErrors.add(errorKey);

    // Rate limit
    errorCount++;
    if (errorCount > MAX_ERRORS_PER_SESSION) {
      return;
    }

    // Log to console in development
    if (window.location.hostname === 'localhost' || new URLSearchParams(window.location.search).get('debug') === 'true') {
      console.warn('[BSI ErrorBoundary]', errorData);
    }

    // Report to analytics (non-blocking)
    reportToAnalytics(errorData);

    // Show fallback UI for critical errors
    if (errorData.type === 'react_hydration' || errorData.type === 'uncaught') {
      showFallbackUI(errorData);
    }
  }

  /**
   * Report error to BSI Analytics
   */
  function reportToAnalytics(errorData) {
    try {
      // Use BSI Analytics if available
      if (window.BSIAnalytics && typeof window.BSIAnalytics.trackEvent === 'function') {
        window.BSIAnalytics.trackEvent('error', {
          type: errorData.type,
          message: errorData.message ? errorData.message.substring(0, 200) : '',
          url: window.location.href,
          timestamp: new Date().toISOString()
        });
      } else {
        // Fallback: beacon to error endpoint
        var data = JSON.stringify({
          type: errorData.type,
          message: errorData.message ? errorData.message.substring(0, 200) : '',
          url: window.location.href,
          userAgent: navigator.userAgent ? navigator.userAgent.substring(0, 100) : '',
          timestamp: new Date().toISOString()
        });
        navigator.sendBeacon('/api/analytics/error', data);
      }
    } catch (e) {
      // Silently fail - error reporting shouldn't cause more errors
    }
  }

  /**
   * Create SVG icon element
   */
  function createAlertIcon() {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'bsi-error-fallback__icon');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');

    var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '10');
    svg.appendChild(circle);

    var line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line1.setAttribute('x1', '12');
    line1.setAttribute('y1', '8');
    line1.setAttribute('x2', '12');
    line1.setAttribute('y2', '12');
    svg.appendChild(line1);

    var line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line2.setAttribute('x1', '12');
    line2.setAttribute('y1', '16');
    line2.setAttribute('x2', '12.01');
    line2.setAttribute('y2', '16');
    svg.appendChild(line2);

    return svg;
  }

  /**
   * Show fallback UI for critical errors
   */
  function showFallbackUI(errorData) {
    // Only show once per page load
    if (document.getElementById('bsi-error-fallback')) {
      return;
    }

    // Find the main content area
    var main = document.querySelector('main') || document.body;

    // Check if page appears broken (mostly empty)
    var hasContent = main.textContent.trim().length > 100;
    if (hasContent) {
      return; // Page has content, don't show fallback
    }

    // Create fallback container
    var fallback = document.createElement('div');
    fallback.id = 'bsi-error-fallback';
    fallback.className = 'bsi-error-fallback';

    // Content wrapper
    var content = document.createElement('div');
    content.className = 'bsi-error-fallback__content';

    // Icon
    content.appendChild(createAlertIcon());

    // Title
    var title = document.createElement('h2');
    title.className = 'bsi-error-fallback__title';
    title.textContent = 'Something went wrong';
    content.appendChild(title);

    // Message
    var message = document.createElement('p');
    message.className = 'bsi-error-fallback__message';
    message.textContent = 'We\'re having trouble loading this page. This has been reported automatically.';
    content.appendChild(message);

    // Retry button
    var retryBtn = document.createElement('button');
    retryBtn.className = 'bsi-error-fallback__retry btn btn-primary';
    retryBtn.textContent = 'Try Again';
    retryBtn.addEventListener('click', function() {
      location.reload();
    });
    content.appendChild(retryBtn);

    fallback.appendChild(content);

    // Inject styles
    if (!document.getElementById('bsi-error-fallback-styles')) {
      var style = document.createElement('style');
      style.id = 'bsi-error-fallback-styles';
      style.textContent = [
        '.bsi-error-fallback {',
        '  position: fixed;',
        '  inset: 0;',
        '  display: flex;',
        '  align-items: center;',
        '  justify-content: center;',
        '  background: var(--bsi-midnight, #0D0D0D);',
        '  z-index: 10000;',
        '}',
        '.bsi-error-fallback__content {',
        '  text-align: center;',
        '  padding: 2rem;',
        '  max-width: 400px;',
        '}',
        '.bsi-error-fallback__icon {',
        '  width: 64px;',
        '  height: 64px;',
        '  color: var(--bsi-burnt-orange, #BF5700);',
        '  margin-bottom: 1.5rem;',
        '}',
        '.bsi-error-fallback__title {',
        '  font-family: "Oswald", sans-serif;',
        '  font-size: 1.5rem;',
        '  color: var(--bsi-cream, #FAF8F5);',
        '  margin-bottom: 0.75rem;',
        '}',
        '.bsi-error-fallback__message {',
        '  color: rgba(250, 248, 245, 0.7);',
        '  margin-bottom: 1.5rem;',
        '  line-height: 1.6;',
        '}',
        '.bsi-error-fallback__retry {',
        '  cursor: pointer;',
        '}'
      ].join('\n');
      document.head.appendChild(style);
    }

    main.appendChild(fallback);
  }

  /**
   * Safe fetch wrapper with timeout and error handling
   * @param {string} url - URL to fetch
   * @param {object} options - Fetch options plus { timeout: ms }
   * @returns {Promise<{data: any, error: string|null, source: string}>}
   */
  async function safeFetch(url, options) {
    var timeout = (options && options.timeout) || 10000;
    var controller = new AbortController();
    var timeoutId = setTimeout(function() { controller.abort(); }, timeout);

    try {
      var fetchOptions = Object.assign({}, options || {}, { signal: controller.signal });
      delete fetchOptions.timeout;

      var response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('HTTP ' + response.status + ': ' + response.statusText);
      }

      var data = await response.json();

      return {
        data: data,
        error: null,
        source: data.source || 'api',
        fetchedAt: new Date().toISOString()
      };

    } catch (error) {
      clearTimeout(timeoutId);

      var errorMessage = 'Unable to load data';
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out';
      } else if (error.message) {
        errorMessage = error.message;
      }

      handleError({
        type: 'fetch_error',
        message: errorMessage,
        url: url
      });

      return {
        data: null,
        error: errorMessage,
        source: 'error',
        fetchedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Manual error reporting
   */
  function report(message, context) {
    handleError({
      type: 'manual',
      message: message,
      context: context
    });
  }

  // Auto-initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  return {
    init: init,
    safeFetch: safeFetch,
    report: report
  };

})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BSIErrorBoundary;
}
