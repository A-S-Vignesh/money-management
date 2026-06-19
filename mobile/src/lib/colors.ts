// lib/colors.ts
// Shared color manipulation utilities. Consolidated from inline duplicates
// in accounts, investments, reports, goals, budgets, and profile screens.

/**
 * Return a translucent tint of a hex color as an `rgba(…)` string.
 * Useful for icon-tile backgrounds where the colored icon should pop
 * against a same-hue but nearly-transparent surface.
 *
 * @param hex  A `#RRGGBB` (or `RRGGBB`) hex string.
 * @param alpha Opacity between 0 and 1.
 */
export function tint(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Brighten a `#RRGGBB` hex toward white by `amount` (0–1).
 * Used to give progress-bar fills a subtle gradient finish — the bar
 * fades a touch lighter at its leading edge, which reads as polished
 * without needing a real animation or shadow.
 *
 * @param hex    A `#RRGGBB` (or `RRGGBB`) hex string.
 * @param amount Blend factor toward white, 0 = unchanged, 1 = pure white.
 */
export function lightenHex(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}
