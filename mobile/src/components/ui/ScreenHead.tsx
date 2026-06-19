// ScreenHead — title + subtitle row for inner screens (Reports, Profile,
// Budgets, Transactions). Mirrors `.sticky-head + .h-screen` from the mock.
//
// Pass `onMenu` to auto-render a dark-mode-aware hamburger. Saves every
// caller from re-implementing the same Pressable + Tokens.text icon that
// vanished in dark mode.

import {
  Pressable,
  Text,
  View,
} from "react-native";
import { Menu } from "lucide-react-native";
import { Tokens } from "@/lib/design";
import { useColorScheme } from "@/hooks/useAppColorScheme";

interface Props {
  title: string;
  subtitle?: string;
  onMenu?: () => void;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

export function ScreenHead({ title, subtitle, onMenu, leading, trailing }: Props) {
  const dark = useColorScheme() === "dark";

  const leadingNode =
    leading ?? (onMenu ? (
      <Pressable
        onPress={onMenu}
        accessibilityRole="button"
        accessibilityLabel="Open menu"
        accessibilityHint="Opens the side navigation drawer"
        android_ripple={{ color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", borderless: true }}
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
          backgroundColor: dark ? Tokens.cardDark : Tokens.card,
          borderWidth: 1,
          borderColor: dark ? Tokens.borderDark : Tokens.border,
        }}
      >
        <Menu size={20} color={dark ? Tokens.textDarkPrimary : Tokens.text} strokeWidth={2} />
      </Pressable>
    ) : null);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        paddingVertical: 14,
      }}
    >
      {leadingNode}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          className="text-fg dark:text-fg-dark text-[22px] font-bold tracking-tight"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-fg-muted dark:text-fg-dark-muted text-[13px] mt-0.5">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}
