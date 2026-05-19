// app.config.ts — Money Nest mobile.
// Extends the SDK 55 scaffold's app.json with the plugins + extra fields
// the app actually needs: SecureStore for JWT, Notifications for push,
// Google Sign-In for native auth, and a few env-driven values.

import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Money Nest",
  slug: "money-nest",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "moneynest",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "co.sunlightgroup.moneynest",
    icon: "./assets/expo.icon",
  },
  android: {
    package: "co.sunlightgroup.moneynest",
    adaptiveIcon: {
      backgroundColor: "#4f46e5",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  // Plugins kept Expo-Go-friendly: no native Google Sign-In plugin (the
  // browser-based expo-auth-session flow doesn't need a config plugin and
  // works inside Expo Go without any custom native code).
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#4f46e5",
        android: {
          image: "./assets/images/splash-icon.png",
          imageWidth: 76,
        },
      },
    ],
    "expo-secure-store",
    "expo-notifications",
    "expo-web-browser",
  ],
  experiments: {
    typedRoutes: true,
    // React Compiler is still experimental and has known crashes with
    // NativeWind's className transform. Keep it OFF until we've validated
    // the production build. Re-enable later for the perf win.
    reactCompiler: false,
  },
  extra: {
    // Runtime config read via expo-constants.
    // Override per build with EAS env vars or a local mobile/.env file.

    // Where the JSON API lives (dashboard, transactions, etc.). Can be your
    // local dev server (LAN IP, not localhost — phone can't reach localhost).
    apiBaseUrl:
      process.env.EXPO_PUBLIC_API_BASE_URL ||
      "http://10.0.2.2:3000", // Android emulator alias for host's localhost

    // Where the OAuth relay lives. Must be HTTPS (Google's hard requirement)
    // — typically your prod Vercel URL even during dev, because Google
    // doesn't accept LAN/IP-based redirect URIs on Web OAuth clients.
    authBaseUrl:
      process.env.EXPO_PUBLIC_AUTH_BASE_URL ||
      "https://moneynestapp.vercel.app",
  },
};

export default config;
