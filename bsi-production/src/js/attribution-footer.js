/**
 * BSI Data Attribution Footer
 * Adds "Last updated" timestamp and "Powered by Highlightly" to data blocks
 *
 * Usage:
 *   BSIAttribution.append(container, { fetchedAt: '2025-01-11T15:30:00Z' });
 *   BSIAttribution.append(container, { fetchedAt: Date.now(), compact: true });
 *   BSIAttribution.update(container, { fetchedAt: new Date() });
 */

const BSIAttribution = (function() {
  'use strict';

  // Default options
  var DEFAULTS = {
    compact: false,
    dark: false,
    showTimestamp: true,
    showAttribution: true,
    timezone: 'America/Chicago'
  };

  /**
   * Format timestamp for display
   * @param {string|number|Date} timestamp - ISO string, unix ms, or Date
   * @returns {string} Formatted timestamp
   */
  function formatTimestamp(timestamp, timezone) {
    var date;
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      date = new Date();
    }

    // Format in Central Time
    try {
      return date.toLocaleString('en-US', {
        timeZone: timezone || 'America/Chicago',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }) + ' CT';
    } catch (e) {
      // Fallback for browsers without timezone support
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  }

  /**
   * Create the attribution footer element
   * @param {object} options - Configuration options
   * @returns {HTMLElement} Footer element
   */
  function createFooter(options) {
    var opts = Object.assign({}, DEFAULTS, options || {});

    var footer = document.createElement('footer');
    footer.className = 'bsi-data-footer';
    if (opts.compact) {
      footer.className += ' bsi-data-footer--compact';
    }
    if (opts.dark) {
      footer.className += ' bsi-data-footer--dark';
    }
    footer.setAttribute('role', 'contentinfo');

    // Timestamp section
    if (opts.showTimestamp && opts.fetchedAt) {
      var timestampSpan = document.createElement('span');
      timestampSpan.className = 'bsi-data-footer__timestamp';
      timestampSpan.textContent = 'Last updated: ' + formatTimestamp(opts.fetchedAt, opts.timezone);
      footer.appendChild(timestampSpan);
    }

    // Attribution section
    if (opts.showAttribution) {
      var attrSpan = document.createElement('span');
      attrSpan.className = 'bsi-data-footer__attribution';
      attrSpan.textContent = 'Powered by ';

      var link = document.createElement('a');
      link.href = 'https://highlightly.io';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Highlightly';

      attrSpan.appendChild(link);
      footer.appendChild(attrSpan);
    }

    return footer;
  }

  /**
   * Append attribution footer to a container
   * @param {HTMLElement|string} container - Container element or selector
   * @param {object} options - Configuration options
   * @returns {HTMLElement|null} The appended footer, or null if container not found
   */
  function append(container, options) {
    var el = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!el) {
      console.warn('[BSI Attribution] Container not found:', container);
      return null;
    }

    // Remove existing footer if present
    var existing = el.querySelector('.bsi-data-footer');
    if (existing) {
      existing.remove();
    }

    var footer = createFooter(options);
    el.appendChild(footer);

    return footer;
  }

  /**
   * Update an existing attribution footer's timestamp
   * @param {HTMLElement|string} container - Container element or selector
   * @param {object} options - Options with new fetchedAt value
   */
  function update(container, options) {
    var el = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!el) {
      return;
    }

    var footer = el.querySelector('.bsi-data-footer');
    if (!footer) {
      // No existing footer, create one
      append(el, options);
      return;
    }

    // Update timestamp
    var timestampSpan = footer.querySelector('.bsi-data-footer__timestamp');
    if (timestampSpan && options && options.fetchedAt) {
      timestampSpan.textContent = 'Last updated: ' + formatTimestamp(options.fetchedAt, options.timezone);
    }
  }

  /**
   * Auto-append footers to all elements with data-bsi-attribution attribute
   */
  function autoInit() {
    var elements = document.querySelectorAll('[data-bsi-attribution]');
    elements.forEach(function(el) {
      var fetchedAt = el.getAttribute('data-bsi-fetched-at');
      var compact = el.hasAttribute('data-bsi-attribution-compact');
      append(el, { fetchedAt: fetchedAt, compact: compact });
    });
  }

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  // Public API
  return {
    append: append,
    update: update,
    createFooter: createFooter,
    formatTimestamp: formatTimestamp
  };

})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BSIAttribution;
}
