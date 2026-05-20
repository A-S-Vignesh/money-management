// components/ui/EmptyState.tsx
// Replaces flat "No data" sentences with an icon-led empty state. Adds
// visual breathing room and signals intent (not just "no data, sorry").

import { Text, View } from "react-native";
import { type LucideIcon } from "lucide-react-native";

interface Props {
  Icon: LucideIcon;
  title: string;
  subtitle?: string;
  tone?: "neutral" | "indigo" | "rose" | "emerald";
}

const toneBg = {
  neutral: "bg-gray-100 dark:bg-neutral-800",
  indigo: "bg-indigo-100 dark:bg-indigo-950/40",
  rose: "bg-rose-100 dark:bg-rose-950/40",
  emerald: "bg-emerald-100 dark:bg-emerald-950/40",
} as const;
const toneIcon = {
  neutral: "#6b7280",
  indigo: "#6366f1",
  rose: "#f43f5e",
  emerald: "#10b981",
} as const;

export function EmptyState({ Icon, title, subtitle, tone = "neutral" }: Props) {
  return (
    <View className="items-center py-10 px-4">
      <View
        className={`${toneBg[tone]} w-14 h-14 rounded-2xl items-center justify-center mb-3`}
      >
        <Icon size={22} color={toneIcon[tone]} />
      </View>
      <Text className="text-base font-semibold text-gray-900 dark:text-neutral-100 mb-1">
        {title}
      </Text>
      {subtitle ? (
        <Text className="text-xs text-gray-500 dark:text-neutral-400 text-center max-w-[220px]">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
