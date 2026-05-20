// SettingSwitch — custom pill switch with a real reanimated transition.
//
// `useAnimatedStyle` drives both the thumb translateX and the track
// background color from a single `progress` shared value (0 = off, 1 = on).
// `withTiming` gives the slide its smooth ease curve so the toggle feels
// continuous instead of snapping.
//
// IMPORTANT: every style prop on Pressable must be a FLAT OBJECT (not a
// function). NativeWind's Pressable wrapper silently drops function-return
// props, which froze the earlier version of this toggle.

import { useEffect } from "react";
import {
  Pressable,
} from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Tokens } from "@/lib/design";
import { useColorScheme } from "@/hooks/useAppColorScheme";

interface Props {
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

const TRACK_W = 46;
const TRACK_H = 28;
const THUMB = 22;
const PAD = 3;
const ANIM = { duration: 180, easing: Easing.out(Easing.cubic) };

export function SettingSwitch({ value, onChange, disabled }: Props) {
  const dark = useColorScheme() === "dark";
  const progress = useSharedValue(value ? 1 : 0);

  // Re-target the shared value whenever the controlled `value` flips.
  // withTiming runs on the UI thread → no JS frames are skipped during
  // the animation so the slide is glass-smooth.
  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, ANIM);
  }, [value, progress]);

  const innerW = TRACK_W - PAD * 2;
  const travel = innerW - THUMB;

  // Colors interpolated 0 → 1 between OFF (neutral gray, no blue bias)
  // and ON (brand blue). Cross-fade reads as a smooth tint shift instead
  // of a hard color swap.
  const offTrack = dark ? "#52525b" : "#cbd0db";
  const onTrack = Tokens.brand;

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [offTrack, onTrack]),
    borderColor: interpolateColor(progress.value, [0, 1], [offTrack, onTrack]),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * travel }],
  }));

  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        onChange(!value);
      }}
      hitSlop={10}
      // No android_ripple — `borderless: true` was intercepting taps on
      // some devices and freezing the toggle. Flat style only.
      style={{
        width: TRACK_W,
        height: TRACK_H,
        borderRadius: 99,
        padding: PAD,
        opacity: disabled ? 0.5 : 1,
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 99,
            borderWidth: 1,
          },
          trackStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            width: THUMB,
            height: THUMB,
            borderRadius: 99,
            backgroundColor: "#ffffff",
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 2,
            shadowOffset: { width: 0, height: 1 },
            elevation: 2,
          },
          thumbStyle,
        ]}
      />
    </Pressable>
  );
}
