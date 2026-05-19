// lib/haptic.ts
//
// Thin wrapper around the Web Vibration API. Lets you sprinkle haptic
// feedback on key interactions (FAB tap, save, delete) without scattering
// `navigator.vibrate` checks everywhere.
//
// Notes on browser behavior:
//   - iOS Safari does NOT implement the Vibration API at all. Calls are
//     silently no-op'd — that's fine, we still want Android/Chromium to
//     get the feedback. Don't try to polyfill via audio hacks; it's worse
//     than no haptics.
//   - Android Chrome/Edge respect navigator.vibrate(ms) up to ~5000ms.
//   - Inside a PWA installed to home screen, vibration works on Android.
//   - When the page is hidden or the user hasn't interacted, browsers will
//     reject the call — that's also fine, we just no-op.

type HapticIntensity = "light" | "medium" | "heavy" | "success" | "error";

const PATTERNS: Record<HapticIntensity, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 35,
  // Short double-tap feel for success
  success: [12, 50, 12],
  // Stutter for errors
  error: [25, 80, 25],
};

export function haptic(intensity: HapticIntensity = "light"): void {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(PATTERNS[intensity]);
  } catch {
    /* some browsers throw if the document isn't visible — fine to ignore */
  }
}
