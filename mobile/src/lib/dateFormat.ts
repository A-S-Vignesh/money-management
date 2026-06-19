// lib/dateFormat.ts
// Persisted Zustand store for the user's preferred date display format.
// Mirrors lib/currency.ts in structure so the Settings sheet pattern can
// be reused.
//
// Each entry carries THREE dayjs format strings — one for full dates
// ("12 Jan 2026"), one for short dates ("12 Jan", used in tight rows
// like TxRow), and one weekday variant ("Mon, 12 Jan 2026", used in
// transaction detail). The short/weekday strings are derived from the
// chosen "shape" so a single user choice cascades through every surface
// consistently.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface DateFormatInfo {
  code: string;
  /** Label shown in Settings + sheet — matches the shape literally. */
  name: string;
  /** Rendered preview for the picker row (today's date in this shape). */
  sampleFormat: string;
  /** Full date (e.g. "12 Jan 2026"). */
  full: string;
  /** Compact date without the year (e.g. "12 Jan"). */
  short: string;
  /** With weekday prefix (e.g. "Mon, 12 Jan 2026"). */
  weekday: string;
}

export const DATE_FORMATS: DateFormatInfo[] = [
  {
    code: "DD_MMM_YYYY",
    name: "DD MMM YYYY",
    sampleFormat: "DD MMM YYYY",
    full: "DD MMM YYYY",
    short: "DD MMM",
    weekday: "ddd, DD MMM YYYY",
  },
  {
    code: "MMM_DD_YYYY",
    name: "MMM DD, YYYY",
    sampleFormat: "MMM DD, YYYY",
    full: "MMM DD, YYYY",
    short: "MMM DD",
    weekday: "ddd, MMM DD, YYYY",
  },
  {
    code: "DD_MM_YYYY",
    name: "DD/MM/YYYY",
    sampleFormat: "DD/MM/YYYY",
    full: "DD/MM/YYYY",
    short: "DD/MM",
    weekday: "ddd, DD/MM/YYYY",
  },
  {
    code: "MM_DD_YYYY",
    name: "MM/DD/YYYY",
    sampleFormat: "MM/DD/YYYY",
    full: "MM/DD/YYYY",
    short: "MM/DD",
    weekday: "ddd, MM/DD/YYYY",
  },
  {
    code: "YYYY_MM_DD",
    name: "YYYY-MM-DD",
    sampleFormat: "YYYY-MM-DD",
    full: "YYYY-MM-DD",
    short: "MM-DD",
    weekday: "ddd, YYYY-MM-DD",
  },
];

interface DateFormatState {
  code: string;
  setCode: (code: string) => void;
  /** Resolved DateFormatInfo from the list. */
  info: () => DateFormatInfo;
}

export const useDateFormat = create<DateFormatState>()(
  persist(
    (set, get) => ({
      code: "DD_MMM_YYYY",
      setCode: (code) => set({ code }),
      info: () =>
        DATE_FORMATS.find((c) => c.code === get().code) ?? DATE_FORMATS[0],
    }),
    {
      name: "@money-nest/date-format",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
