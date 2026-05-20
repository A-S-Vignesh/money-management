// app/(auth)/login.tsx
// OAuth via the backend relay. Flow:
//   1. Mobile builds its return-URL (`Linking.createURL("auth")`) which is
//      either `exp://<ip>:<port>/--/auth` (Expo Go) or `moneynest://auth`
//      (dev/standalone build).
//   2. WebBrowser.openAuthSessionAsync opens an in-app browser pointed at
//      `${AUTH_BASE_URL}/api/auth/mobile/start?returnTo=<return-url>`.
//   3. Backend redirects to Google, user signs in, Google redirects to the
//      backend's /callback, backend mints our JWT and bounces to the
//      return-URL with `token` + `user` query params.
//   4. WebBrowser detects the return-URL prefix, closes itself, and hands
//      us the redirected URL via the `result.url` field.
//   5. We parse `token` + `user` out of the URL and persist them.
//
// Why this approach: Google only accepts https:// redirect URIs on Web
// OAuth clients, so the app cannot talk to Google directly from Expo Go
// (Expo Go can't register a custom scheme). Routing through the backend
// keeps Google happy while still letting the JWT land in the app.

import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";
import {
  ShieldCheck,
  PieChart as PieChartIcon,
  DollarSign,
} from "lucide-react-native";

import { useAuth } from "@/lib/auth";

WebBrowser.maybeCompleteAuthSession();

const authBaseUrl = (Constants.expoConfig?.extra?.authBaseUrl as
  | string
  | undefined) ?? "";

interface ReturnPayload {
  token: string;
  user: { _id: string; email: string; name?: string; image?: string };
}

// Try JSON.parse on a value that might be URL-encoded zero, one, or two
// times. Older backend deploys double-encoded the user payload; the fixed
// backend encodes it exactly once. Being tolerant of both keeps the app
// working through the rollout window without coupling app and server
// version bumps.
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

function parseReturnUrl(returnedUrl: string): ReturnPayload | null {
  // Hand-rolled query parsing — Hermes's URL constructor mangles non-special
  // schemes (`exp://`, `moneynest://`) and `.searchParams.get()` can return
  // partially-decoded garbage. Slicing the string ourselves matches what
  // the backend wrote and what useLocalSearchParams sees on the deep-link
  // side, so all three paths stay in lockstep.
  const qIdx = returnedUrl.indexOf("?");
  if (qIdx < 0) return null;
  const sp = new URLSearchParams(returnedUrl.slice(qIdx + 1));
  const token = sp.get("token");
  const userRaw = sp.get("user");
  if (!token || !userRaw) return null;
  const user = tolerantUserParse(userRaw);
  if (!user || typeof user !== "object") return null;
  return { token, user: user as ReturnPayload["user"] };
}

export default function LoginScreen() {
  const signIn = useAuth((s) => s.signIn);
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleGoogle = async () => {
    if (!authBaseUrl) {
      Alert.alert(
        "Setup required",
        "Set EXPO_PUBLIC_AUTH_BASE_URL in mobile/.env (e.g. https://moneynestapp.vercel.app), then restart Metro with `pnpm start --clear`.",
      );
      return;
    }

    // Expo Web has no `exp://` deep link to bounce back to, so the mobile
    // OAuth relay (which requires one) rejects the returnTo. The Next.js
    // web app at the same backend already handles Google sign-in via
    // NextAuth cookies — hand the browser off to it.
    if (Platform.OS === "web") {
      window.location.href = `${authBaseUrl}/login`;
      return;
    }

    setBusy(true);
    try {
      // `Linking.createURL("auth")` returns the right deep link for the
      // current runtime:
      //   - Expo Go:        exp://<ip>:<port>/--/auth
      //   - Dev client:     exp+money-nest://expo-development-client/--/auth
      //   - Standalone:     moneynest://auth
      // The backend whitelist (isAllowedReturnUrl) covers all three.
      const returnUrl = Linking.createURL("auth");
      const start = `${authBaseUrl}/api/auth/mobile/start?returnTo=${encodeURIComponent(returnUrl)}`;

      console.log("[login] opening browser, returnUrl:", returnUrl);
      const result = await WebBrowser.openAuthSessionAsync(start, returnUrl);
      console.log(
        "[login] browser result:",
        result.type,
        "url" in result ? result.url : "(no url)",
      );

      if (result.type === "cancel" || result.type === "dismiss") {
        // The Android in-app browser often returns "dismiss" even when the
        // OAuth flow technically succeeded — because Custom Tabs handed the
        // exp:// redirect off to the OS instead of intercepting. In that
        // case the deep link reached /auth and that route handles sign-in;
        // we exit quietly here.
        return;
      }
      if (result.type !== "success") {
        Alert.alert("Sign-in failed", "The browser closed unexpectedly.");
        return;
      }
      const payload = parseReturnUrl(result.url);
      if (!payload) {
        console.error("[login] parse failed for url:", result.url);
        Alert.alert(
          "Sign-in failed",
          "The backend didn't return a usable token.",
        );
        return;
      }
      console.log("[login] signing in, email:", payload.user.email);
      await signIn(payload);
      router.replace("/(tabs)");
    } catch (err) {
      const e = err as { message?: string };
      Alert.alert("Sign-in failed", e.message ?? "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-950">
      <LinearGradient
        colors={["#4f46e5", "#312e81"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          height: "55%",
          paddingHorizontal: 24,
          paddingTop: 80,
          paddingBottom: 40,
          justifyContent: "flex-end",
        }}
      >
        <Text className="text-4xl font-bold text-white leading-tight">
          Take control of your{"\n"}financial future.
        </Text>
        <Text className="text-indigo-100 text-base mt-3">
          Track expenses, set budgets, hit goals — all on your phone.
        </Text>
      </LinearGradient>

      <View className="flex-1 -mt-8 px-6">
        <View className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-800">
          <View className="flex-row justify-around mb-6">
            <Feature icon={<ShieldCheck size={18} color="#4f46e5" />} label="Secure" />
            <Feature icon={<PieChartIcon size={18} color="#22c55e" />} label="Smart" />
            <Feature icon={<DollarSign size={18} color="#f59e0b" />} label="Free" />
          </View>

          <Text className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center mb-1">
            Welcome to Money Nest
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
            Sign in with Google to continue
          </Text>

          <Pressable
            onPress={handleGoogle}
            disabled={busy}
            className="w-full h-12 rounded-2xl bg-gray-900 dark:bg-gray-100 flex-row items-center justify-center active:opacity-80"
          >
            {busy ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <View className="w-5 h-5 bg-white rounded-full mr-2.5 items-center justify-center">
                  <Text className="text-gray-900 text-[11px] font-bold">G</Text>
                </View>
                <Text className="text-white dark:text-gray-900 font-semibold text-base">
                  Continue with Google
                </Text>
              </>
            )}
          </Pressable>

          <Text className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-4">
            By continuing you agree to our Terms & Privacy Policy.
          </Text>
        </View>
      </View>
    </View>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View className="items-center">
      <View className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-1">
        {icon}
      </View>
      <Text className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
        {label}
      </Text>
    </View>
  );
}
