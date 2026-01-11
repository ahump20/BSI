/**
 * BSI Upgrade CTA - Content Gating UI
 * Shows upgrade prompts when API returns gated content
 */
(function() {
  'use strict';

  window.BSIUpgrade = {
    /**
     * Create and display upgrade CTA
     * @param {HTMLElement} container - Container to append CTA to
     * @param {Object} options - Configuration options
     * @param {number} options.totalItems - Total items available
     * @param {number} options.shownItems - Items shown in preview
     * @param {string} options.itemType - Type of content (games, players, teams)
     * @param {string} options.ctaSource - Source for analytics tracking
     */
    show: function(container, options) {
      if (!container) return;

      const opts = options || {};
      const totalItems = opts.totalItems || 0;
      const shownItems = opts.shownItems || 0;
      const itemType = opts.itemType || 'items';
      const ctaSource = opts.ctaSource || 'upgrade_cta';

      // Remove existing CTA if present
      const existing = container.querySelector('.upgrade-cta');
      if (existing) existing.remove();

      // Build CTA using safe DOM methods
      const cta = document.createElement('div');
      cta.className = 'upgrade-cta';

      // Header
      const h3 = document.createElement('h3');
      h3.textContent = 'Unlock ';
      const span = document.createElement('span');
      span.textContent = 'Full Access';
      h3.appendChild(span);
      cta.appendChild(h3);

      // Count indicator
      if (totalItems > 0 && shownItems > 0) {
        const countP = document.createElement('p');
        countP.className = 'game-count';
        countP.textContent = 'Showing ';
        const strong1 = document.createElement('strong');
        strong1.textContent = shownItems;
        countP.appendChild(strong1);
        countP.appendChild(document.createTextNode(' of '));
        const strong2 = document.createElement('strong');
        strong2.textContent = totalItems;
        countP.appendChild(strong2);
        countP.appendChild(document.createTextNode(' ' + itemType));
        cta.appendChild(countP);
      }

      // Description
      const descP = document.createElement('p');
      descP.textContent = 'Get complete college baseball coverage—every game, every score, every stat that matters.';
      cta.appendChild(descP);

      // CTA Button
      const btn = document.createElement('a');
      btn.href = '/pricing';
      btn.className = 'upgrade-btn';
      btn.setAttribute('data-track-cta', ctaSource);
      btn.textContent = 'Upgrade to Pro — $29/mo';
      cta.appendChild(btn);

      // Features list
      const features = document.createElement('div');
      features.className = 'upgrade-features';
      const featureList = ['All D1 Games', 'Live Updates', 'Box Scores', 'Transfer Portal'];
      featureList.forEach(function(text) {
        const feat = document.createElement('div');
        feat.className = 'upgrade-feature';
        const check = document.createElement('span');
        check.textContent = '✓';
        check.style.color = '#22c55e';
        check.style.marginRight = '4px';
        feat.appendChild(check);
        feat.appendChild(document.createTextNode(text));
        features.appendChild(feat);
      });
      cta.appendChild(features);

      container.appendChild(cta);

      // Track impression
      if (window.BSIAnalytics && typeof BSIAnalytics.trackCTA === 'function') {
        BSIAnalytics.trackCTA(ctaSource + '_impression', '/pricing');
      }

      return cta;
    },

    /**
     * Check API response for gating and show CTA if needed
     * @param {Object} data - API response data
     * @param {HTMLElement} container - Container element
     * @param {string} itemType - Type of items
     * @param {string} ctaSource - Analytics source
     */
    checkAndShow: function(data, container, itemType, ctaSource) {
      if (data && data.upgradeRequired && data.preview) {
        const items = data.data || data.games || data.players || data.teams || [];
        const total = data.totalCount || data.totalGames || (items.length + 10);
        this.show(container, {
          totalItems: total,
          shownItems: items.length,
          itemType: itemType || 'items',
          ctaSource: ctaSource || 'upgrade_cta'
        });
        return true;
      }
      return false;
    }
  };
})();
