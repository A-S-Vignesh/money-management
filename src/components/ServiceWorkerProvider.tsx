"use client";

import { useEffect } from "react";

export default function ServiceWorkerProvider() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        })
        .then((registration) => {
          // Check for updates every 60 seconds
          setInterval(() => {
            registration.update();
          }, 60 * 1000);
        })
        .catch((err) =>
          console.error("Service Worker registration failed:", err),
        );
    }
  }, []);

  return null;
}
