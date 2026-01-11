/**
 * BSI App Initialization
 * Single source of truth for service worker registration and app bootstrap
 *
 * Usage (add to HTML <head>):
 *   <script src="/src/js/app-init.js" defer></script>
 *
 * Features:
 *   - Service worker registration with update handling
 *   - Push notification permission state tracking
 *   - Graceful degradation for unsupported browsers
 *
 * @file app-init.js
 * @version 1.0.0
 */

(function() {
  'use strict';

  const BSI_SW_PATH = '/sw.js';

  /**
   * Register service worker with update handling
   * @returns {Promise<ServiceWorkerRegistration|null>}
   */
  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register(BSI_SW_PATH, {
        scope: '/'
      });

      // Listen for updates
      registration.addEventListener('updatefound', function() {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', function() {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available - notify if handler exists
              if (window.BSI && typeof window.BSI.onServiceWorkerUpdate === 'function') {
                window.BSI.onServiceWorkerUpdate();
              }
            }
          });
        }
      });

      return registration;
    } catch (error) {
      // Log error but don't break the app
      if (typeof console !== 'undefined' && console.error) {
        console.error('[BSI] Service worker registration failed:', error.message);
      }
      return null;
    }
  }

  /**
   * Check push notification permission state
   * @returns {string} 'granted', 'denied', or 'default'
   */
  function getPushPermissionState() {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  /**
   * Initialize BSI app features
   */
  async function initApp() {
    // Create BSI namespace if needed
    window.BSI = window.BSI || {};

    // Register service worker
    const swRegistration = await registerServiceWorker();
    window.BSI.swRegistration = swRegistration;

    // Track push permission
    window.BSI.pushPermission = getPushPermissionState();

    // Mark initialization complete
    window.BSI.initialized = true;

    // Dispatch ready event
    window.dispatchEvent(new CustomEvent('bsi:ready', {
      detail: {
        serviceWorker: !!swRegistration,
        pushPermission: window.BSI.pushPermission
      }
    }));
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
