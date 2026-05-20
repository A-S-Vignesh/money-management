// ScreenHead — title + subtitle row for inner screens (Reports, Profile,
// Budgets, Transactions). Mirrors `.sticky-head + .h-screen` from the mock.

import { Text, View } from "react-native";

interface Props {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

export function ScreenHead({ title, subtitle, leading, trailing }: Props) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        paddingVertical: 14,
      }}
    >
      {leading}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          className="text-fg dark:text-fg-dark text-[26px] font-bold tracking-tight"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-fg-muted dark:text-fg-dark-muted text-[13px] mt-1">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}
