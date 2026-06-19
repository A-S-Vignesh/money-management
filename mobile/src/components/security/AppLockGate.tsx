// components/security/AppLockGate.tsx
// Foreground-resume security gate. Tracks the AppState lifecycle and
// flips `useSecurity.locked` to true when:
//
//   1. The user is signed in (lock makes no sense pre-auth)
//   2. Biometric unlock is enabled in Settings
//   3. The app was backgrounded for ≥ appLockTimeoutMs
//
// Also re-hides the dashboard balance on every foreground transition if
// `hideBalanceOnOpen` is set, so the value never lingers visible after a
// brief switch to another app.
//
// When `locked` is true, this component overlays <LockScreen /> on top
// of `children` so the rest of the navigator stays mounted underneath
// (avoids re-fetching data after every unlock).

import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus, View } from "react-native";

import { useAuth } from "@/lib/auth";
import { useSecurity } from "@/lib/security";
import { LockScreen } from "./LockScreen";

interface Props {
  children: React.ReactNode;
}

export function AppLockGate({ children }: Props) {
  const token = useAuth((s) => s.token);
  const authReady = useAuth((s) => s.hydrated);

  const hydrated = useSecurity((s) => s.hydrated);
  const locked = useSecurity((s) => s.locked);
  const biometricEnabled = useSecurity((s) => s.biometricEnabled);
  const appLockTimeoutMs = useSecurity((s) => s.appLockTimeoutMs);
  const hideBalanceOnOpen = useSecurity((s) => s.hideBalanceOnOpen);
  const backgroundedAt = useSecurity((s) => s.backgroundedAt);
  const lock = useSecurity((s) => s.lock);
  const unlock = useSecurity((s) => s.unlock);
  const setBalanceHidden = useSecurity((s) => s.setBalanceHidden);
  const noteBackgroundedAt = useSecurity((s) => s.noteBackgroundedAt);

  // If the user signs out, drop the lock so the next sign-in lands on
  // the dashboard directly — no leftover lock overlay over the auth flow.
  useEffect(() => {
    if (authReady && !token && locked) unlock();
  }, [token, authReady, locked, unlock]);

  // If biometric was just disabled while the screen is locked, drop the
  // lock — there's no auth method left to satisfy it.
  useEffect(() => {
    if (locked && !biometricEnabled) unlock();
  }, [biometricEnabled, locked, unlock]);

  // Use a ref for the latest values inside the AppState listener so we
  // don't re-subscribe on every store change (which would briefly drop
  // events on the transition).
  const stateRef = useRef({
    token,
    biometricEnabled,
    appLockTimeoutMs,
    hideBalanceOnOpen,
    backgroundedAt,
  });
  stateRef.current = {
    token,
    biometricEnabled,
    appLockTimeoutMs,
    hideBalanceOnOpen,
    backgroundedAt,
  };

  useEffect(() => {
    if (!hydrated) return;
    const onChange = (next: AppStateStatus) => {
      const s = stateRef.current;
      if (next === "background" || next === "inactive") {
        // Stamp the moment we left the foreground so the next resume can
        // measure the gap. "inactive" fires on iOS during multitasking
        // peek / Control Center; we treat it the same as background to
        // be safe.
        if (s.backgroundedAt == null) noteBackgroundedAt(Date.now());
        return;
      }
      if (next === "active") {
        const since = s.backgroundedAt;
        noteBackgroundedAt(null);
        if (!s.token) return; // signed-out → nothing to protect
        if (s.hideBalanceOnOpen) setBalanceHidden(true);
        if (!s.biometricEnabled) return;
        if (since == null) return;
        const elapsed = Date.now() - since;
        if (elapsed >= s.appLockTimeoutMs) lock();
      }
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [hydrated, lock, noteBackgroundedAt, setBalanceHidden]);

  // Don't render the lock until auth + security stores are both hydrated,
  // otherwise we'd briefly show the lock screen over an empty app before
  // realising the user isn't signed in.
  const showLock = hydrated && authReady && !!token && locked;

  return (
    <View style={{ flex: 1 }} collapsable={false}>
      {children}
      {showLock ? <LockScreen /> : null}
    </View>
  );
}
