// Basic Service Worker for PWA installation
const CACHE_NAME = 'chat-app-cache-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Basic pass-through with error handling
    event.respondWith(
        fetch(event.request).catch(() => {
            // If fetch fails (e.g. offline or server down), just return a fallback or nothing
            // This prevents the "Uncaught TypeError: Failed to fetch" in console
            return new Response('Network error occurred', { status: 408 });
        })
    );
});
