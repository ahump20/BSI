/**
 * BSI Data Freshness Indicator
 * Displays real-time data freshness status with color-coded badges
 *
 * @file freshness-indicator.js
 * @version 1.0.0
 * @author Blaze Sports Intel
 * @license MIT
 */

(function(global) {
  'use strict';

  // BSI Brand Colors for freshness states
  const FRESHNESS_CONFIG = {
    fresh: {
      color: '#2E7D32',      // BSI Success Green
      label: 'Fresh',
      maxAgeMinutes: 120     // <2 hours
    },
    stale: {
      color: '#F9A825',      // BSI Warning Yellow
      label: 'Stale',
      maxAgeMinutes: 720     // 2-12 hours
    },
    outdated: {
      color: '#C62828',      // BSI Error Red
      label: 'Outdated',
      maxAgeMinutes: Infinity // >12 hours
    },
    live: {
      color: '#2E7D32',      // BSI Success Green
      label: 'Live',
      pulseAnimation: true
    },
    loading: {
      color: 'rgba(250, 248, 245, 0.4)',
      label: 'Loading...'
    },
    error: {
      color: '#C62828',
      label: 'Error'
    }
  };

  // Timezone configuration
  const TIMEZONE = 'America/Chicago';

  /**
   * Calculate the freshness state based on last sync time
   * @param {Date|string|number} lastSync - The last sync timestamp
   * @returns {Object} Freshness state object with color, label, and age info
   */
  function calculateFreshness(lastSync) {
    if (!lastSync) {
      return {
        state: 'loading',
        color: FRESHNESS_CONFIG.loading.color,
        label: FRESHNESS_CONFIG.loading.label,
        ageMinutes: null,
        ageText: null
      };
    }

    const syncDate = lastSync instanceof Date ? lastSync : new Date(lastSync);
    const now = new Date();
    const ageMs = now.getTime() - syncDate.getTime();
    const ageMinutes = Math.floor(ageMs / 60000);

    let state, config;
    if (ageMinutes < FRESHNESS_CONFIG.fresh.maxAgeMinutes) {
      state = 'fresh';
      config = FRESHNESS_CONFIG.fresh;
    } else if (ageMinutes < FRESHNESS_CONFIG.stale.maxAgeMinutes) {
      state = 'stale';
      config = FRESHNESS_CONFIG.stale;
    } else {
      state = 'outdated';
      config = FRESHNESS_CONFIG.outdated;
    }

    return {
      state: state,
      color: config.color,
      label: config.label,
      ageMinutes: ageMinutes,
      ageText: formatAgeText(ageMinutes),
      syncTimestamp: syncDate.toISOString(),
      syncFormatted: formatTimestamp(syncDate)
    };
  }

  /**
   * Format age in human-readable text
   * @param {number} minutes - Age in minutes
   * @returns {string} Formatted age string
   */
  function formatAgeText(minutes) {
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return minutes + ' minutes ago';

    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return hours + ' hours ago';

    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    return days + ' days ago';
  }

  /**
   * Format timestamp in America/Chicago timezone
   * @param {Date} date - Date object
   * @returns {string} Formatted timestamp string
   */
  function formatTimestamp(date) {
    return date.toLocaleString('en-US', {
      timeZone: TIMEZONE,
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    });
  }

  /**
   * Check if currently in baseball season (Feb-June)
   * @returns {boolean} True if in baseball season
   */
  function isBaseballSeason() {
    const month = new Date().getMonth() + 1; // 1-12
    return month >= 2 && month <= 6;
  }

  /**
   * Check if currently in football season (Aug-Jan)
   * @returns {boolean} True if in football season
   */
  function isFootballSeason() {
    const month = new Date().getMonth() + 1;
    return month >= 8 || month <= 1;
  }

  /**
   * Determine the data source label
   * @param {string} source - Source identifier (d1, espn, sportsdata, etc.)
   * @returns {string} Formatted source label
   */
  function getSourceLabel(source) {
    const sources = {
      'd1': 'D1Baseball',
      'd1baseball': 'D1Baseball',
      'espn': 'ESPN',
      'sportsdata': 'SportsDataIO',
      'highlightly': 'Highlightly Pro',
      'highlightly pro': 'Highlightly Pro',
      'mlb': 'MLB StatsAPI',
      'ncaa': 'NCAA',
      'api': 'BSI API'
    };
    const srcLower = source ? source.toLowerCase() : '';
    return sources[srcLower] || source || 'BSI API';
  }

  /**
   * Calculate next expected update time based on sport and state
   * @param {string} sport - Sport identifier
   * @param {boolean} isLive - Whether there are live games
   * @returns {string} Next update time description
   */
  function getNextUpdateTime(sport, isLive) {
    if (isLive) {
      return 'Every 15-30 seconds';
    }

    const intervals = {
      'baseball': isBaseballSeason() ? 'Every 5 minutes' : 'Every 30 minutes',
      'football': isFootballSeason() ? 'Every 5 minutes' : 'Every 30 minutes',
      'basketball': 'Every 5 minutes',
      'default': 'Every 15 minutes'
    };

    const sportLower = sport ? sport.toLowerCase() : '';
    return intervals[sportLower] || intervals.default;
  }

  /**
   * Create the freshness badge HTML element
   * @param {Object} options - Configuration options
   * @param {Date|string} options.lastSync - Last sync timestamp
   * @param {string} [options.source] - Data source identifier
   * @param {string} [options.sport] - Sport type
   * @param {boolean} [options.isLive] - Whether there are live games
   * @param {boolean} [options.showTooltip=true] - Whether to show tooltip on hover
   * @param {string} [options.size='default'] - Badge size (small, default, large)
   * @returns {HTMLElement} The freshness badge element
   */
  function createFreshnessBadge(options) {
    options = options || {};
    let freshness = calculateFreshness(options.lastSync);
    const isLive = options.isLive || false;
    const showTooltip = options.showTooltip !== false;
    const size = options.size || 'default';

    // If live games exist, use live state
    if (isLive && freshness.state !== 'loading') {
      freshness.state = 'live';
      freshness.color = FRESHNESS_CONFIG.live.color;
      freshness.label = 'Live';
    }

    // Create container
    const badge = document.createElement('div');
    badge.className = 'bsi-freshness-badge bsi-freshness-' + freshness.state + ' bsi-freshness-' + size;
    badge.setAttribute('data-freshness-state', freshness.state);
    badge.setAttribute('data-last-sync', options.lastSync || '');
    badge.setAttribute('role', 'status');
    badge.setAttribute('aria-label', 'Data freshness: ' + (freshness.ageText || freshness.label));

    // Set styles
    const padding = size === 'small' ? '0.2rem 0.5rem' : (size === 'large' ? '0.4rem 1rem' : '0.25rem 0.75rem');
    const fontSize = size === 'small' ? '0.65rem' : (size === 'large' ? '0.85rem' : '0.75rem');

    badge.style.cssText = [
      'display: inline-flex',
      'align-items: center',
      'gap: 0.4rem',
      'padding: ' + padding,
      'background: ' + freshness.color,
      'border-radius: 4px',
      'font-family: "IBM Plex Mono", "Courier New", monospace',
      'font-size: ' + fontSize,
      'font-weight: 500',
      'color: white',
      'position: relative',
      'cursor: help',
      'transition: transform 0.15s ease, box-shadow 0.15s ease'
    ].join(';');

    // Pulse dot for live state
    if (isLive) {
      const dot = document.createElement('span');
      dot.style.cssText = [
        'width: 6px',
        'height: 6px',
        'background: white',
        'border-radius: 50%',
        'animation: bsi-pulse 1.5s infinite'
      ].join(';');
      badge.appendChild(dot);
    }

    // Label text
    const labelText = document.createElement('span');
    const displayText = isLive ? 'Live' : (freshness.ageText || freshness.label);
    labelText.textContent = displayText;
    badge.appendChild(labelText);

    // Tooltip
    if (showTooltip && freshness.state !== 'loading') {
      const tooltip = document.createElement('div');
      tooltip.className = 'bsi-freshness-tooltip';
      tooltip.style.cssText = [
        'position: absolute',
        'bottom: calc(100% + 8px)',
        'left: 50%',
        'transform: translateX(-50%)',
        'background: #1A1A1A',
        'border: 1px solid rgba(191, 87, 0, 0.3)',
        'border-radius: 8px',
        'padding: 0.75rem 1rem',
        'min-width: 200px',
        'font-family: "IBM Plex Sans", sans-serif',
        'font-size: 0.75rem',
        'font-weight: 400',
        'color: #FAF8F5',
        'box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4)',
        'opacity: 0',
        'visibility: hidden',
        'transition: opacity 0.2s, visibility 0.2s',
        'z-index: 1000',
        'white-space: nowrap',
        'pointer-events: none'
      ].join(';');

      // Tooltip content
      let tooltipHTML = '';

      // Sync timestamp
      if (freshness.syncFormatted) {
        tooltipHTML += '<div style="margin-bottom: 0.5rem;"><strong style="color: rgba(250,248,245,0.6);">Last Sync:</strong><br>' + freshness.syncFormatted + '</div>';
      }

      // Data source
      const sourceLabel = getSourceLabel(options.source);
      tooltipHTML += '<div style="margin-bottom: 0.5rem;"><strong style="color: rgba(250,248,245,0.6);">Source:</strong> ' + sourceLabel + '</div>';

      // Next update
      const nextUpdate = getNextUpdateTime(options.sport, isLive);
      tooltipHTML += '<div><strong style="color: rgba(250,248,245,0.6);">Updates:</strong> ' + nextUpdate + '</div>';

      tooltip.innerHTML = tooltipHTML;

      // Tooltip arrow
      const arrow = document.createElement('div');
      arrow.style.cssText = [
        'position: absolute',
        'bottom: -6px',
        'left: 50%',
        'transform: translateX(-50%)',
        'width: 0',
        'height: 0',
        'border-left: 6px solid transparent',
        'border-right: 6px solid transparent',
        'border-top: 6px solid #1A1A1A'
      ].join(';');
      tooltip.appendChild(arrow);

      badge.appendChild(tooltip);

      // Hover handlers
      badge.addEventListener('mouseenter', function() {
        tooltip.style.opacity = '1';
        tooltip.style.visibility = 'visible';
        badge.style.transform = 'scale(1.05)';
      });
      badge.addEventListener('mouseleave', function() {
        tooltip.style.opacity = '0';
        tooltip.style.visibility = 'hidden';
        badge.style.transform = 'scale(1)';
      });
    }

    return badge;
  }

  /**
   * Render freshness indicator into a container
   * @param {Object} options - Render options
   * @param {string|HTMLElement} options.container - Container selector or element
   * @param {Date|string} options.lastSync - Last sync timestamp
   * @param {string} [options.source] - Data source identifier
   * @param {string} [options.sport] - Sport type
   * @param {boolean} [options.isLive] - Whether there are live games
   * @param {boolean} [options.showTooltip=true] - Whether to show tooltip
   * @param {string} [options.size] - Badge size
   * @param {boolean} [options.autoUpdate=true] - Whether to auto-update every minute
   * @returns {Object} Controller object with update and destroy methods
   */
  function renderFreshnessIndicator(options) {
    const container = typeof options.container === 'string'
      ? document.querySelector(options.container)
      : options.container;

    if (!container) {
      console.warn('BSI Freshness: Container not found', options.container);
      return null;
    }

    let updateInterval = null;
    let currentBadge = null;
    const currentOptions = Object.assign({}, options);

    function render() {
      const badge = createFreshnessBadge({
        lastSync: currentOptions.lastSync,
        source: currentOptions.source,
        sport: currentOptions.sport,
        isLive: currentOptions.isLive,
        showTooltip: currentOptions.showTooltip,
        size: currentOptions.size
      });

      if (currentBadge && container.contains(currentBadge)) {
        container.replaceChild(badge, currentBadge);
      } else {
        container.innerHTML = '';
        container.appendChild(badge);
      }
      currentBadge = badge;
    }

    // Initial render
    render();

    // Auto-update every minute if enabled
    if (currentOptions.autoUpdate !== false && currentOptions.lastSync) {
      updateInterval = setInterval(render, 60000);
    }

    // Return controller
    return {
      update: function(newOptions) {
        if (newOptions.lastSync !== undefined) currentOptions.lastSync = newOptions.lastSync;
        if (newOptions.isLive !== undefined) currentOptions.isLive = newOptions.isLive;
        if (newOptions.source !== undefined) currentOptions.source = newOptions.source;
        render();
      },
      destroy: function() {
        if (updateInterval) {
          clearInterval(updateInterval);
        }
        if (container) {
          container.innerHTML = '';
        }
      }
    };
  }

  /**
   * Create skeleton loader for data loading states
   * @param {Object} options - Skeleton options
   * @param {string} [options.type='table'] - Type of skeleton (table, card, text)
   * @param {number} [options.rows=5] - Number of rows for table skeleton
   * @param {number} [options.cols=4] - Number of columns for table skeleton
   * @returns {HTMLElement} Skeleton loader element
   */
  function createSkeletonLoader(options) {
    options = options || {};
    const type = options.type || 'table';
    const rows = options.rows || 5;
    const cols = options.cols || 4;

    const skeleton = document.createElement('div');
    skeleton.className = 'bsi-skeleton-loader';
    skeleton.setAttribute('role', 'status');
    skeleton.setAttribute('aria-label', 'Loading content');

    if (type === 'table') {
      const table = document.createElement('div');
      table.style.cssText = 'display: flex; flex-direction: column; gap: 0.5rem;';

      for (let i = 0; i < rows; i++) {
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; gap: 1rem; padding: 0.75rem; background: var(--bsi-charcoal, #1A1A1A); border-radius: 4px;';

        for (let j = 0; j < cols; j++) {
          const cell = document.createElement('div');
          cell.style.cssText = [
            'flex: ' + (j === 0 ? '0 0 30%' : '1'),
            'height: 1rem',
            'background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
            'background-size: 200% 100%',
            'animation: bsi-shimmer 1.5s infinite',
            'border-radius: 4px'
          ].join(';');
          row.appendChild(cell);
        }
        table.appendChild(row);
      }
      skeleton.appendChild(table);
    } else if (type === 'card') {
      skeleton.style.cssText = [
        'background: var(--bsi-charcoal, #1A1A1A)',
        'border-radius: 12px',
        'padding: 1.5rem',
        'min-height: 200px'
      ].join(';');

      const title = document.createElement('div');
      title.style.cssText = [
        'width: 60%',
        'height: 1.5rem',
        'background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
        'background-size: 200% 100%',
        'animation: bsi-shimmer 1.5s infinite',
        'border-radius: 4px',
        'margin-bottom: 1rem'
      ].join(';');
      skeleton.appendChild(title);

      for (let k = 0; k < 3; k++) {
        const line = document.createElement('div');
        line.style.cssText = [
          'width: ' + (100 - k * 15) + '%',
          'height: 1rem',
          'background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
          'background-size: 200% 100%',
          'animation: bsi-shimmer 1.5s infinite',
          'border-radius: 4px',
          'margin-bottom: 0.75rem'
        ].join(';');
        skeleton.appendChild(line);
      }
    }

    return skeleton;
  }

  /**
   * Create error state element
   * @param {Object} options - Error options
   * @param {string} [options.message='Unable to load data'] - Error message
   * @param {Function} [options.onRetry] - Retry callback
   * @returns {HTMLElement} Error state element
   */
  function createErrorState(options) {
    options = options || {};
    const message = options.message || 'Unable to load data. Please try again.';

    const error = document.createElement('div');
    error.className = 'bsi-error-state';
    error.style.cssText = [
      'background: rgba(198, 40, 40, 0.1)',
      'border: 1px solid #C62828',
      'border-radius: 8px',
      'padding: 1.5rem',
      'text-align: center',
      'font-family: "IBM Plex Sans", sans-serif'
    ].join(';');

    const icon = document.createElement('div');
    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C62828" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
    icon.style.marginBottom = '0.75rem';
    error.appendChild(icon);

    const msgEl = document.createElement('p');
    msgEl.textContent = message;
    msgEl.style.cssText = 'color: #FAF8F5; margin: 0 0 1rem;';
    error.appendChild(msgEl);

    if (options.onRetry) {
      const btn = document.createElement('button');
      btn.textContent = 'Try Again';
      btn.style.cssText = [
        'background: #BF5700',
        'border: none',
        'border-radius: 4px',
        'padding: 0.5rem 1.5rem',
        'color: white',
        'font-family: "IBM Plex Sans", sans-serif',
        'font-weight: 500',
        'cursor: pointer',
        'transition: background 0.2s'
      ].join(';');
      btn.addEventListener('click', options.onRetry);
      btn.addEventListener('mouseenter', function() { this.style.background = '#FF6B35'; });
      btn.addEventListener('mouseleave', function() { this.style.background = '#BF5700'; });
      error.appendChild(btn);
    }

    return error;
  }

  /**
   * Inject required CSS animations
   */
  // Load shared animations CSS
  function loadAnimationsCSS() {
    if (document.getElementById('bsi-animations-css')) return;
    const link = document.createElement('link');
    link.id = 'bsi-animations-css';
    link.rel = 'stylesheet';
    link.href = '/src/css/animations.css';
    document.head.appendChild(link);
  }

  function injectStyles() {
    if (document.getElementById('bsi-freshness-styles')) return;
    loadAnimationsCSS();

    const style = document.createElement('style');
    style.id = 'bsi-freshness-styles';
    style.textContent = [
      '.bsi-freshness-badge:focus {',
      '  outline: 2px solid #BF5700;',
      '  outline-offset: 2px;',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  // Initialize styles on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectStyles);
  } else {
    injectStyles();
  }

  // Export API
  const BSIFreshness = {
    render: renderFreshnessIndicator,
    createBadge: createFreshnessBadge,
    createSkeleton: createSkeletonLoader,
    createError: createErrorState,
    calculateFreshness: calculateFreshness,
    isBaseballSeason: isBaseballSeason,
    isFootballSeason: isFootballSeason,
    formatTimestamp: formatTimestamp,
    getSourceLabel: getSourceLabel,
    VERSION: '1.0.0'
  };

  // Expose globally
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BSIFreshness;
  } else {
    global.BSIFreshness = BSIFreshness;
  }

})(typeof window !== 'undefined' ? window : this);
