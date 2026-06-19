// lib/notifications.ts — Push & local notifications.
//
// Three concerns live here so they stay coordinated:
//
//   1. A Zustand store of per-user preferences (push / email / budget /
//      invest), keyed by user._id and persisted in AsyncStorage — same
//      shape as security.ts so the layout's hydration loop is symmetric.
//
//   2. The OS permission + Expo push token registration flow, wrapped
//      behind a single `setPushNotif(true)` call so the Settings toggle
//      can stay dumb.
//
//   3. A local-notification helper (`notifyBudgetCrossed`) for the one
//      event the client can detect on its own: an expense transaction
//      that pushes a tracked budget over 80% or 100%. Fired from
//      useAddTransaction's onSuccess. Cooldown prevents a flurry of
//      small expenses from spamming the same alert.
//
// ── Expo Go workaround ───────────────────────────────────────────────
// SDK 53+ removed remote-push support from Expo Go, and even *importing*
// expo-notifications now crashes the dev bridge because the package
// eagerly registers a push-token listener at module load (the
// DevicePushTokenAutoRegistration.fx side-effect file throws).
//
// So we don't static-import expo-notifications at all. Instead we
// `require()` it lazily inside `getNotifications()`, and that function
// short-circuits to `null` whenever the app is running in Expo Go.
//
// Net effect:
//   • Expo Go: store works, Settings UI works, prefs persist. Toggling
//     "Push notifications" surfaces a friendly "use a dev build" alert.
//     No real banners fire.
//   • Dev build / TestFlight / Play Store build: full functionality —
//     OS permission prompt, Expo push token, foreground handler,
//     budget-alert banners.
//
// Switch via `eas build --profile development` to light everything up.

import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const KEY_PREFIX = "@money-nest/notif";
const k = (suffix: string, uid: string) => `${KEY_PREFIX}/${suffix}:${uid}`;

const persist = async (key: string, val: string) => {
  try {
    await AsyncStorage.setItem(key, val);
  } catch {
    // Sandboxed storage failure is non-fatal; in-memory state still
    // reflects the user's choice for this session.
  }
};

// ── Lazy expo-notifications loader ──────────────────────────────────

// Both checks because `appOwnership` is the legacy API (still set on
// Android SDK 55) and `executionEnvironment === "storeClient"` is the
// modern equivalent. Belt + braces — one of them will catch Expo Go on
// any platform/SDK combo we'll plausibly ship against.
const isExpoGo =
  Constants.appOwnership === "expo" ||
  Constants.executionEnvironment === "storeClient";

type NotificationsModule = typeof import("expo-notifications");
// `undefined` = not yet attempted; `null` = attempted and unavailable.
// This three-state lets us cache both the success and failure paths
// without retrying require() on every call.
let _Notifications: NotificationsModule | null | undefined;

function getNotifications(): NotificationsModule | null {
  if (isExpoGo) return null;
  if (_Notifications !== undefined) return _Notifications;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _Notifications = require("expo-notifications") as NotificationsModule;
    return _Notifications;
  } catch (e) {
    console.warn(
      "[notifications] expo-notifications unavailable",
      (e as Error).message,
    );
    _Notifications = null;
    return null;
  }
}

// Mirrors `Notifications.PermissionStatus`. Inlined so callers outside
// this module don't need to depend on expo-notifications' type surface.
type PermissionStatus = "granted" | "denied" | "undetermined";

// ── Boot-time handler config ────────────────────────────────────────

let __handlerConfigured = false;
export function configureNotificationHandler() {
  if (__handlerConfigured) return;
  __handlerConfigured = true;
  const N = getNotifications();
  if (!N) return;

  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // Android channel: without an explicit HIGH-importance channel,
  // notifications appear silently under "Misc" and many users never
  // see them. Done here (not lazily) so the very first notif routes
  // correctly even before the user opens Settings.
  if (Platform.OS === "android") {
    N.setNotificationChannelAsync("default", {
      name: "General alerts",
      importance: N.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2563eb",
    }).catch(() => {
      // OS may reject channel creation on very early boot; safe to ignore.
    });
  }
}

// ── Permission + token registration ─────────────────────────────────

async function requestAndRegister(): Promise<{
  ok: boolean;
  status: PermissionStatus;
  token: string | null;
  reason?: string;
}> {
  const N = getNotifications();
  if (!N) {
    return {
      ok: false,
      status: "undetermined",
      token: null,
      reason:
        "Expo Go doesn't support notifications. Switch to a development build to enable them.",
    };
  }
  const cur = await N.getPermissionsAsync();
  let status = cur.status as PermissionStatus;
  if (status !== "granted") {
    const res = await N.requestPermissionsAsync();
    status = res.status as PermissionStatus;
  }
  if (status !== "granted") {
    return { ok: false, status, token: null, reason: "OS permission denied" };
  }
  if (!Device.isDevice) {
    return { ok: true, status, token: null, reason: "Simulator: local only" };
  }
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as
      | string
      | undefined;
    if (!projectId) {
      return { ok: true, status, token: null, reason: "No EAS projectId" };
    }
    const t = await N.getExpoPushTokenAsync({ projectId });
    return { ok: true, status, token: t.data };
  } catch (e) {
    console.warn("[notifications] token fetch failed", (e as Error).message);
    return { ok: true, status, token: null, reason: "Token fetch failed" };
  }
}

// ── Persisted preferences store ─────────────────────────────────────

interface NotifPrefsState {
  currentUserId: string | null;
  hydrated: boolean;

  pushNotif: boolean;
  emailDigests: boolean;
  budgetAlerts: boolean;
  investUpdates: boolean;

  expoPushToken: string | null;
  permissionStatus: PermissionStatus;

  hydrateFor: (userId: string | null) => Promise<void>;
  setPushNotif: (next: boolean) => Promise<{ ok: boolean; reason?: string }>;
  setEmailDigests: (next: boolean) => Promise<void>;
  setBudgetAlerts: (next: boolean) => Promise<void>;
  setInvestUpdates: (next: boolean) => Promise<void>;
}

// Defaults: everything important on, investment chatter off — opts a
// first-time user into the alerts that actually save them money without
// us prompting OS permission until they explicitly tap the switch.
const DEFAULTS = {
  pushNotif: true,
  emailDigests: true,
  budgetAlerts: true,
  investUpdates: false,
};

export const useNotifPrefs = create<NotifPrefsState>((set, get) => ({
  currentUserId: null,
  hydrated: false,
  ...DEFAULTS,
  expoPushToken: null,
  permissionStatus: "undetermined",

  hydrateFor: async (uid) => {
    if (get().currentUserId === uid && get().hydrated) return;
    if (!uid) {
      set({
        currentUserId: null,
        hydrated: true,
        ...DEFAULTS,
        expoPushToken: null,
        permissionStatus: "undetermined",
      });
      return;
    }
    try {
      const [push, mail, budget, invest, token] = await Promise.all([
        AsyncStorage.getItem(k("push", uid)),
        AsyncStorage.getItem(k("mail", uid)),
        AsyncStorage.getItem(k("budget", uid)),
        AsyncStorage.getItem(k("invest", uid)),
        AsyncStorage.getItem(k("token", uid)),
      ]);
      // Probe the OS permission status only if the module is actually
      // loadable — in Expo Go we leave it as `undetermined` so the
      // gating logic in notifyBudgetCrossed never tries to fire.
      let permissionStatus: PermissionStatus = "undetermined";
      const N = getNotifications();
      if (N) {
        try {
          const p = await N.getPermissionsAsync();
          permissionStatus = p.status as PermissionStatus;
        } catch {
          // Probe failure non-fatal — we'll re-check next time the
          // toggle is flipped.
        }
      }
      set({
        currentUserId: uid,
        hydrated: true,
        pushNotif: push === null ? DEFAULTS.pushNotif : push === "1",
        emailDigests: mail === null ? DEFAULTS.emailDigests : mail === "1",
        budgetAlerts: budget === null ? DEFAULTS.budgetAlerts : budget === "1",
        investUpdates:
          invest === null ? DEFAULTS.investUpdates : invest === "1",
        expoPushToken: token,
        permissionStatus,
      });
    } catch {
      set({ currentUserId: uid, hydrated: true });
    }
  },

  setPushNotif: async (next) => {
    const uid = get().currentUserId;
    if (next) {
      // Turning ON: route through the OS permission + token flow.
      // If the OS says no, we leave the toggle off so the UI doesn't
      // lie to the user about being subscribed.
      const result = await requestAndRegister();
      if (!result.ok) {
        set({ pushNotif: false, permissionStatus: result.status });
        if (uid) await persist(k("push", uid), "0");
        return { ok: false, reason: result.reason };
      }
      set({
        pushNotif: true,
        permissionStatus: result.status,
        expoPushToken: result.token ?? get().expoPushToken,
      });
      if (uid) {
        await persist(k("push", uid), "1");
        if (result.token) await persist(k("token", uid), result.token);
      }
      return { ok: true, reason: result.reason };
    }
    // Turning OFF: stop firing notifications. We deliberately don't
    // revoke OS permission — that's the user's job in system Settings,
    // and unsubscribing client-side is enough.
    set({ pushNotif: false });
    if (uid) await persist(k("push", uid), "0");
    return { ok: true };
  },

  setEmailDigests: async (next) => {
    const uid = get().currentUserId;
    set({ emailDigests: next });
    if (uid) await persist(k("mail", uid), next ? "1" : "0");
  },
  setBudgetAlerts: async (next) => {
    const uid = get().currentUserId;
    set({ budgetAlerts: next });
    if (uid) await persist(k("budget", uid), next ? "1" : "0");
  },
  setInvestUpdates: async (next) => {
    const uid = get().currentUserId;
    set({ investUpdates: next });
    if (uid) await persist(k("invest", uid), next ? "1" : "0");
  },
}));

// ── Local notification: budget threshold crossed ────────────────────
//
// Cooldown lives in module scope so a flurry of expense entries doesn't
// fire the same alert ten times. Resets on app restart — fine, because
// the threshold-crossing detection is already idempotent for the same
// budget in the same period (we only fire when the *previous* spend
// was below the band).

const COOLDOWN_MS = 30 * 60 * 1000;
const lastFired = new Map<string, number>();

export interface BudgetCrossedArgs {
  budgetId: string;
  budgetName: string;
  category: string;
  spent: number;
  allocated: number;
  /** Which band the new spend crossed — 80% warning or 100% blown. */
  threshold: 80 | 100;
}

export async function notifyBudgetCrossed(args: BudgetCrossedArgs) {
  const { pushNotif, budgetAlerts, permissionStatus } =
    useNotifPrefs.getState();
  if (!pushNotif || !budgetAlerts) return;
  if (permissionStatus !== "granted") return;

  const N = getNotifications();
  if (!N) return;

  const cooldownKey = `${args.budgetId}@${args.threshold}`;
  const last = lastFired.get(cooldownKey) ?? 0;
  if (Date.now() - last < COOLDOWN_MS) return;
  lastFired.set(cooldownKey, Date.now());

  const pct = Math.round((args.spent / args.allocated) * 100);
  const remaining = Math.max(0, args.allocated - args.spent);
  const title =
    args.threshold === 100
      ? `Budget reached — ${args.budgetName}`
      : `Budget at ${pct}% — ${args.budgetName}`;
  const body =
    args.threshold === 100
      ? `You've spent ₹${fmt(args.spent)} of your ₹${fmt(args.allocated)} ${args.category} budget.`
      : `₹${fmt(remaining)} left of your ₹${fmt(args.allocated)} ${args.category} budget.`;

  try {
    await N.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: "default",
        // Read by a future tap-listener in _layout to deep-link into
        // the budgets screen. Keep keys stable.
        data: { type: "budget", budgetId: args.budgetId },
      },
      trigger: null, // fire immediately
    });
  } catch (e) {
    console.warn(
      "[notifications] budget alert schedule failed",
      (e as Error).message,
    );
  }
}

function fmt(n: number): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
