/**
 * BSI Truth State Indicator
 *
 * Displays semantic validation status for datasets.
 * Three states: valid (green), invalid (red), unavailable (amber)
 *
 * Usage:
 *   BSITruthState.render({
 *     container: element,
 *     status: 'valid' | 'invalid' | 'unavailable',
 *     datasetId: 'cfb-rankings-ap',
 *     recordCount: 25,
 *     expectedMin: 25,
 *     reason: 'Valid: 25 records (min 25)'
 *   });
 */

(function(global) {
  'use strict';

  var TruthState = {
    VALID: 'valid',
    INVALID: 'invalid',
    UNAVAILABLE: 'unavailable'
  };

  var CONFIG = {
    valid: {
      color: '#2E7D32',
      bgColor: 'rgba(46, 125, 50, 0.15)',
      borderColor: 'rgba(46, 125, 50, 0.4)',
      icon: '\u2713',
      label: 'Data Verified'
    },
    invalid: {
      color: '#C62828',
      bgColor: 'rgba(198, 40, 40, 0.15)',
      borderColor: 'rgba(198, 40, 40, 0.4)',
      icon: '\u2717',
      label: 'Validation Failed'
    },
    unavailable: {
      color: '#F9A825',
      bgColor: 'rgba(249, 168, 37, 0.15)',
      borderColor: 'rgba(249, 168, 37, 0.4)',
      icon: '\u25CB',
      label: 'Data Unavailable'
    }
  };

  function clearElement(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  function createBadge(options) {
    var status = options.status || TruthState.UNAVAILABLE;
    var config = CONFIG[status] || CONFIG.unavailable;

    var badge = document.createElement('div');
    badge.className = 'bsi-truth-badge bsi-truth-' + status;
    badge.style.cssText = [
      'display: inline-flex',
      'align-items: center',
      'gap: 0.5rem',
      'padding: 0.375rem 0.75rem',
      'font-family: Oswald, sans-serif',
      'font-size: 0.75rem',
      'font-weight: 500',
      'text-transform: uppercase',
      'letter-spacing: 0.05em',
      'border-radius: 6px',
      'background: ' + config.bgColor,
      'border: 1px solid ' + config.borderColor,
      'color: ' + config.color
    ].join(';');

    var icon = document.createElement('span');
    icon.textContent = config.icon;
    icon.style.cssText = 'font-weight: bold; font-size: 0.875rem;';
    badge.appendChild(icon);

    var label = document.createElement('span');
    label.textContent = config.label;
    badge.appendChild(label);

    if (options.recordCount !== undefined && options.expectedMin !== undefined) {
      var count = document.createElement('span');
      count.style.cssText = 'opacity: 0.8; font-size: 0.65rem; margin-left: 0.25rem;';
      count.textContent = '(' + options.recordCount + '/' + options.expectedMin + ')';
      badge.appendChild(count);
    }

    if (options.reason) {
      badge.title = options.reason;
    }

    return badge;
  }

  function createErrorBanner(options) {
    var banner = document.createElement('div');
    banner.className = 'bsi-truth-error-banner';
    banner.style.cssText = [
      'padding: 1rem 1.5rem',
      'margin-bottom: 1.5rem',
      'background: rgba(198, 40, 40, 0.1)',
      'border: 1px solid rgba(198, 40, 40, 0.3)',
      'border-left: 4px solid #C62828',
      'border-radius: 6px',
      'font-family: Oswald, sans-serif'
    ].join(';');

    var header = document.createElement('div');
    header.style.cssText = [
      'display: flex',
      'align-items: center',
      'gap: 0.5rem',
      'margin-bottom: 0.5rem',
      'color: #C62828',
      'font-weight: 600',
      'font-size: 0.875rem',
      'text-transform: uppercase',
      'letter-spacing: 0.05em'
    ].join(';');
    header.textContent = '\u2717 Data Validation Failed';
    banner.appendChild(header);

    var message = document.createElement('div');
    message.style.cssText = [
      'color: rgba(250, 248, 245, 0.8)',
      'font-family: Cormorant Garamond, Georgia, serif',
      'font-size: 0.9375rem',
      'line-height: 1.5'
    ].join(';');
    message.textContent = options.reason || 'The data source returned invalid or insufficient data. This is not an empty result\u2014it indicates a data quality issue.';
    banner.appendChild(message);

    if (options.recordCount !== undefined && options.expectedMin !== undefined) {
      var stats = document.createElement('div');
      stats.style.cssText = [
        'margin-top: 0.75rem',
        'padding-top: 0.75rem',
        'border-top: 1px solid rgba(198, 40, 40, 0.2)',
        'font-family: Oswald, sans-serif',
        'font-size: 0.75rem',
        'color: rgba(250, 248, 245, 0.6)'
      ].join(';');
      stats.textContent = 'Received ' + options.recordCount + ' records, expected at least ' + options.expectedMin;
      banner.appendChild(stats);
    }

    return banner;
  }

  function createUnavailableBanner(options) {
    var banner = document.createElement('div');
    banner.className = 'bsi-truth-unavailable-banner';
    banner.style.cssText = [
      'padding: 1rem 1.5rem',
      'margin-bottom: 1.5rem',
      'background: rgba(249, 168, 37, 0.1)',
      'border: 1px solid rgba(249, 168, 37, 0.3)',
      'border-left: 4px solid #F9A825',
      'border-radius: 6px',
      'font-family: Oswald, sans-serif'
    ].join(';');

    var header = document.createElement('div');
    header.style.cssText = [
      'display: flex',
      'align-items: center',
      'gap: 0.5rem',
      'margin-bottom: 0.5rem',
      'color: #F9A825',
      'font-weight: 600',
      'font-size: 0.875rem',
      'text-transform: uppercase',
      'letter-spacing: 0.05em'
    ].join(';');
    header.textContent = '\u25CB Data Currently Unavailable';
    banner.appendChild(header);

    var message = document.createElement('div');
    message.style.cssText = [
      'color: rgba(250, 248, 245, 0.8)',
      'font-family: Cormorant Garamond, Georgia, serif',
      'font-size: 0.9375rem',
      'line-height: 1.5'
    ].join(';');
    message.textContent = options.reason || 'This dataset is not currently available. This may be due to off-season timing or scheduled data maintenance.';
    banner.appendChild(message);

    return banner;
  }

  function render(options) {
    if (!options || !options.container) {
      return null;
    }

    var container = options.container;
    clearElement(container);

    var status = options.status || TruthState.UNAVAILABLE;

    var badge = createBadge(options);
    container.appendChild(badge);

    return {
      status: status,
      update: function(newOptions) {
        render(Object.assign({}, options, newOptions, { container: container }));
      },
      destroy: function() {
        clearElement(container);
      }
    };
  }

  function renderBanner(options) {
    if (!options || !options.container) {
      return null;
    }

    var container = options.container;
    var status = options.status;
    var banner = null;

    if (status === TruthState.INVALID) {
      banner = createErrorBanner(options);
      container.insertBefore(banner, container.firstChild);
    } else if (status === TruthState.UNAVAILABLE) {
      banner = createUnavailableBanner(options);
      container.insertBefore(banner, container.firstChild);
    }

    return banner;
  }

  /**
   * Fetch semantic health status from the worker endpoint
   */
  async function fetchHealth(datasetId) {
    try {
      var response = await fetch('/api/semantic-health');
      if (!response.ok) {
        return { status: TruthState.INVALID, reason: 'Health endpoint returned ' + response.status };
      }
      var data = await response.json();

      if (datasetId && data.datasets) {
        var dataset = null;
        for (var i = 0; i < data.datasets.length; i++) {
          if (data.datasets[i].datasetId === datasetId) {
            dataset = data.datasets[i];
            break;
          }
        }
        if (dataset) {
          var reason = '';
          if (dataset.status === TruthState.VALID) {
            reason = 'Valid: ' + dataset.actualCount + ' records';
          } else if (dataset.status === TruthState.UNAVAILABLE) {
            reason = 'Data not available: ' + (dataset.inSeason ? 'Source offline' : 'Off-season');
          } else {
            reason = 'Failed: ' + dataset.actualCount + '/' + dataset.expectedMin + ' records';
          }
          return {
            status: dataset.status,
            datasetId: dataset.datasetId,
            recordCount: dataset.actualCount,
            expectedMin: dataset.expectedMin,
            reason: reason
          };
        }
      }

      var overallStatus = TruthState.INVALID;
      if (data.overallStatus === 'truth') {
        overallStatus = TruthState.VALID;
      } else if (data.overallStatus === 'partial') {
        overallStatus = TruthState.UNAVAILABLE;
      }

      return {
        status: overallStatus,
        truthScore: data.truthScore,
        reason: 'Overall truth score: ' + data.truthScore + '%'
      };
    } catch (error) {
      return {
        status: TruthState.INVALID,
        reason: 'Failed to fetch health status: ' + error.message
      };
    }
  }

  global.BSITruthState = {
    TruthState: TruthState,
    render: render,
    renderBanner: renderBanner,
    createBadge: createBadge,
    createErrorBanner: createErrorBanner,
    createUnavailableBanner: createUnavailableBanner,
    fetchHealth: fetchHealth
  };

})(typeof window !== 'undefined' ? window : this);
