// components/ui/MetricCard.tsx
// Compact stat tile used in rows on the Dashboard / Reports. Pairs a
// labelled value with a colored icon chip and an optional delta indicator.

import { Text, View } from "react-native";
import { type LucideIcon } from "lucide-react-native";

import { SectionCard } from "./SectionCard";

export type Tone = "indigo" | "emerald" | "rose" | "amber" | "blue" | "slate";

const toneBg: Record<Tone, string> = {
  indigo: "bg-indigo-100 dark:bg-indigo-950/50",
  emerald: "bg-emerald-100 dark:bg-emerald-950/50",
  rose: "bg-rose-100 dark:bg-rose-950/50",
  amber: "bg-amber-100 dark:bg-amber-950/50",
  blue: "bg-blue-100 dark:bg-blue-950/50",
  slate: "bg-slate-100 dark:bg-slate-800",
};

const toneIconColor: Record<Tone, string> = {
  indigo: "#6366f1",
  emerald: "#10b981",
  rose: "#f43f5e",
  amber: "#f59e0b",
  blue: "#3b82f6",
  slate: "#64748b",
};

interface Props {
  label: string;
  value: string;
  tone?: Tone;
  Icon?: LucideIcon;
  delta?: { value: string; positive: boolean } | null;
  /** Fills the card height — useful inside row containers. */
  fill?: boolean;
}

export function MetricCard({
  label,
  value,
  tone = "indigo",
  Icon,
  delta = null,
  fill = true,
}: Props) {
  return (
    <SectionCard density="compact" className={fill ? "flex-1" : ""}>
      <View className="flex-row items-start justify-between mb-3">
        {Icon ? (
          <View
            className={`${toneBg[tone]} w-9 h-9 rounded-xl items-center justify-center`}
          >
            <Icon size={18} color={toneIconColor[tone]} />
          </View>
        ) : (
          <View className="w-9 h-9" />
        )}
        {delta && (
          <View
            className={`px-2 py-0.5 rounded-full ${
              delta.positive
                ? "bg-emerald-100 dark:bg-emerald-950/50"
                : "bg-rose-100 dark:bg-rose-950/50"
            }`}
          >
            <Text
              className={`text-[10px] font-semibold ${
                delta.positive
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-rose-700 dark:text-rose-300"
              }`}
            >
              {delta.positive ? "▲" : "▼"} {delta.value}
            </Text>
          </View>
        )}
      </View>
      <Text className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 dark:text-neutral-400 mb-1">
        {label}
      </Text>
      <Text
        className="text-xl font-bold text-gray-900 dark:text-neutral-100"
        style={{ letterSpacing: -0.4 }}
      >
        {value}
      </Text>
    </SectionCard>
  );
}
