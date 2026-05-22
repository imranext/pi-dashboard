/**
 * Service Worker for Pi Dashboard PWA
 * Provides offline capability and caching
 */

const CACHE_NAME = 'pi-dashboard-v1.0.0';
const STATIC_CACHE = 'pi-dashboard-static-v1.0.0';
const DYNAMIC_CACHE = 'pi-dashboard-dynamic-v1.0.0';

// Files to cache on install
const STATIC_FILES = [
    '/',
    '/static/css/style.css',
    '/static/js/app.js',
    '/static/manifest.json',
    'https://cdn.socket.io/4.5.4/socket.io.min.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[Service Worker] Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .catch((error) => {
                console.error('[Service Worker] Cache failed:', error);
            })
    );
    
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // Take control of all pages immediately
    return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip WebSocket connections and API calls
    if (request.url.includes('socket.io') || 
        request.url.includes('/api/') ||
        request.url.includes('/health')) {
        return; // Let these go to the network
    }
    
    // Network-first strategy for HTML
    if (request.headers.get('accept').includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone and cache the response
                    const responseClone = response.clone();
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(request)
                        .then((response) => {
                            return response || caches.match('/');
                        });
                })
        );
        return;
    }
    
    // Cache-first strategy for static assets
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached version
                    return cachedResponse;
                }
                
                // Not in cache, fetch from network
                return fetch(request)
                    .then((response) => {
                        // Check if valid response
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }
                        
                        // Clone and cache the response
                        const responseClone = response.clone();
                        caches.open(DYNAMIC_CACHE).then((cache) => {
                            cache.put(request, responseClone);
                        });
                        
                        return response;
                    })
                    .catch((error) => {
                        console.error('[Service Worker] Fetch failed:', error);
                        
                        // Return offline page or fallback
                        return caches.match('/');
                    });
            })
    );
});

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            })
        );
    }
});

// Sync event - background sync (future feature)
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync:', event.tag);
    
    if (event.tag === 'sync-metrics') {
        event.waitUntil(
            // Future: sync metrics when online
            Promise.resolve()
        );
    }
});

// Push event - push notifications (future feature)
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push received:', event);
    
    const options = {
        body: event.data ? event.data.text() : 'New notification',
        icon: '/static/icons/icon-192x192.png',
        badge: '/static/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        tag: 'pi-dashboard-notification',
        requireInteraction: false
    };
    
    event.waitUntil(
        self.registration.showNotification('Pi Dashboard Alert', options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked:', event);
    
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/')
    );
});

console.log('[Service Worker] Loaded');
