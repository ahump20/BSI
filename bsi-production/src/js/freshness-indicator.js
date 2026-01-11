/**
 * BSI Data Freshness Indicator
 * Orchestration layer that combines calculator and badge modules
 * Provides backward-compatible BSIFreshness API
 *
 * Dependencies:
 *   - freshness-calculator.js (BSIFreshnessCalc)
 *   - freshness-badge.js (BSIFreshnessBadge)
 *
 * @file freshness-indicator.js
 * @version 2.0.0
 * @author Blaze Sports Intel
 * @license MIT
 */

(function(global) {
  'use strict';

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

    // Get badge module
    const badgeModule = global.BSIFreshnessBadge || {};
    const createBadge = badgeModule.createBadge || function() {
      const el = document.createElement('div');
      el.textContent = 'Loading...';
      return el;
    };

    let updateInterval = null;
    let currentBadge = null;
    const currentOptions = Object.assign({}, options);

    function render() {
      const badge = createBadge({
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
        container.textContent = '';
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
          container.textContent = '';
        }
      }
    };
  }

  // Build unified API from submodules
  const calc = global.BSIFreshnessCalc || {};
  const badge = global.BSIFreshnessBadge || {};

  // Backward-compatible BSIFreshness API
  const BSIFreshness = {
    // Rendering
    render: renderFreshnessIndicator,
    createBadge: badge.createBadge || function() { return document.createElement('div'); },
    createSkeleton: badge.createSkeleton || function() { return document.createElement('div'); },
    createError: badge.createError || function() { return document.createElement('div'); },

    // Calculations
    calculateFreshness: calc.calculate || function() { return { state: 'loading' }; },
    isBaseballSeason: calc.isBaseballSeason || function() { return false; },
    isFootballSeason: calc.isFootballSeason || function() { return false; },
    formatTimestamp: calc.formatTimestamp || function(d) { return d.toString(); },
    getSourceLabel: calc.getSourceLabel || function(s) { return s || 'BSI API'; },

    VERSION: '2.0.0'
  };

  // Initialize styles on load
  if (badge.injectStyles) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', badge.injectStyles);
    } else {
      badge.injectStyles();
    }
  }

  // Expose globally
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BSIFreshness;
  } else {
    global.BSIFreshness = BSIFreshness;
  }

})(typeof window !== 'undefined' ? window : this);
