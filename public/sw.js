const CACHE_NAME = "money-nest-cache-v3";

// Precache critical assets including the offline fallback
const PRECACHE_ASSETS = [
  "/",
  "/dashboard",
  "/offline.html",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
];

// Install event → cache files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)),
  );
  self.skipWaiting();
});

// Activate event → cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => key !== CACHE_NAME && caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

// Fetch event strategy:
//  - Next.js static chunks (_next/static) → Cache-first (immutable, hashed filenames)
//  - API calls                             → Network-only (always fresh)
//  - Navigation (HTML pages)               → Network-first, fallback to offline.html
//  - Everything else                       → Network-first, fallback to cache
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only handle http/https
  if (!url.protocol.startsWith("http")) return;
  // Only handle GET
  if (event.request.method !== "GET") return;

  // ── API calls: always go to network, never cache ──────────────────
  if (url.pathname.startsWith("/api/")) return;

  // ── Next.js immutable static assets: cache-first ─────────────────
  // These filenames are content-hashed, so if cached they're always valid.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone).catch(() => {});
            });
          }
          return response;
        });
      }),
    );
    return;
  }

  // ── Navigation requests: network-first, offline.html fallback ────
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful navigation responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone).catch(() => {});
            });
          }
          return response;
        })
        .catch(() =>
          // Network failed → serve offline page
          caches.match("/offline.html")
        ),
    );
    return;
  }

  // ── Everything else: network-first, cache fallback ────────────────
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone).catch(() => {});
          });
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match("/offline.html")),
      ),
  );
});

// Push event → show notification
self.addEventListener("push", (event) => {
  const showNotification = async () => {
    let data = {};

    if (event.data) {
      try {
        data = event.data.json();
      } catch {
        // Fallback: try as plain text
        try {
          data = JSON.parse(event.data.text());
        } catch {
          data = {
            title: "Money Nest",
            body: event.data.text() || "You have a new notification",
          };
        }
      }
    }

    const options = {
      body: data.body || "You have a new notification",
      icon: data.icon || "/web-app-manifest-192x192.png",
      badge: data.badge || "/web-app-manifest-192x192.png",
      vibrate: [100, 50, 100],
      data: {
        url: data.url || "/dashboard",
        dateOfArrival: Date.now(),
      },
      actions: [
        { action: "open", title: "Open" },
        { action: "dismiss", title: "Dismiss" },
      ],
    };

    return self.registration.showNotification(
      data.title || "Money Nest",
      options,
    );
  };

  // Chrome REQUIRES event.waitUntil with a notification — must be called synchronously
  event.waitUntil(showNotification());
});

// Notification click → open app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Focus existing window if available
        for (const client of clients) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        return self.clients.openWindow(url);
      }),
  );
});
