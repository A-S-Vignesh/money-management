self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("app-cache").then((cache) => {
      return cache.addAll([
        "/", // root route
        "/login", // login page
        "/dashboard", // dashboard entry
        "/offline", // offline fallback
        "/favicon.ico",
        "/manifest.json",
        "/apple-icon.png",
        "/icon0.svg",
        "/icon1.png",

        // Next.js chunks & CSS from build
        "/_next/static/chunks/202abb9aed9e828b.js",
        "/_next/static/chunks/75a3f12660976f11.js",
        "/_next/static/chunks/e3e5434a413abe7f.js",
        "/_next/static/chunks/cd27ad11fa76cf91.css",
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response || fetch(event.request).catch(() => caches.match("/offline"))
      );
    })
  );
});
