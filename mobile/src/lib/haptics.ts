// lib/haptics.ts
// Thin wrapper around expo-haptics. Exposes named helpers so call-sites
// read as `hapticLight()` instead of `Haptics.impactAsync(...)`.
// All calls are best-effort — silently swallowed on web / unsupported
// platforms so callers never need try-catch.

import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const isNative = Platform.OS === "ios" || Platform.OS === "android";

/** Light tap — chip selects, minor toggles */
export function hapticLight() {
  if (!isNative) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Medium tap — FAB press, save, important actions */
export function hapticMedium() {
  if (!isNative) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/** Heavy tap — destructive actions (delete confirm) */
export function hapticHeavy() {
  if (!isNative) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
}

/** Success notification — mutation succeeded */
export function hapticSuccess() {
  if (!isNative) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** Error notification — mutation failed */
export function hapticError() {
  if (!isNative) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}

/** Selection change — e.g. scroll wheel, picker */
export function hapticSelection() {
  if (!isNative) return;
  Haptics.selectionAsync().catch(() => {});
}
