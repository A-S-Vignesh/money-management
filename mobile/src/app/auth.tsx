// src/app/auth.tsx
//
// Deep-link landing route for the OAuth relay's bouncer page. When Vercel
// redirects the browser to `exp://<host>/--/auth?token=...&user=...`, two
// things can happen:
//
//   1. WebBrowser.openAuthSessionAsync intercepts the redirect, closes the
//      browser, and resolves with `result.url`. Login screen parses it and
//      navigates manually. This route is NEVER visited.
//
//   2. The in-app browser (Chrome Custom Tabs on Android) hands off the
//      `exp://` scheme to the OS instead of intercepting. The OS launches
//      Expo Go with the deep link, which Expo Router routes to /auth. This
//      file renders and finishes the sign-in.
//
// Both paths converge on the same auth store update. Without this route,
// path (2) shows Expo Router's "Unmatched route" 404 for a moment and the
// auth state never gets set — that's the "blip then back to login" bug.

import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/lib/auth";

// Tolerate single OR double URL-encoding so the app keeps working through
// the backend rollout window. See login.tsx for the matching helper.
function tolerantUserParse(raw: string): unknown | null {
  let s = raw;
  for (let i = 0; i < 3; i++) {
    try {
      return JSON.parse(s);
    } catch {
      try {
        s = decodeURIComponent(s);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export default function AuthCallback() {
  const params = useLocalSearchParams<{ token?: string; user?: string }>();
  const signIn = useAuth((s) => s.signIn);
  const token = useAuth((s) => s.token);

  useEffect(() => {
    console.log("[auth callback] mounted", {
      hasToken: !!params.token,
      hasUser: !!params.user,
      userType: typeof params.user,
    });
    if (!params.token || typeof params.user !== "string") return;
    const user = tolerantUserParse(params.user);
    if (!user || typeof user !== "object") {
      console.error(
        "[auth callback] failed to parse user payload, raw:",
        params.user,
      );
      return;
    }
    console.log("[auth callback] signing in", {
      email: (user as { email?: string }).email,
    });
    // signIn is async, but it sets the in-memory state synchronously before
    // awaiting SecureStore — so by the next render the auth gate sees the
    // token and the Redirect below sends us into the tabs.
    void signIn({
      token: params.token,
      user: user as { _id: string; email: string; name?: string; image?: string },
    });
  }, [params.token, params.user, signIn]);

  // Once the auth store has a token, redirect to the tabs. If the URL
  // somehow lacked params and the user already had a session, this still
  // does the right thing.
  if (token) return <Redirect href="/(tabs)" />;

  // No params at all (someone visited /auth directly) — back to login.
  if (!params.token) return <Redirect href="/(auth)/login" />;

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
      }}
    >
      <ActivityIndicator />
    </View>
  );
}
