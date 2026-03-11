const CACHE_NAME = "money-nest-cache-v2";

// Precache important assets
const PRECACHE_ASSETS = [
  "/",
  "/dashboard",
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

// Fetch event → network-first for pages, skip non-cacheable requests
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only handle http/https requests (skip chrome-extension://, etc.)
  if (!url.protocol.startsWith("http")) return;

  // Skip non-GET requests, API calls, and Next.js internals
  if (event.request.method !== "GET") return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/_next/")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache same-origin, successful responses
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone).catch(() => {});
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails, fall back to cache
        return caches.match(event.request).then((cached) => {
          return cached || caches.match("/");
        });
      }),
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
