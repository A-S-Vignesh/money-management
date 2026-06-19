// lib/format.ts
// Currency + date formatting that reads the user's preferences from
// Zustand stores. Compact currency adapts to the currency's number
// system (Indian Lakh vs western Million); date formatting honours the
// user's chosen shape (DD MMM YYYY, MM/DD/YYYY, etc.) with three modes
// — full / short (no year) / weekday — derived from a single pref.

import dayjs from "dayjs";

import { CURRENCIES, useCurrency, type CurrencyInfo } from "./currency";
import { useDateFormat } from "./dateFormat";

interface Options {
  compact?: boolean;
  /** Override the store's currency for one-off formatting. */
  currency?: string;
}

export function formatCurrency(value: number, opts: Options | string = {}): string {
  // Allow legacy `formatCurrency(n, "USD")` callers from the older signature.
  const { compact = false, currency: overrideCurrency } =
    typeof opts === "string" ? { currency: opts } : opts;

  if (value == null || Number.isNaN(value)) return "—";

  // Read from the currency store (or use override)
  const info = useCurrency.getState().info();
  const currencyCode = overrideCurrency ?? info.code;

  // Find the matching CurrencyInfo for the code we're using
  const resolvedInfo: CurrencyInfo =
    CURRENCIES.find((c) => c.code === currencyCode) ?? info;

  const n = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const sym = resolvedInfo.symbol;

  // Compact mode — adapts to the currency's number system
  if (compact) {
    if (n >= resolvedInfo.compactThreshold) {
      const divisor = resolvedInfo.compactThreshold;
      return `${sign}${sym}${stripTrailingZero((n / divisor).toFixed(1))}${resolvedInfo.compactM}`;
    }
    if (n >= 1_000) {
      return `${sign}${sym}${stripTrailingZero((n / 1_000).toFixed(1))}${resolvedInfo.compactK}`;
    }
  }

  try {
    return new Intl.NumberFormat(resolvedInfo.locale, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${sign}${sym}${n.toLocaleString(resolvedInfo.locale)}`;
  }
}

function stripTrailingZero(s: string): string {
  return s.replace(/\.0$/, "");
}

// ── Date formatting ──────────────────────────────────────────────────────

export type DateMode = "full" | "short" | "weekday";

/**
 * Format a date value according to the user's date-format preference.
 *
 * Accepts anything dayjs can parse (ISO string, Date, dayjs instance,
 * unix ms). Returns "—" on null/undefined/invalid input rather than
 * throwing — important because some surfaces (e.g. transaction rows)
 * render in tight loops where one bad row shouldn't blow up the list.
 *
 * Read non-reactively from the date-format store. Components that need
 * to re-render on a preference change should subscribe to
 * `useDateFormat((s) => s.code)` — the same pattern as currency.
 */
export function formatDate(
  value: string | number | Date | null | undefined,
  mode: DateMode = "full",
): string {
  if (value == null) return "—";
  const d = dayjs(value);
  if (!d.isValid()) return "—";
  const info = useDateFormat.getState().info();
  const pattern =
    mode === "weekday" ? info.weekday : mode === "short" ? info.short : info.full;
  return d.format(pattern);
}
