// components/ui/EmptyState.tsx
// Replaces flat "No data" sentences with an icon-led empty state. Adds
// visual breathing room and signals intent (not just "no data, sorry").
// Optional CTA button to directly open the relevant add flow.

import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { type LucideIcon } from "lucide-react-native";
import { Tokens } from "@/lib/design";
import { useColorScheme } from "@/hooks/useAppColorScheme";

interface Props {
  Icon: LucideIcon;
  title: string;
  subtitle?: string;
  tone?: "neutral" | "indigo" | "rose" | "emerald";
  /** CTA button label — shown below the subtitle when provided. */
  actionLabel?: string;
  /** Callback for the CTA button. */
  onAction?: () => void;
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
const toneGradient: Record<string, [string, string]> = {
  neutral: ["#e5e7eb", "#d1d5db"],
  indigo: ["#e0e7ff", "#c7d2fe"],
  rose: ["#ffe4e6", "#fecdd3"],
  emerald: ["#d1fae5", "#a7f3d0"],
};
const toneGradientDark: Record<string, [string, string]> = {
  neutral: ["#27272a", "#3f3f46"],
  indigo: ["#312e81", "#3730a3"],
  rose: ["#4c0519", "#881337"],
  emerald: ["#052e16", "#064e3b"],
};

export function EmptyState({
  Icon,
  title,
  subtitle,
  tone = "neutral",
  actionLabel,
  onAction,
}: Props) {
  const dark = useColorScheme() === "dark";
  const gradient = dark ? toneGradientDark[tone] : toneGradient[tone];

  return (
    <View className="items-center py-10 px-4">
      {/* Icon tile with gradient background */}
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          overflow: "hidden",
          marginBottom: 12,
        }}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={26} color={toneIcon[tone]} strokeWidth={1.8} />
        </LinearGradient>
      </View>

      <Text className="text-base font-semibold text-gray-900 dark:text-neutral-100 mb-1">
        {title}
      </Text>
      {subtitle ? (
        <Text className="text-xs text-gray-500 dark:text-neutral-400 text-center max-w-[240px] leading-[18px]">
          {subtitle}
        </Text>
      ) : null}

      {/* CTA button */}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={{
            marginTop: 16,
            height: 38,
            paddingHorizontal: 20,
            borderRadius: 12,
            backgroundColor: Tokens.brand,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: Tokens.brand,
            shadowOpacity: 0.3,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 13,
              fontWeight: "700",
              letterSpacing: 0.2,
            }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
