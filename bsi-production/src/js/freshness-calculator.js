/**
 * BSI Freshness Calculator
 * Pure calculation functions for data freshness status
 * No DOM manipulation - these are portable utilities
 *
 * @file freshness-calculator.js
 * @version 1.0.0
 */

(function(global) {
  'use strict';

  // Freshness state thresholds
  const FRESHNESS_THRESHOLDS = {
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
      color: '#2E7D32',
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
        color: FRESHNESS_THRESHOLDS.loading.color,
        label: FRESHNESS_THRESHOLDS.loading.label,
        ageMinutes: null,
        ageText: null
      };
    }

    const syncDate = lastSync instanceof Date ? lastSync : new Date(lastSync);
    const now = new Date();
    const ageMs = now.getTime() - syncDate.getTime();
    const ageMinutes = Math.floor(ageMs / 60000);

    let state, config;
    if (ageMinutes < FRESHNESS_THRESHOLDS.fresh.maxAgeMinutes) {
      state = 'fresh';
      config = FRESHNESS_THRESHOLDS.fresh;
    } else if (ageMinutes < FRESHNESS_THRESHOLDS.stale.maxAgeMinutes) {
      state = 'stale';
      config = FRESHNESS_THRESHOLDS.stale;
    } else {
      state = 'outdated';
      config = FRESHNESS_THRESHOLDS.outdated;
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

  // Export API
  const BSIFreshnessCalc = {
    THRESHOLDS: FRESHNESS_THRESHOLDS,
    TIMEZONE: TIMEZONE,
    calculate: calculateFreshness,
    formatAge: formatAgeText,
    formatTimestamp: formatTimestamp,
    isBaseballSeason: isBaseballSeason,
    isFootballSeason: isFootballSeason,
    getSourceLabel: getSourceLabel,
    getNextUpdateTime: getNextUpdateTime,
    VERSION: '1.0.0'
  };

  // Expose globally
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BSIFreshnessCalc;
  } else {
    global.BSIFreshnessCalc = BSIFreshnessCalc;
  }

})(typeof window !== 'undefined' ? window : this);
