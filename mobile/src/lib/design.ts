// lib/design.ts
// Runtime design tokens — hex values that need to be passed to non-Tailwind
// APIs (react-native-svg, chart fills, NativeTabs colors, etc.). The same
// values are encoded in tailwind.config.js for Tailwind class consumers.

export const Tokens = {
  // Brand: blue
  brand: "#2563eb",
  brand2: "#3b82f6",
  brand3: "#1e40af",
  brandSoft: "#dbeafe",

  // Status
  emerald: "#059669",
  emeraldSoft: "#d1fae5",
  emeraldBg: "#ecfdf5",
  rose: "#e11d48",
  roseSoft: "#ffe4e6",
  roseBg: "#fff1f3",
  amber: "#d97706",
  amberSoft: "#fde68a",
  amberBg: "#fffbeb",
  purple: "#9333ea",
  purpleSoft: "#f3e8ff",
  teal: "#0d9488",
  tealSoft: "#ccfbf1",
  pink: "#db2777",
  pinkSoft: "#fce7f3",
  blue: "#2563eb",
  blueSoft: "#dbeafe",

  // Neutrals — light
  bg: "#f5f6fa",
  bgElev: "#eef0f6",
  card: "#ffffff",
  cardSoft: "#f8f9fc",
  border: "#ececf2",
  borderStrong: "#e2e3ec",
  text: "#0b0d12",
  textMuted: "#5e6373",
  textDim: "#8a90a0",

  // Neutrals — dark
  bgDark: "#0a0b0e",
  bgElevDark: "#111217",
  cardDark: "#15171c",
  cardSoftDark: "#1a1c22",
  borderDark: "#23252d",
  borderStrongDark: "#2c2f38",
  textDarkPrimary: "#f4f5f8",
  textMutedDark: "#a7adbc",
  textDimDark: "#767c8c",
} as const;

// Tone → { background, foreground } hex pairs used by IconTile and Chip
// when we need to pass actual colors to the icon's fill prop (Tailwind's
// `text-emerald-600` doesn't propagate into the SVG icon's stroke).
export type Tone =
  | "brand"
  | "emerald"
  | "rose"
  | "amber"
  | "purple"
  | "teal"
  | "pink"
  | "blue";

export const tonePalette: Record<
  Tone,
  { bgLight: string; bgDark: string; fg: string; fgDark: string }
> = {
  brand: { bgLight: Tokens.brandSoft, bgDark: "#1e3a8a40", fg: Tokens.brand, fgDark: "#93c5fd" },
  emerald: { bgLight: Tokens.emeraldBg, bgDark: "#064e3b40", fg: Tokens.emerald, fgDark: "#6ee7b7" },
  rose: { bgLight: Tokens.roseBg, bgDark: "#4c051940", fg: Tokens.rose, fgDark: "#fda4af" },
  amber: { bgLight: Tokens.amberBg, bgDark: "#78350f40", fg: Tokens.amber, fgDark: "#fcd34d" },
  purple: { bgLight: Tokens.purpleSoft, bgDark: "#4c1d9540", fg: Tokens.purple, fgDark: "#c4b5fd" },
  teal: { bgLight: Tokens.tealSoft, bgDark: "#134e4a40", fg: Tokens.teal, fgDark: "#5eead4" },
  pink: { bgLight: Tokens.pinkSoft, bgDark: "#83184340", fg: Tokens.pink, fgDark: "#f9a8d4" },
  blue: { bgLight: Tokens.blueSoft, bgDark: "#1e3a8a40", fg: Tokens.blue, fgDark: "#93c5fd" },
};
