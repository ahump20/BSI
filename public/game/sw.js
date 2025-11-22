/**
 * Diamond Sluggers - Service Worker
 * Provides offline functionality and caching
 */

const CACHE_NAME = 'diamond-sluggers-v1.0.0';
const OFFLINE_CACHE = 'diamond-sluggers-offline-v1';

// Assets to cache on install
const STATIC_ASSETS = [
    '/game/',
    '/game/index.html',
    '/game/manifest.json',
    '/game/js/main.js',
    '/game/js/characters.js',
    '/game/js/stadiums.js',
    '/game/js/game-engine.js',
    '/game/js/game-state.js',
    '/game/js/renderer.js',
    '/game/js/input-handler.js',
    '/game/js/sound-manager.js',
    '/game/js/storage-manager.js',
    '/game/icons/icon-192.png',
    '/game/icons/icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[Service Worker] Installation complete');
                return self.skipWaiting(); // Activate immediately
            })
            .catch((error) => {
                console.error('[Service Worker] Installation failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Delete old caches
                        if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
                            console.log('[Service Worker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] Activation complete');
                return self.clients.claim(); // Take control immediately
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle same-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    event.respondWith(
        handleFetch(request)
    );
});

/**
 * Handle fetch with appropriate caching strategy
 */
async function handleFetch(request) {
    const url = new URL(request.url);

    // Strategy 1: Cache-first for static game assets
    if (isStaticAsset(url.pathname)) {
        return cacheFirst(request);
    }

    // Strategy 2: Network-first for HTML (always try to get fresh)
    if (url.pathname.endsWith('.html') || url.pathname === '/game/' || url.pathname === '/game') {
        return networkFirst(request);
    }

    // Strategy 3: Cache-first with network fallback for everything else
    return cacheFirst(request);
}

/**
 * Check if URL is a static asset
 */
function isStaticAsset(pathname) {
    const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.woff', '.woff2', '.json'];
    return staticExtensions.some(ext => pathname.endsWith(ext));
}

/**
 * Cache-first strategy
 */
async function cacheFirst(request) {
    try {
        // Try cache first
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
            console.log('[Service Worker] Serving from cache:', request.url);
            return cachedResponse;
        }

        // Cache miss - fetch from network
        console.log('[Service Worker] Cache miss, fetching:', request.url);
        const networkResponse = await fetch(request);

        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            cache.put(request, responseToCache);
        }

        return networkResponse;
    } catch (error) {
        console.error('[Service Worker] Fetch failed:', error);

        // Return offline page if available
        return caches.match('/game/offline.html') || new Response(
            'Offline - Please check your internet connection',
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                    'Content-Type': 'text/plain'
                })
            }
        );
    }
}

/**
 * Network-first strategy
 */
async function networkFirst(request) {
    try {
        // Try network first
        console.log('[Service Worker] Fetching from network:', request.url);
        const networkResponse = await fetch(request);

        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.error('[Service Worker] Network fetch failed:', error);

        // Fallback to cache
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
            console.log('[Service Worker] Serving stale from cache:', request.url);
            return cachedResponse;
        }

        // Return offline page
        return caches.match('/game/offline.html') || new Response(
            'Offline - Please check your internet connection',
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                    'Content-Type': 'text/plain'
                })
            }
        );
    }
}

// Listen for messages from clients
self.addEventListener('message', (event) => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }

    if (event.data.action === 'clearCache') {
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => caches.delete(cacheName))
            );
        }).then(() => {
            event.ports[0].postMessage({ success: true });
        });
    }
});

// Background sync for saving game progress
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-game-state') {
        event.waitUntil(syncGameState());
    }
});

/**
 * Sync game state to server (future feature)
 */
async function syncGameState() {
    try {
        // This would sync localStorage data to Cloudflare KV
        // For now, just log
        console.log('[Service Worker] Syncing game state...');
        return Promise.resolve();
    } catch (error) {
        console.error('[Service Worker] Sync failed:', error);
        return Promise.reject(error);
    }
}

// Push notification support (future feature)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'New update available!',
        icon: '/game/icons/icon-192.png',
        badge: '/game/icons/badge-72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'play',
                title: 'Play Now'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Diamond Sluggers', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'play') {
        event.waitUntil(
            clients.openWindow('/game/')
        );
    }
});

console.log('[Service Worker] Registered successfully');
