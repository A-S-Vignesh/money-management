/** @type {import('tailwindcss').Config} */
// Money Nest mobile — design tokens.
// Mirrors the Mobile UI/app.css palette but remaps `brand` from indigo to
// blue (#2563eb), per design direction. The named keys here match the web
// prototype's CSS variables so screen code reads the same way visually:
//   bg-surface, text-fg-muted, bg-brand, border-border-strong, etc.

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ── Brand: BLUE (was indigo in original mock) ──────────────
        brand: {
          DEFAULT: "#2563eb", // blue-600
          2: "#3b82f6", // blue-500
          3: "#1e40af", // blue-800 — deep, used for gradient bottoms
          soft: "#dbeafe", // blue-100
          "soft-2": "#bfdbfe", // blue-200
        },

        // ── Semantic surfaces (mapped to CSS-var equivalents) ──────
        surface: {
          DEFAULT: "#ffffff",
          subtle: "#f8f9fc",
          muted: "#f5f6fa",
          elev: "#eef0f6",
        },
        fg: {
          DEFAULT: "#0b0d12",
          muted: "#5e6373",
          dim: "#8a90a0",
        },
        edge: {
          DEFAULT: "#ececf2",
          strong: "#e2e3ec",
        },

        // ── Dark-mode equivalents (used via dark: variants) ────────
        "surface-dark": {
          DEFAULT: "#15171c",
          subtle: "#1a1c22",
          muted: "#111217",
          elev: "#0a0b0e",
        },
        "fg-dark": {
          DEFAULT: "#f4f5f8",
          muted: "#a7adbc",
          dim: "#767c8c",
        },
        "edge-dark": {
          DEFAULT: "#23252d",
          strong: "#2c2f38",
        },

        // ── Status tones ───────────────────────────────────────────
        emerald: {
          DEFAULT: "#059669",
          soft: "#d1fae5",
          bg: "#ecfdf5",
        },
        rose: {
          DEFAULT: "#e11d48",
          soft: "#ffe4e6",
          bg: "#fff1f3",
        },
        amber: {
          DEFAULT: "#d97706",
          soft: "#fde68a",
          bg: "#fffbeb",
        },
        purple: {
          DEFAULT: "#9333ea",
          soft: "#f3e8ff",
          bg: "#faf5ff",
        },
        teal: {
          DEFAULT: "#0d9488",
          soft: "#ccfbf1",
          bg: "#f0fdfa",
        },
        pink: {
          DEFAULT: "#db2777",
          soft: "#fce7f3",
          bg: "#fdf2f8",
        },
        blue: {
          DEFAULT: "#2563eb",
          soft: "#dbeafe",
          bg: "#eff6ff",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "sans-serif"],
        mono: ["ui-monospace", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
