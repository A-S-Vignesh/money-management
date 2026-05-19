// components/ui/PeriodSelector.tsx
// Segmented control with a smoothly-animated indicator behind the active
// label. Uses Reanimated 3 for the slide so it's still 60fps under load.

import { useEffect } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";

export type Period = "W" | "M" | "Q" | "Y";

interface Props {
  value: Period;
  onChange: (next: Period) => void;
  options?: { value: Period; label: string }[];
}

const DEFAULTS: { value: Period; label: string }[] = [
  { value: "W", label: "Week" },
  { value: "M", label: "Month" },
  { value: "Q", label: "Quarter" },
  { value: "Y", label: "Year" },
];

export function PeriodSelector({ value, onChange, options = DEFAULTS }: Props) {
  const idx = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const translateX = useSharedValue(idx);
  const win = useWindowDimensions();

  useEffect(() => {
    translateX.value = withTiming(idx, {
      duration: 220,
      easing: Easing.bezier(0.32, 0.72, 0, 1),
    });
  }, [idx, translateX]);

  // The selector lives inside a container with 16px screen padding on each
  // side; subtract from window width for a snug fit on phones.
  const innerWidth = win.width - 32 - 8; // -8 = own padding (4px each side)
  const cellWidth = innerWidth / options.length;

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * cellWidth }],
    width: cellWidth,
  }));

  return (
    <View className="bg-gray-100 dark:bg-neutral-800 rounded-2xl p-1 flex-row relative">
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 4,
            bottom: 4,
            left: 4,
            borderRadius: 12,
          },
          indicatorStyle,
        ]}
        className="bg-white dark:bg-neutral-700 shadow-sm"
      />
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className="flex-1 py-2 items-center justify-center"
          >
            <Text
              className={`text-sm font-semibold ${
                active
                  ? "text-gray-900 dark:text-neutral-100"
                  : "text-gray-500 dark:text-neutral-400"
              }`}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
