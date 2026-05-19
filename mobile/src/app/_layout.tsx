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
import { QueryClientProvider } from "@tanstack/react-query";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

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
  const initTheme = useTheme((s) => s.init);
  const themeReady = useTheme((s) => s.hydrated);
  const resolved = useTheme((s) => s.resolved);

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

  if (!authReady || !themeReady) {
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
          <QueryClientProvider client={queryClient}>
            <StatusBar style={resolved === "dark" ? "light" : "dark"} />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "fade",
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
