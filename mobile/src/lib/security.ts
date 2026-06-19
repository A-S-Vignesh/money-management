// lib/security.ts
// Zustand store for app-level security preferences, scoped PER user:
//
//   - biometricEnabled    : whether to require Face ID / Touch ID / device
//                           passcode when resuming the app after the lock
//                           timeout has elapsed
//   - appLockTimeoutMs    : how long the app can be backgrounded before the
//                           next foreground transition requires re-auth
//   - hideBalanceOnOpen   : whether the dashboard's balance is rendered as
//                           dots until the user explicitly reveals it
//
// And the in-memory runtime flags that drive the lock overlay:
//
//   - locked              : true → render LockScreen on top of everything
//   - balanceHidden       : current visibility state of balance values;
//                           dashboard's eye-toggle flips this without
//                           changing the persisted preference
//
// Persistence keys are namespaced by Google `user._id` so different
// accounts on the same device have independent settings. Signing out
// reloads the store with the null-user defaults (all-off), and signing
// in as a different account loads that account's saved prefs (or
// defaults if it's their first time on this device).

import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PREFIX = "@money-nest/sec";

function storageKey(suffix: "biometric" | "lockMs" | "hideBalance", userId: string) {
  return `${KEY_PREFIX}/${suffix}:${userId}`;
}

const DEFAULT_LOCK_MS = 60_000; // 1 minute — matches the Settings UI label

export const APP_LOCK_TIMEOUT_OPTIONS = [
  { ms: 0, label: "Immediately" },
  { ms: 15_000, label: "After 15 sec" },
  { ms: 30_000, label: "After 30 sec" },
  { ms: 60_000, label: "After 1 min" },
  { ms: 5 * 60_000, label: "After 5 min" },
  { ms: 15 * 60_000, label: "After 15 min" },
] as const;

export function lockTimeoutLabel(ms: number): string {
  const match = APP_LOCK_TIMEOUT_OPTIONS.find((o) => o.ms === ms);
  return match?.label ?? "After 1 min";
}

interface SecurityState {
  // Identity this store is currently configured for. Null when signed-out.
  currentUserId: string | null;

  // Persisted-per-account preferences
  biometricEnabled: boolean;
  appLockTimeoutMs: number;
  hideBalanceOnOpen: boolean;

  // In-memory runtime state
  locked: boolean;
  balanceHidden: boolean;
  /** Wallclock timestamp (ms) when the app last entered background, or null. */
  backgroundedAt: number | null;
  hydrated: boolean;

  // Persisted-preference setters (no-ops when signed-out / currentUserId is null)
  setBiometricEnabled: (next: boolean) => Promise<void>;
  setAppLockTimeoutMs: (next: number) => Promise<void>;
  setHideBalanceOnOpen: (next: boolean) => Promise<void>;
  cycleAppLockTimeout: () => Promise<void>;

  // Runtime helpers
  lock: () => void;
  unlock: () => void;
  setBalanceHidden: (next: boolean) => void;
  noteBackgroundedAt: (at: number | null) => void;

  /**
   * Load (or reload) preferences for the given user. Pass `null` when
   * signed-out to drop everything back to the safe defaults. Idempotent
   * for the same userId — safe to call from a useEffect that depends on
   * `user?._id`.
   */
  hydrateFor: (userId: string | null) => Promise<void>;
}

async function persist(key: string, value: string) {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // Storage may be unavailable in sandboxed contexts — non-fatal.
  }
}

export const useSecurity = create<SecurityState>((set, get) => ({
  currentUserId: null,

  biometricEnabled: false,
  appLockTimeoutMs: DEFAULT_LOCK_MS,
  hideBalanceOnOpen: false,

  locked: false,
  balanceHidden: false,
  backgroundedAt: null,
  hydrated: false,

  setBiometricEnabled: async (next) => {
    const uid = get().currentUserId;
    set({ biometricEnabled: next });
    if (uid) await persist(storageKey("biometric", uid), next ? "1" : "0");
  },

  setAppLockTimeoutMs: async (next) => {
    const uid = get().currentUserId;
    set({ appLockTimeoutMs: next });
    if (uid) await persist(storageKey("lockMs", uid), String(next));
  },

  setHideBalanceOnOpen: async (next) => {
    // Apply to the current session immediately so the user sees the effect
    // without re-launching: flipping ON re-hides; flipping OFF reveals.
    const uid = get().currentUserId;
    set({ hideBalanceOnOpen: next, balanceHidden: next });
    if (uid) await persist(storageKey("hideBalance", uid), next ? "1" : "0");
  },

  cycleAppLockTimeout: async () => {
    const uid = get().currentUserId;
    const cur = get().appLockTimeoutMs;
    const idx = APP_LOCK_TIMEOUT_OPTIONS.findIndex((o) => o.ms === cur);
    const next =
      APP_LOCK_TIMEOUT_OPTIONS[(idx + 1) % APP_LOCK_TIMEOUT_OPTIONS.length].ms;
    set({ appLockTimeoutMs: next });
    if (uid) await persist(storageKey("lockMs", uid), String(next));
  },

  lock: () => set({ locked: true }),
  unlock: () => set({ locked: false, backgroundedAt: null }),
  setBalanceHidden: (next) => set({ balanceHidden: next }),
  noteBackgroundedAt: (at) => set({ backgroundedAt: at }),

  hydrateFor: async (userId) => {
    // Skip redundant reloads (e.g. an effect re-runs but the user didn't
    // actually change). Still flip `hydrated` to true so consumers know
    // the initial load has completed.
    if (get().currentUserId === userId && get().hydrated) return;

    if (!userId) {
      // Signed-out: reset to defaults, clear runtime flags.
      set({
        currentUserId: null,
        biometricEnabled: false,
        appLockTimeoutMs: DEFAULT_LOCK_MS,
        hideBalanceOnOpen: false,
        locked: false,
        balanceHidden: false,
        backgroundedAt: null,
        hydrated: true,
      });
      return;
    }

    try {
      const [bio, lockMs, hide] = await Promise.all([
        AsyncStorage.getItem(storageKey("biometric", userId)),
        AsyncStorage.getItem(storageKey("lockMs", userId)),
        AsyncStorage.getItem(storageKey("hideBalance", userId)),
      ]);
      const biometricEnabled = bio === "1";
      const parsedLockMs = lockMs ? Number(lockMs) : DEFAULT_LOCK_MS;
      const appLockTimeoutMs = Number.isFinite(parsedLockMs)
        ? parsedLockMs
        : DEFAULT_LOCK_MS;
      const hideBalanceOnOpen = hide === "1";
      set({
        currentUserId: userId,
        biometricEnabled,
        appLockTimeoutMs,
        hideBalanceOnOpen,
        balanceHidden: hideBalanceOnOpen,
        // Lock whenever we hydrate prefs for a user that has biometric
        // unlock enabled. This fires on cold start AND on every fresh
        // sign-in — so signing out and back in does NOT bypass the
        // biometric requirement (closes the "logout to skip lock" hole).
        // Google sign-in alone isn't sufficient: if a stolen device
        // still has the Google account session live, the lock screen
        // is the second factor.
        locked: biometricEnabled,
        hydrated: true,
      });
    } catch {
      set({ currentUserId: userId, hydrated: true });
    }
  },
}));
