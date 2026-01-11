/**
 * BSI Analytics - Conversion Tracking
 * Tracks key user actions across the funnel
 * 
 * Key Events:
 * - page_view: Automatic page tracking
 * - cta_click: CTA button interactions
 * - signup_start: Signup form initiated
 * - tier_select: Subscription tier selected
 * - form_submit: Form submission attempts
 */

(function() {
  'use strict';

  // GA4 Measurement ID
  // To configure: Create GA4 property at analytics.google.com
  // Add the measurement ID (G-XXXXXXXXXX) here
  // Until configured, events log to console only (development mode)
  const GA_MEASUREMENT_ID = window.BSI_GA4_ID || 'G-FY8SBYMFFT';
  
  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  
  // Only load GA in production
  const isProduction = window.location.hostname === 'blazesportsintel.com';
  const hasValidGA4 = GA_MEASUREMENT_ID && !GA_MEASUREMENT_ID.includes('PENDING');
  
  if (isProduction && hasValidGA4) {
    // Load GA4 script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
    
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
      send_page_view: true
    });
  }

  // BSI Analytics namespace
  window.BSIAnalytics = {
    /**
     * Track CTA button clicks
     * @param {string} ctaName - Name of the CTA (e.g., 'hero_start_trial', 'nav_signup')
     * @param {string} destination - Where the CTA leads
     */
    trackCTA: function(ctaName, destination) {
      const eventData = {
        event: 'cta_click',
        cta_name: ctaName,
        cta_destination: destination,
        page_url: window.location.pathname,
        timestamp: new Date().toISOString()
      };
      
      if (isProduction && hasValidGA4) {
        gtag('event', 'cta_click', {
          event_category: 'engagement',
          event_label: ctaName,
          value: 1
        });
      }
      
      if (!isProduction) console.log('[BSI Analytics] CTA Click:', eventData);
    },

    /**
     * Track tier selection on signup/pricing pages
     * @param {string} tier - Selected tier (pro, enterprise)
     * @param {number} price - Monthly price
     */
    trackTierSelect: function(tier, price) {
      const eventData = {
        event: 'tier_select',
        tier_name: tier,
        tier_price: price,
        page_url: window.location.pathname,
        timestamp: new Date().toISOString()
      };
      
      if (isProduction && hasValidGA4) {
        gtag('event', 'tier_select', {
          event_category: 'conversion',
          event_label: tier,
          value: price
        });
      }
      
      if (!isProduction) console.log('[BSI Analytics] Tier Select:', eventData);
    },

    /**
     * Track signup form submissions
     * @param {string} tier - Selected subscription tier
     * @param {string} source - Where signup was initiated from
     */
    trackSignupStart: function(tier, source) {
      const eventData = {
        event: 'signup_start',
        tier: tier,
        source: source,
        page_url: window.location.pathname,
        timestamp: new Date().toISOString()
      };
      
      if (isProduction && hasValidGA4) {
        gtag('event', 'signup_start', {
          event_category: 'conversion',
          event_label: tier,
          value: tier === 'enterprise' ? 199 : 29
        });
      }
      
      if (!isProduction) console.log('[BSI Analytics] Signup Start:', eventData);
    },

    /**
     * Track page engagement (time on page)
     * Called automatically after 30s, 60s, 120s
     */
    trackEngagement: function(seconds) {
      const eventData = {
        event: 'page_engagement',
        engagement_time: seconds,
        page_url: window.location.pathname,
        page_title: document.title,
        timestamp: new Date().toISOString()
      };
      
      if (isProduction && hasValidGA4) {
        gtag('event', 'page_engagement', {
          event_category: 'engagement',
          event_label: `${seconds}s`,
          value: seconds
        });
      }
      
      if (!isProduction) console.log('[BSI Analytics] Engagement:', eventData);
    },

    /**
     * Initialize automatic tracking
     */
    init: function() {
      // Auto-track CTA clicks
      document.querySelectorAll('[data-track-cta]').forEach(el => {
        el.addEventListener('click', () => {
          const ctaName = el.getAttribute('data-track-cta');
          const destination = el.getAttribute('href') || 'unknown';
          this.trackCTA(ctaName, destination);
        });
      });

      // Auto-track tier selection
      document.querySelectorAll('.tier-option input[type="radio"]').forEach(el => {
        el.addEventListener('change', () => {
          const tier = el.value;
          const price = tier === 'enterprise' ? 199 : 29;
          this.trackTierSelect(tier, price);
        });
      });

      // Auto-track engagement milestones
      const engagementMilestones = [30, 60, 120];
      const startTime = Date.now();
      
      engagementMilestones.forEach(seconds => {
        setTimeout(() => {
          this.trackEngagement(seconds);
        }, seconds * 1000);
      });

      // Track form submissions
      document.querySelectorAll('form[action*="/api/auth"]').forEach(form => {
        form.addEventListener('submit', () => {
          const tierInput = form.querySelector('input[name="tier"]:checked');
          const tier = tierInput ? tierInput.value : 'unknown';
          this.trackSignupStart(tier, window.location.pathname);
        });
      });

      if (!isProduction) console.log('[BSI Analytics] Initialized');
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BSIAnalytics.init());
  } else {
    BSIAnalytics.init();
  }
})();
