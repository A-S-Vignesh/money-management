// lib/theme.ts
// Zustand store for app theme, mirroring the web app's next-themes setup.
// Persists to AsyncStorage and reacts to OS appearance changes for "system".

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
  setPref: (next: ThemePref) => Promise<void>;
  init: () => Promise<() => void>; // returns cleanup
}

export const useTheme = create<ThemeState>((set, get) => ({
  pref: "system",
  resolved: "light",
  hydrated: false,

  setPref: async (next) => {
    const resolved = resolve(next);
    nwColorScheme.set(next === "system" ? "system" : resolved);
    set({ pref: next, resolved });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage may be unavailable in some sandboxed contexts — ignore.
    }
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
