// lib/format.ts
// Matches the Mobile UI mock's `fmtINR(value, { compact })`. Compact mode
// gives `₹1.2L` / `₹15k` / `₹650` — used in charts and hero strips where
// real estate is tight. The locale formatter handles the comma grouping
// for the non-compact path.

interface Options {
  compact?: boolean;
  /** Currency code passed to Intl.NumberFormat (defaults to INR). */
  currency?: string;
}

export function formatCurrency(value: number, opts: Options | string = {}): string {
  // Allow legacy `formatCurrency(n, "USD")` callers from the older signature.
  const { compact = false, currency = "INR" } =
    typeof opts === "string" ? { currency: opts } : opts;

  if (value == null || Number.isNaN(value)) return "—";

  const n = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (compact && n >= 100_000) {
    return `${sign}₹${stripTrailingZero((n / 100_000).toFixed(1))}L`;
  }
  if (compact && n >= 1_000) {
    return `${sign}₹${stripTrailingZero((n / 1_000).toFixed(1))}k`;
  }

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${sign}₹${n.toLocaleString("en-IN")}`;
  }
}

function stripTrailingZero(s: string): string {
  return s.replace(/\.0$/, "");
}
