'use client';

import { useEffect } from 'react';

/**
 * Service Worker Registration Component
 *
 * Registers the service worker for PWA functionality:
 * - Offline support
 * - Background sync
 * - Push notifications (future)
 * - Asset caching
 */

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Only register service worker in production or if explicitly enabled
    const isProduction = process.env.NODE_ENV === 'production';
    const enableSW = process.env.NEXT_PUBLIC_ENABLE_SW === 'true';

    if (!isProduction && !enableSW) {
      console.log('[SW] Service worker disabled in development');
      return;
    }

    if (!('serviceWorker' in navigator)) {
      console.log('[SW] Service workers not supported');
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });

        console.log('[SW] Service worker registered:', registration.scope);

        // Check for updates periodically
        const checkForUpdates = async () => {
          try {
            await registration.update();
          } catch (error) {
            console.log('[SW] Update check failed:', error);
          }
        };

        // Check for updates every 5 minutes
        setInterval(checkForUpdates, 5 * 60 * 1000);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available
              console.log('[SW] New content available');

              // Optionally notify the user about the update
              if (window.confirm('New version available! Click OK to refresh.')) {
                window.location.reload();
              }
            }
          });
        });

        // Handle controller change
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });

      } catch (error) {
        console.error('[SW] Service worker registration failed:', error);
      }
    };

    // Register after page load for better performance
    if (document.readyState === 'complete') {
      registerServiceWorker();
    } else {
      window.addEventListener('load', registerServiceWorker);
      return () => window.removeEventListener('load', registerServiceWorker);
    }
  }, []);

  return null;
}

/**
 * Hook to interact with the service worker
 */
export function useServiceWorker() {
  const triggerSync = async (tag: string) => {
    if (!('serviceWorker' in navigator) || !('sync' in window)) {
      console.log('[SW] Background sync not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      // @ts-ignore - sync API not fully typed
      await registration.sync.register(tag);
      console.log('[SW] Sync registered:', tag);
      return true;
    } catch (error) {
      console.error('[SW] Sync registration failed:', error);
      return false;
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('[SW] Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('[SW] Notification permission request failed:', error);
      return 'denied';
    }
  };

  const showNotification = async (title: string, options?: NotificationOptions) => {
    if (!('serviceWorker' in navigator)) {
      console.log('[SW] Service workers not supported');
      return false;
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.log('[SW] Notification permission denied');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...options,
      });
      return true;
    } catch (error) {
      console.error('[SW] Show notification failed:', error);
      return false;
    }
  };

  return {
    triggerSync,
    requestNotificationPermission,
    showNotification,
  };
}
