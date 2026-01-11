/**
 * BSI Freshness Badge
 * DOM creation functions for freshness indicators, skeletons, and error states
 * Depends on: freshness-calculator.js
 *
 * @file freshness-badge.js
 * @version 1.0.0
 */

(function(global) {
  'use strict';

  // Load shared animations CSS
  function loadAnimationsCSS() {
    if (document.getElementById('bsi-animations-css')) return;
    const link = document.createElement('link');
    link.id = 'bsi-animations-css';
    link.rel = 'stylesheet';
    link.href = '/src/css/animations.css';
    document.head.appendChild(link);
  }

  let stylesInjected = false;
  function injectStyles() {
    if (stylesInjected) return;
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
    stylesInjected = true;
  }

  /**
   * Create SVG error icon using safe DOM methods
   * @returns {HTMLElement} SVG container
   */
  function createErrorIcon() {
    const container = document.createElement('div');
    container.style.marginBottom = '0.75rem';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '32');
    svg.setAttribute('height', '32');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', '#C62828');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '10');
    svg.appendChild(circle);

    const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line1.setAttribute('x1', '12');
    line1.setAttribute('y1', '8');
    line1.setAttribute('x2', '12');
    line1.setAttribute('y2', '12');
    svg.appendChild(line1);

    const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line2.setAttribute('x1', '12');
    line2.setAttribute('y1', '16');
    line2.setAttribute('x2', '12.01');
    line2.setAttribute('y2', '16');
    svg.appendChild(line2);

    container.appendChild(svg);
    return container;
  }

  /**
   * Create tooltip content using safe DOM methods
   * @param {Object} freshness - Freshness state object
   * @param {string} source - Data source
   * @param {string} sport - Sport type
   * @param {boolean} isLive - Whether live
   * @returns {DocumentFragment} Tooltip content fragment
   */
  function createTooltipContent(freshness, source, sport, isLive) {
    const calc = global.BSIFreshnessCalc || {};
    const getSourceLabel = calc.getSourceLabel || function(s) { return s || 'BSI API'; };
    const getNextUpdateTime = calc.getNextUpdateTime || function() { return 'Every 15 minutes'; };

    const fragment = document.createDocumentFragment();

    // Sync timestamp
    if (freshness.syncFormatted) {
      const syncDiv = document.createElement('div');
      syncDiv.style.marginBottom = '0.5rem';
      const syncLabel = document.createElement('strong');
      syncLabel.style.color = 'rgba(250,248,245,0.6)';
      syncLabel.textContent = 'Last Sync:';
      syncDiv.appendChild(syncLabel);
      syncDiv.appendChild(document.createElement('br'));
      syncDiv.appendChild(document.createTextNode(freshness.syncFormatted));
      fragment.appendChild(syncDiv);
    }

    // Data source
    const sourceDiv = document.createElement('div');
    sourceDiv.style.marginBottom = '0.5rem';
    const sourceLabel = document.createElement('strong');
    sourceLabel.style.color = 'rgba(250,248,245,0.6)';
    sourceLabel.textContent = 'Source: ';
    sourceDiv.appendChild(sourceLabel);
    sourceDiv.appendChild(document.createTextNode(getSourceLabel(source)));
    fragment.appendChild(sourceDiv);

    // Next update
    const updateDiv = document.createElement('div');
    const updateLabel = document.createElement('strong');
    updateLabel.style.color = 'rgba(250,248,245,0.6)';
    updateLabel.textContent = 'Updates: ';
    updateDiv.appendChild(updateLabel);
    updateDiv.appendChild(document.createTextNode(getNextUpdateTime(sport, isLive)));
    fragment.appendChild(updateDiv);

    return fragment;
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
    injectStyles();
    options = options || {};

    // Get calculator functions from global
    const calc = global.BSIFreshnessCalc || {};
    const calculateFreshness = calc.calculate || function() { return { state: 'loading', color: 'rgba(250,248,245,0.4)', label: 'Loading...' }; };
    const THRESHOLDS = calc.THRESHOLDS || { live: { color: '#2E7D32' } };

    let freshness = calculateFreshness(options.lastSync);
    const isLive = options.isLive || false;
    const showTooltip = options.showTooltip !== false;
    const size = options.size || 'default';

    // If live games exist, use live state
    if (isLive && freshness.state !== 'loading') {
      freshness.state = 'live';
      freshness.color = THRESHOLDS.live.color;
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

      // Tooltip content using safe DOM methods
      tooltip.appendChild(createTooltipContent(freshness, options.source, options.sport, isLive));

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
   * Create skeleton loader for data loading states
   * @param {Object} options - Skeleton options
   * @param {string} [options.type='table'] - Type of skeleton (table, card, text)
   * @param {number} [options.rows=5] - Number of rows for table skeleton
   * @param {number} [options.cols=4] - Number of columns for table skeleton
   * @returns {HTMLElement} Skeleton loader element
   */
  function createSkeletonLoader(options) {
    injectStyles();
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

    // Use safe DOM method for icon
    error.appendChild(createErrorIcon());

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

  // Export API
  const BSIFreshnessBadge = {
    createBadge: createFreshnessBadge,
    createSkeleton: createSkeletonLoader,
    createError: createErrorState,
    injectStyles: injectStyles,
    VERSION: '1.0.0'
  };

  // Expose globally
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BSIFreshnessBadge;
  } else {
    global.BSIFreshnessBadge = BSIFreshnessBadge;
  }

})(typeof window !== 'undefined' ? window : this);
