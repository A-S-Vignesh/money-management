// components/ui/Skeleton.tsx
// Animated placeholder that softly fades between two opacities. Cheaper than
// shimmer (no Reanimated worklets, no SVG) and reads as "loading" without
// stealing focus from real content.

import { useEffect, useRef } from "react";
import { Animated, View, type StyleProp, type ViewStyle } from "react-native";

interface Props {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = "100%",
  height = 14,
  radius = 8,
  className = "",
  style,
}: Props) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, opacity }, style]}
      className={`bg-gray-200 dark:bg-neutral-800 ${className}`}
    >
      <View />
    </Animated.View>
  );
}
