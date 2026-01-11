/**
 * BSI Data State Component
 * Renders branded loading, initializing, empty, and error states
 *
 * Usage:
 *   BSIDataState.renderInitializing(container, { sport: 'college_football', message: 'First sync in progress...' });
 *   BSIDataState.renderEmpty(container, { sport: 'college_football', seasonInfo: 'The 2025 season kicks off August 30th' });
 *   BSIDataState.renderError(container, { message: 'Unable to load scores' });
 */

const BSIDataState = (function() {
  'use strict';

  // Sport display names
  const sportNames = {
    'college_football': 'College Football',
    'college_basketball': 'College Basketball',
    'cfb': 'College Football',
    'cbb': 'College Basketball',
    'ncaab': 'College Basketball',
    'mlb': 'MLB',
    'nfl': 'NFL',
    'nba': 'NBA'
  };

  // CSS for the component (injected once)
  const styles = `
    .bsi-data-state {
      text-align: center;
      padding: 4rem 2rem;
      min-height: 300px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .bsi-data-state__icon {
      width: 64px;
      height: 64px;
      margin-bottom: 1.5rem;
      opacity: 0.7;
    }

    .bsi-data-state__title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.5rem;
      font-weight: 600;
      color: rgba(250, 248, 245, 0.9);
      margin-bottom: 0.75rem;
    }

    .bsi-data-state__message {
      font-family: 'Source Serif 4', Georgia, serif;
      font-size: 1rem;
      color: rgba(250, 248, 245, 0.6);
      max-width: 400px;
      line-height: 1.6;
    }

    .bsi-data-state__meta {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 0.75rem;
      color: rgba(250, 248, 245, 0.4);
      margin-top: 1.5rem;
    }

    /* Initializing state - pulsing animation */
    .bsi-data-state--initializing .bsi-data-state__icon {
      animation: bsi-pulse 2s ease-in-out infinite;
    }

    .bsi-data-state--initializing .bsi-data-state__title {
      color: #BF5700;
    }

    /* bsi-pulse keyframes now in src/css/animations.css */

    /* Loading spinner */
    .bsi-data-state__spinner {
      width: 48px;
      height: 48px;
      border: 3px solid rgba(191, 87, 0, 0.2);
      border-top-color: #BF5700;
      border-radius: 50%;
      animation: bsi-spin 1s linear infinite;
      margin-bottom: 1.5rem;
    }

    /* bsi-spin keyframes now in src/css/animations.css */

    /* Empty state */
    .bsi-data-state--empty .bsi-data-state__icon {
      opacity: 0.4;
    }

    /* Error state */
    .bsi-data-state--error .bsi-data-state__title {
      color: #C62828;
    }

    .bsi-data-state--error .bsi-data-state__icon {
      color: #C62828;
      opacity: 0.6;
    }
  `;

  // Load shared animations CSS
  function loadAnimationsCSS() {
    if (document.getElementById('bsi-animations-css')) return;
    const link = document.createElement('link');
    link.id = 'bsi-animations-css';
    link.rel = 'stylesheet';
    link.href = '/src/css/animations.css';
    document.head.appendChild(link);
  }

  // Inject styles once
  let stylesInjected = false;
  function injectStyles() {
    if (stylesInjected) return;
    loadAnimationsCSS();
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
    stylesInjected = true;
  }

  /**
   * Create state container with icon, title, message
   * Uses DOM methods to avoid innerHTML security warnings
   */
  function createStateElement(stateClass, iconSvg, title, message, meta) {
    const wrapper = document.createElement('div');
    wrapper.className = 'bsi-data-state ' + stateClass;

    // Icon container
    const iconDiv = document.createElement('div');
    iconDiv.className = 'bsi-data-state__icon';
    // Safe: iconSvg is from our controlled constants, not user input
    iconDiv.innerHTML = iconSvg;
    wrapper.appendChild(iconDiv);

    // Title
    const h3 = document.createElement('h3');
    h3.className = 'bsi-data-state__title';
    h3.textContent = title;
    wrapper.appendChild(h3);

    // Message
    const p = document.createElement('p');
    p.className = 'bsi-data-state__message';
    p.textContent = message;
    wrapper.appendChild(p);

    // Optional meta
    if (meta) {
      const metaP = document.createElement('p');
      metaP.className = 'bsi-data-state__meta';
      metaP.textContent = meta;
      wrapper.appendChild(metaP);
    }

    return wrapper;
  }

  // SVG icons (controlled content, safe for innerHTML)
  const icons = {
    initializing: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: #BF5700;"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>',
    empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: rgba(250,248,245,0.5);"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: #C62828;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
  };

  /**
   * Render an initializing state (data sync in progress)
   */
  function renderInitializing(container, options) {
    options = options || {};
    injectStyles();
    const sport = options.sport;
    const message = options.message;
    const meta = options.meta;
    const sportName = sportNames[sport] || sport || 'Data';

    container.textContent = '';
    container.appendChild(createStateElement(
      'bsi-data-state--initializing',
      icons.initializing,
      sportName + ' Data Initializing',
      message || 'Our data pipeline is syncing the latest scores. This typically takes less than a minute.',
      meta
    ));
  }

  /**
   * Render an empty state (no data available, e.g., offseason)
   */
  function renderEmpty(container, options) {
    options = options || {};
    injectStyles();
    const sport = options.sport;
    const seasonInfo = options.seasonInfo;
    const title = options.title;
    const sportName = sportNames[sport] || sport || 'Sport';

    container.textContent = '';
    container.appendChild(createStateElement(
      'bsi-data-state--empty',
      icons.empty,
      title || 'No Games Scheduled',
      seasonInfo || ('Check back soon for upcoming ' + sportName + ' games.'),
      null
    ));
  }

  /**
   * Render an error state
   */
  function renderError(container, options) {
    options = options || {};
    injectStyles();
    const message = options.message;
    const retry = options.retry;

    container.textContent = '';
    container.appendChild(createStateElement(
      'bsi-data-state--error',
      icons.error,
      'Unable to Load Data',
      message || 'There was a problem loading the data. Please try again in a moment.',
      retry ? 'Retrying automatically...' : null
    ));
  }

  /**
   * Render a loading state with spinner
   */
  function renderLoading(container, options) {
    options = options || {};
    injectStyles();
    const message = options.message;

    const wrapper = document.createElement('div');
    wrapper.className = 'bsi-data-state bsi-data-state--loading';

    const spinner = document.createElement('div');
    spinner.className = 'bsi-data-state__spinner';
    wrapper.appendChild(spinner);

    const p = document.createElement('p');
    p.className = 'bsi-data-state__message';
    p.textContent = message || 'Loading...';
    wrapper.appendChild(p);

    container.textContent = '';
    container.appendChild(wrapper);
  }

  /**
   * Check API response and render appropriate state if needed
   * Returns true if a state was rendered, false if data is valid
   */
  function handleResponse(container, response, options) {
    options = options || {};
    const sport = options.sport;

    // Check for empty data
    if (!response || !response.data || response.data.length === 0) {
      if (response && response.status === 'cached') {
        // Cached but empty - show initializing
        renderInitializing(container, {
          sport: sport,
          message: 'Data is being synchronized. Check back in a moment.',
          meta: response.lastUpdated ? ('Last sync: ' + formatTimestamp(response.lastUpdated)) : null
        });
        return true;
      }

      // Check if we're in offseason
      const month = new Date().getMonth(); // 0-11
      if (sport === 'college_football' || sport === 'cfb') {
        if (month >= 1 && month <= 7) { // Feb-Aug
          renderEmpty(container, {
            sport: sport,
            seasonInfo: 'The 2025 college football season kicks off August 30th. Check back for preseason rankings and schedules.',
            title: 'Offseason'
          });
          return true;
        }
      }

      if (sport === 'college_basketball' || sport === 'cbb' || sport === 'ncaab') {
        if (month >= 4 && month <= 9) { // May-Oct
          renderEmpty(container, {
            sport: sport,
            seasonInfo: 'College basketball returns in November. Check back for preseason rankings and schedules.',
            title: 'Offseason'
          });
          return true;
        }
      }

      // Generic empty state
      renderEmpty(container, { sport: sport });
      return true;
    }

    // Check for error status
    if (response.status === 'error' || response.error) {
      renderError(container, {
        message: response.error || 'An error occurred while loading data.'
      });
      return true;
    }

    // Data is valid
    return false;
  }

  /**
   * Format ISO timestamp to readable string
   */
  function formatTimestamp(isoString) {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    } catch (e) {
      return isoString;
    }
  }

  // Public API
  return {
    renderInitializing: renderInitializing,
    renderEmpty: renderEmpty,
    renderError: renderError,
    renderLoading: renderLoading,
    handleResponse: handleResponse,
    formatTimestamp: formatTimestamp
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BSIDataState;
}
