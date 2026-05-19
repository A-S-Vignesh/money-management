// src/app/index.tsx — auth gate.
// Decides whether the user lands inside the tabs or on the login screen.
// Hydration is handled in _layout, so by the time this renders, the auth
// store has its token state from SecureStore.

import { Redirect } from "expo-router";
import { useAuth } from "@/lib/auth";

export default function Index() {
  const token = useAuth((s) => s.token);
  return <Redirect href={token ? "/(tabs)" : "/(auth)/login"} />;
}
