// src/app/_layout.tsx — Money Nest root.
//
// Defensively wrapped in an ErrorBoundary so any module-load or render-time
// crash shows up on screen with a stack trace, instead of Expo Go closing
// silently.

import "@/global.css";

// ── Global JS error handler ─────────────────────────────────────────────
// Captures uncaught errors from worklets, native callbacks, and async
// fire-and-forgets that React's ErrorBoundary can't catch. Logs to Metro
// so we can see what crashed even when the device shuts the app silently.
if (typeof ErrorUtils !== "undefined") {
  const __originalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error(`[GLOBAL ${isFatal ? "FATAL" : "ERROR"}]`, error?.message);
    console.error(error?.stack);
    __originalHandler?.(error, isFatal);
  });
}

import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import * as SystemUI from "expo-system-ui";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeTransitionOverlay } from "@/components/ThemeTransitionOverlay";
import { Toast } from "@/components/ui/Toast";
import { AppLockGate } from "@/components/security/AppLockGate";
import { queryClient } from "@/lib/queryClient";
import { asyncStoragePersister } from "@/lib/asyncStoragePersister";
import { useAuth } from "@/lib/auth";
import {
  configureNotificationHandler,
  useNotifPrefs,
} from "@/lib/notifications";
import { useSecurity } from "@/lib/security";
import { useTheme } from "@/lib/theme";

// Install the foreground-notification handler before any component
// mounts so the very first incoming notification (e.g. a backend push
// landing while the app is opening) gets the right banner/sound
// treatment. The function self-guards against duplicate registration.
configureNotificationHandler();

export const unstable_settings = {
  anchor: "index",
};

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <RootLayoutInner />
    </ErrorBoundary>
  );
}

function RootLayoutInner() {
  const hydrateAuth = useAuth((s) => s.hydrate);
  const authReady = useAuth((s) => s.hydrated);
  const userId = useAuth((s) => s.user?._id ?? null);
  const initTheme = useTheme((s) => s.init);
  const themeReady = useTheme((s) => s.hydrated);
  const resolved = useTheme((s) => s.resolved);
  const hydrateSecurityFor = useSecurity((s) => s.hydrateFor);
  const securityReady = useSecurity((s) => s.hydrated);
  const hydrateNotifFor = useNotifPrefs((s) => s.hydrateFor);
  const notifReady = useNotifPrefs((s) => s.hydrated);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      try {
        await Promise.all([
          hydrateAuth(),
          initTheme().then((c) => {
            cleanup = c;
          }),
        ]);
      } catch (e) {
        // Don't let a SecureStore / AsyncStorage hiccup wedge the app —
        // we still want to render Login.
        console.error("[hydration]", (e as Error)?.message);
      }
    })();
    return () => cleanup?.();
  }, [hydrateAuth, initTheme]);

  // Re-hydrate the security store whenever the signed-in user changes.
  // Preferences are keyed by `user._id` so different Google accounts on
  // the same device have independent biometric / app-lock / hide-balance
  // settings. Triggered:
  //   - on first auth hydration (userId resolves to a value or null)
  //   - on sign-in (null → userId)
  //   - on sign-out (userId → null) — resets to all-off defaults
  //   - on account switch (userIdA → userIdB) — loads B's prefs
  useEffect(() => {
    if (!authReady) return;
    void hydrateSecurityFor(userId);
  }, [authReady, userId, hydrateSecurityFor]);

  // Same story for notification preferences — keyed per user so each
  // Google account on the device gets its own push / budget-alert /
  // email-digest toggles. Resets to defaults when signed-out.
  useEffect(() => {
    if (!authReady) return;
    void hydrateNotifFor(userId);
  }, [authReady, userId, hydrateNotifFor]);

  // Note: the lock screen is raised directly by `hydrateFor` whenever it
  // loads a user whose biometric preference is on. That handles cold
  // start AND every fresh sign-in, which is what closes the "sign out to
  // skip the lock" loophole — a fresh Google sign-in alone isn't treated
  // as sufficient to bypass biometric, since a stolen device with a live
  // Google session could otherwise tap through to the dashboard.

  // Paint the Android activity window background with the theme bg colour.
  // Without this, the OS window beneath the React layer stays the default
  // white — and during the native back-pop animation react-native-screens
  // briefly exposes that window (the outgoing screen's view detaches a
  // frame before the new screen paints), producing a white flash on dark
  // mode. expo-system-ui writes to the Activity's windowBackground at
  // runtime, fixing it from the layer below React.
  useEffect(() => {
    if (!themeReady) return;
    const bg = resolved === "dark" ? "#0a0b0e" : "#f5f6fa";
    SystemUI.setBackgroundColorAsync(bg).catch(() => {
      /* unsupported on this platform — safe to ignore */
    });
  }, [themeReady, resolved]);

  if (!authReady || !themeReady || !securityReady || !notifReady) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={resolved === "dark" ? DarkTheme : DefaultTheme}>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister: asyncStoragePersister }}
          >
            <StatusBar style={resolved === "dark" ? "light" : "dark"} />
            {/* Stack transition config:
                - `slide_from_right` for forward navigation, OS-level
                  swipe-back maps to the reverse automatically.
                - `contentStyle.backgroundColor` is critical: screens are
                  transparent mid-transition by default, so without this
                  the host (white) bleeds through and you see a white
                  flash in dark mode. Setting it to the theme's bg color
                  removes the flash entirely.

                Re: rn-screens 4.23 Android back-slide black slab — that
                bug ONLY reproduces in Expo Go, which runs the old Paper
                bridge. JS-driven slide animations there unmount the
                outgoing screen before the animation completes, leaving
                an empty View painted with `contentStyle.backgroundColor`
                ("black slab"). EAS dev/preview/production builds run
                Fabric (new architecture, default in SDK 55), where the
                slide is driven natively and finishes before unmount.
                So: live with the cosmetic flash in Expo Go for a clean
                iOS-style slide in every real build. */}
            {/* AppLockGate wraps the navigator so its <LockScreen />
                overlay sits above every route (incl. modals/sheets) but
                under the theme-transition overlay. When biometric unlock
                is on and the app resumes after the configured timeout,
                this is what blocks interaction until the user authenticates. */}
            <AppLockGate>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: "slide_from_right",
                  contentStyle: {
                    backgroundColor: resolved === "dark" ? "#0a0b0e" : "#f5f6fa",
                  },
                  gestureEnabled: true,
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="help" />
                <Stack.Screen name="legal" />
                <Stack.Screen name="goals/[id]" />
                <Stack.Screen name="holdings/[id]" />
              </Stack>
            </AppLockGate>
            {/* Mounted at the top of the stack so its fade overlay sits
                above every screen — hides the synchronous color cascade
                triggered by the Settings page's Dark mode toggle. */}
            <ThemeTransitionOverlay />
            {/* Global toast — shown by useToast.success/error/info from
                mutation hooks and screen actions. Mounted after the
                transition overlay so toasts sit on the very top layer. */}
            <Toast />
          </PersistQueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
