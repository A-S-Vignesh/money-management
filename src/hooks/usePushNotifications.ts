"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToastStore } from "@/store/useToastStore";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Race a promise against a timeout so a hung browser API can't lock the UI.
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms / 1000}s`)),
        ms,
      ),
    ),
  ]);
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [permissionState, setPermissionState] =
    useState<NotificationPermission>("default");
  const mountedRef = useRef(true);
  const showToast = useToastStore((s) => s.showToast);

  // Track mount state so we never call setState after unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Check support and existing subscription on mount
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    setIsSupported(true);
    setPermissionState(Notification.permission);

    // Wait for SW with a timeout — if it never activates, we don't want to hang silently.
    withTimeout(navigator.serviceWorker.ready, 8000, "Service worker ready")
      .then(async (registration) => {
        const existingSub = await registration.pushManager.getSubscription();
        if (mountedRef.current) setSubscription(existingSub);
      })
      .catch((err) => {
        console.error("Push: service worker not ready", err);
      });
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      showToast("Push notifications are not supported in this browser", "error");
      return false;
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      showToast(
        "Push notifications are not configured (missing VAPID key)",
        "error",
      );
      return false;
    }

    setIsLoading(true);
    try {
      // 1. Permission prompt — 60s budget for the user to click Allow/Block.
      // If it hangs longer than that, the prompt was likely missed/dismissed.
      const permission = await withTimeout(
        Notification.requestPermission(),
        60_000,
        "Permission prompt",
      );
      if (mountedRef.current) setPermissionState(permission);

      if (permission !== "granted") {
        if (permission === "denied") {
          showToast(
            "Notifications blocked. Enable them in your browser site settings.",
            "warning",
          );
        }
        return false;
      }

      // 2. Service worker must be active before we can subscribe.
      const registration = await withTimeout(
        navigator.serviceWorker.ready,
        8_000,
        "Service worker ready",
      );

      // 3. If a subscription somehow already exists, reuse it instead of failing.
      const existing = await registration.pushManager.getSubscription();
      // Wrap key bytes in an ArrayBuffer — TS lib types reject Uint8Array<ArrayBufferLike>
      const keyBytes = urlBase64ToUint8Array(vapidKey);
      const applicationServerKey = new ArrayBuffer(keyBytes.length);
      new Uint8Array(applicationServerKey).set(keyBytes);
      const sub =
        existing ||
        (await withTimeout(
          registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          }),
          15_000,
          "Push subscription",
        ));

      if (mountedRef.current) setSubscription(sub);

      // 4. Send subscription to server
      const serializedSub = JSON.parse(JSON.stringify(sub));
      const res = await withTimeout(
        fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: serializedSub }),
        }),
        10_000,
        "Save subscription",
      );

      if (!res.ok) throw new Error("Failed to save subscription on server");

      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("Push subscription error:", error);
      showToast(`Couldn't enable notifications: ${msg}`, "error");
      return false;
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [isSupported, showToast]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!subscription) return false;

    setIsLoading(true);
    try {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      if (mountedRef.current) setSubscription(null);

      await withTimeout(
        fetch("/api/notifications/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        }),
        10_000,
        "Remove subscription",
      );

      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("Push unsubscription error:", error);
      showToast(`Couldn't disable notifications: ${msg}`, "error");
      return false;
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [subscription, showToast]);

  // Send a test notification
  const sendTestNotification = useCallback(
    async (title: string, body: string) => {
      if (!subscription) return false;

      try {
        const res = await fetch("/api/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, body }),
        });
        return res.ok;
      } catch {
        return false;
      }
    },
    [subscription],
  );

  return {
    isSupported,
    subscription,
    isLoading,
    permissionState,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}
