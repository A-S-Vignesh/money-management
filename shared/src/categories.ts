// Cross-platform category color mapping. The web app uses Tailwind classes
// (`bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200`), but RN
// can't parse those strings. This map exposes the underlying hex values so
// native UIs can render badges directly.
//
// Keys are CategoryName values from validations/transaction.ts.

export type CategoryPalette = {
  bgLight: string;
  bgDark: string;
  textLight: string;
  textDark: string;
  accent: string;
};

export const categoryPalettes: Record<string, CategoryPalette> = {
  Food:      { bgLight: "#fee2e2", bgDark: "#7f1d1d66", textLight: "#991b1b", textDark: "#fecaca", accent: "#ef4444" },
  Housing:   { bgLight: "#dbeafe", bgDark: "#1e3a8a66", textLight: "#1e40af", textDark: "#bfdbfe", accent: "#3b82f6" },
  Transport: { bgLight: "#dcfce7", bgDark: "#14532d66", textLight: "#166534", textDark: "#bbf7d0", accent: "#22c55e" },
  Lifestyle: { bgLight: "#f3e8ff", bgDark: "#581c8766", textLight: "#6b21a8", textDark: "#e9d5ff", accent: "#a855f7" },
  Shopping:  { bgLight: "#fef9c3", bgDark: "#713f1266", textLight: "#854d0e", textDark: "#fde68a", accent: "#eab308" },
  Learning:  { bgLight: "#e0e7ff", bgDark: "#312e8166", textLight: "#3730a3", textDark: "#c7d2fe", accent: "#6366f1" },
  Personal:  { bgLight: "#fce7f3", bgDark: "#831843", textLight: "#9d174d", textDark: "#fbcfe8", accent: "#ec4899" },
  Salary:    { bgLight: "#dcfce7", bgDark: "#14532d66", textLight: "#166534", textDark: "#bbf7d0", accent: "#22c55e" },
  Transfer:  { bgLight: "#dbeafe", bgDark: "#1e3a8a66", textLight: "#1e40af", textDark: "#bfdbfe", accent: "#3b82f6" },
  Other:     { bgLight: "#f3f4f6", bgDark: "#1f2937",   textLight: "#1f2937", textDark: "#e5e7eb", accent: "#6b7280" },
};

export function getCategoryPalette(name: string): CategoryPalette {
  return categoryPalettes[name] ?? categoryPalettes.Other;
}
