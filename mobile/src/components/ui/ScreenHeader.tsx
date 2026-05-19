// components/ui/ScreenHeader.tsx
// Title + subtitle block used at the top of every tab. Optional trailing
// slot for icon buttons (notifications bell, settings cog, etc).

import { Text, View } from "react-native";

interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, right }: Props) {
  return (
    <View className="flex-row items-end justify-between mb-5">
      <View className="flex-1 mr-3">
        {subtitle ? (
          <Text className="text-sm text-gray-500 dark:text-neutral-400 mb-1">
            {subtitle}
          </Text>
        ) : null}
        <Text
          className="text-3xl font-bold text-gray-900 dark:text-neutral-50"
          style={{ letterSpacing: -0.5 }}
        >
          {title}
        </Text>
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}
