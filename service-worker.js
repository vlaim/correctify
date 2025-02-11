const CACHE_NAME = "pwa-cache-v1";
const ASSETS_TO_CACHE = [
    "/",
    "/index.html",
    "/manifest.json",
];

// Install event: Caches the specified assets
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting()) // Forces activation immediately
            .catch(err => console.error("Failed to cache assets during install", err))
    );
});

// Activate event: Cleans up old caches and takes control
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim(); // Ensures the new SW takes control immediately
});

// Fetch event: Serves cached files and falls back to network
self.addEventListener("fetch", event => {
    // Ignore requests that don't use HTTP/HTTPS (e.g., chrome-extension://)
    if (!event.request.url.startsWith("http")) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request)
                    .then(fetchResponse => {
                        // Only cache GET requests to avoid caching POST/PUT requests
                        if (event.request.method === "GET") {
                            return caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, fetchResponse.clone());
                                return fetchResponse;
                            });
                        }
                        return fetchResponse;
                    });
            })
            .catch(() => caches.match("/index.html")) // Fallback for offline use
    );
});