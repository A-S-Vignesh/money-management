// lib/theme.ts
// Zustand store for app theme, mirroring the web app's next-themes setup.
// Persists to AsyncStorage and reacts to OS appearance changes for "system".
//
// Exposes TWO setters:
//   - setPref(p)        — flips the theme instantly (used by the Profile
//                         screen's appearance picker, where the segmented
//                         control already gives visual feedback)
//   - setPrefSmooth(p)  — flips the theme behind a fade overlay (used by
//                         the Settings page Dark mode toggle, where an
//                         instant pop felt janky)
//
// setPrefSmooth works in two steps: it sets `transitionTo` so the
// ThemeTransitionOverlay starts its fade animation, and then the overlay
// calls commitTransition() at peak opacity, which actually applies the
// new theme. End result: the user never sees the synchronous re-render.

import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";
import { colorScheme as nwColorScheme } from "nativewind";

export type ThemePref = "system" | "light" | "dark";
export type Resolved = "light" | "dark";

const STORAGE_KEY = "@money-nest/theme";

function resolve(pref: ThemePref): Resolved {
  if (pref === "system") return (Appearance.getColorScheme() ?? "light") as Resolved;
  return pref;
}

interface ThemeState {
  pref: ThemePref;
  resolved: Resolved;
  hydrated: boolean;
  /** When non-null, ThemeTransitionOverlay is mid-fade. The target pref
   *  is committed at peak opacity via commitTransition(). */
  transitionTo: ThemePref | null;

  setPref: (next: ThemePref) => Promise<void>;
  setPrefSmooth: (next: ThemePref) => void;
  commitTransition: () => void;

  init: () => Promise<() => void>; // returns cleanup
}

async function persist(next: ThemePref) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Storage may be unavailable in some sandboxed contexts — ignore.
  }
}

export const useTheme = create<ThemeState>((set, get) => ({
  pref: "system",
  resolved: "light",
  hydrated: false,
  transitionTo: null,

  setPref: async (next) => {
    const resolved = resolve(next);
    nwColorScheme.set(next === "system" ? "system" : resolved);
    set({ pref: next, resolved });
    await persist(next);
  },

  // Kick off the overlay animation. The overlay will call commitTransition
  // at peak opacity, which is when the actual theme swap happens.
  setPrefSmooth: (next) => {
    if (get().transitionTo) return; // already mid-transition
    set({ transitionTo: next });
  },

  // Called by ThemeTransitionOverlay at peak opacity — applies the theme
  // change while the screen is hidden, then clears `transitionTo` so the
  // overlay knows to fade out.
  commitTransition: () => {
    const next = get().transitionTo;
    if (!next) return;
    const resolved = resolve(next);
    nwColorScheme.set(next === "system" ? "system" : resolved);
    set({ pref: next, resolved, transitionTo: null });
    void persist(next);
  },

  init: async () => {
    let stored: ThemePref = "system";
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw === "light" || raw === "dark" || raw === "system") stored = raw;
    } catch {}
    const resolved = resolve(stored);
    nwColorScheme.set(stored === "system" ? "system" : resolved);
    set({ pref: stored, resolved, hydrated: true });

    // React to OS theme changes when user picked "system".
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      if (get().pref !== "system") return;
      const r: Resolved = (colorScheme ?? "light") as Resolved;
      set({ resolved: r });
    });
    return () => sub.remove();
  },
}));
