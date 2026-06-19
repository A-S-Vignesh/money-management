// lib/currency.ts
// Persisted Zustand store for the user's preferred display currency.
// Every `formatCurrency` call reads from this store so a single change
// propagates everywhere instantly.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  /** Locale for Intl.NumberFormat */
  locale: string;
  /** Label for compact suffix (K=thousands). Indian system uses L/k. */
  compactK: string;
  compactM: string;
  compactThreshold: number; // Use Lakh (100k) vs Million (1M)
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "INR", symbol: "₹", name: "Indian Rupee", flag: "🇮🇳", locale: "en-IN", compactK: "k", compactM: "L", compactThreshold: 100_000 },
  { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸", locale: "en-US", compactK: "K", compactM: "M", compactThreshold: 1_000_000 },
  { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺", locale: "de-DE", compactK: "K", compactM: "M", compactThreshold: 1_000_000 },
  { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧", locale: "en-GB", compactK: "K", compactM: "M", compactThreshold: 1_000_000 },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", flag: "🇯🇵", locale: "ja-JP", compactK: "K", compactM: "M", compactThreshold: 1_000_000 },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", flag: "🇦🇺", locale: "en-AU", compactK: "K", compactM: "M", compactThreshold: 1_000_000 },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", flag: "🇨🇦", locale: "en-CA", compactK: "K", compactM: "M", compactThreshold: 1_000_000 },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", flag: "🇸🇬", locale: "en-SG", compactK: "K", compactM: "M", compactThreshold: 1_000_000 },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", flag: "🇦🇪", locale: "ar-AE", compactK: "K", compactM: "M", compactThreshold: 1_000_000 },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", flag: "🇨🇭", locale: "de-CH", compactK: "K", compactM: "M", compactThreshold: 1_000_000 },
];

interface CurrencyState {
  code: string;
  setCode: (code: string) => void;
  /** Resolved CurrencyInfo from the list */
  info: () => CurrencyInfo;
}

export const useCurrency = create<CurrencyState>()(
  persist(
    (set, get) => ({
      code: "INR",
      setCode: (code) => set({ code }),
      info: () =>
        CURRENCIES.find((c) => c.code === get().code) ?? CURRENCIES[0],
    }),
    {
      name: "@money-nest/currency",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
