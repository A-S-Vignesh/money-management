// useAppColorScheme — REACTIVE to in-app theme toggles.
//
// Why not `useColorScheme` from "react-native"? That hook only watches the
// OS appearance setting. When the user toggles dark mode INSIDE the app
// (via Settings or Profile), RN's useColorScheme doesn't re-fire and any
// component reading from it stays on the old theme — hamburger icons,
// chevrons, etc., all looked stuck in dark mode after toggling to light.
//
// This hook reads from our theme store's `resolved` value, which is
// updated whenever setPref / setPrefSmooth runs. Same return shape as
// react-native's hook (just `"light" | "dark"`) so it's a drop-in swap.

import { useTheme } from "@/lib/theme";

export function useColorScheme(): "light" | "dark" {
  return useTheme((s) => s.resolved);
}
