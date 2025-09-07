const CACHE_NAME = "money-nest-cache-v1";

// Precache important assets
const PRECACHE_ASSETS = [
  "/",
  "/login",
  "/dashboard",
  "/offline",
  "/favicon.ico",
  "/manifest.json",
  "/apple-icon.png",
  "/icon0.svg",
  "/icon1.png"
];

// Install event → cache files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activate event → cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Fetch event → cache-first strategy
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) => {
          // Cache runtime resources like chunks
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
    )
  );
});
