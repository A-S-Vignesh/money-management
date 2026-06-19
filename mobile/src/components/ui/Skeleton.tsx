// components/ui/Skeleton.tsx
// Production shimmer placeholder: a tinted base bar + a soft highlight
// gradient that translates left-to-right across it. The gradient runs on
// the UI thread via reanimated so it stays smooth even when the JS
// thread is busy fetching data.
//
// Why not just an opacity pulse? Opacity throbbing reads as "broken,
// retry?" rather than "loading." A travelling highlight reads as
// "content is on the way" — same UX pattern Facebook, LinkedIn,
// YouTube, etc. use for their content placeholders.

import { useEffect, useState } from "react";
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useColorScheme } from "@/hooks/useAppColorScheme";

interface Props {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  /** Override the base color (rarely needed). */
  baseColor?: string;
  /** Override the highlight color (rarely needed). */
  highlightColor?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

// Tuned for a 1.2s sweep: long enough to feel calm, short enough to
// reassure that something's happening. iOS App Store uses ~1.0s,
// LinkedIn ~1.4s — landing in between.
const DURATION = 1200;

export function Skeleton({
  width = "100%",
  height = 14,
  radius = 8,
  baseColor,
  highlightColor,
  className = "",
  style,
}: Props) {
  const dark = useColorScheme() === "dark";

  // Default palette matches the elev/border tokens so skeletons look like
  // a placeholder of the same surface family they live on.
  const base = baseColor ?? (dark ? "#1f222b" : "#e8eaf0");
  const hi = highlightColor ?? (dark ? "#2c3140" : "#f5f6fa");

  // Measure the actual rendered width so the highlight gradient travels
  // exactly from -width → +width. A percent-string width wouldn't give
  // us the pixel value at render time otherwise.
  const [measuredW, setMeasuredW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w !== measuredW) setMeasuredW(w);
  };

  // 0 → 1 progress. Translate the highlight by `-w + 2w*progress` so it
  // starts fully off the left and ends fully off the right.
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: DURATION, easing: Easing.inOut(Easing.cubic) }),
      -1, // infinite
      false, // don't reverse — restart from left each cycle
    );
    // shared values are stable refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const highlightStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          measuredW > 0 ? -measuredW + 2 * measuredW * progress.value : 0,
      },
    ],
  }));

  return (
    <View
      onLayout={onLayout}
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: base,
          overflow: "hidden",
        },
        style,
      ]}
      className={className}
    >
      {measuredW > 0 ? (
        <Animated.View
          // Highlight band that slides across the base. Width ~60% of the
          // host so the bright crest is a focused sweep, not a full-width
          // flash.
          style={[
            {
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: measuredW * 0.6,
            },
            highlightStyle,
          ]}
        >
          <LinearGradient
            colors={[base, hi, base]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}
