"use client";
import { useEffect } from "react";

export default function ServiceWorkerProvider() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) {
          navigator.serviceWorker
            .register("/sw.js")
            .then(() => console.log("✅ Service Worker registered"))
            .catch((err) =>
              console.error("❌ Service Worker registration failed:", err)
            );
        }
      });
    }
  }, []);

  return null;
}
