"use client";

import { useState, useEffect, useCallback } from "react";

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

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [permissionState, setPermissionState] =
    useState<NotificationPermission>("default");

  // Check support and existing subscription on mount
  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      setPermissionState(Notification.permission);

      // Check existing subscription
      navigator.serviceWorker.ready.then(async (registration) => {
        const existingSub = await registration.pushManager.getSubscription();
        setSubscription(existingSub);
      });
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!isSupported) return false;

    setIsLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);

      if (permission !== "granted") {
        setIsLoading(false);
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidKey = urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      );
      const keyBuffer = new ArrayBuffer(vapidKey.length);
      new Uint8Array(keyBuffer).set(vapidKey);
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBuffer,
      });

      setSubscription(sub);

      // Send subscription to server
      const serializedSub = JSON.parse(JSON.stringify(sub));
      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: serializedSub }),
      });

      if (!res.ok) throw new Error("Failed to save subscription");

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Push subscription error:", error);
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!subscription) return false;

    setIsLoading(true);
    try {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      setSubscription(null);

      await fetch("/api/notifications/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Push unsubscription error:", error);
      setIsLoading(false);
      return false;
    }
  }, [subscription]);

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
