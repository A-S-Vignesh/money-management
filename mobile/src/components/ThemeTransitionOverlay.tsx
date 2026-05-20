// ThemeTransitionOverlay — fullscreen flash that hides the synchronous
// light↔dark color cascade.
//
// Without it, tapping the Dark mode toggle causes every `useColorScheme()`
// consumer (drawer, tab bar, every screen) to re-render with new colors
// instantly — the effect is a hard pop that looks janky on a phone.
//
// With it: an Animated.View covers the screen, fades in (150ms) to the
// DESTINATION theme's bg color, the actual theme swap runs at opacity 1
// (so the user can't see the pop), then fades back out (150ms) revealing
// the new theme. End-to-end ~300ms, feels like a smooth crossfade.

import { useEffect, useState } from "react";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/lib/theme";

// Subtle-dim timings. Earlier versions fully blacked out the screen
// during the swap, which read as a flicker. This version dims to ~35%
// opacity over the destination bg color — the user sees a brief tint
// shift rather than a flash. Total ~280ms.
const FADE_IN_MS = 110;
const FADE_OUT_MS = 170;
const HOLD_MS = 40;
const PEAK_OPACITY = 0.35;

export function ThemeTransitionOverlay() {
  const transitionTo = useTheme((s) => s.transitionTo);
  const commitTransition = useTheme((s) => s.commitTransition);

  // We keep `mounted` slightly longer than `transitionTo` lives, so the
  // fade-out animation fully completes before we unmount and lose the
  // shared value's last frame.
  const [mounted, setMounted] = useState(false);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!transitionTo) return;
    setMounted(true);
    opacity.value = withSequence(
      withTiming(
        PEAK_OPACITY,
        { duration: FADE_IN_MS, easing: Easing.out(Easing.cubic) },
        () => {
          // Theme swap mid-dim — at 35% opacity the user can still see the
          // screen, but the dimming masks the synchronous color cascade so
          // the snap underneath reads as part of the smooth tint shift.
          runOnJS(commitTransition)();
        },
      ),
      withTiming(PEAK_OPACITY, { duration: HOLD_MS }),
      withTiming(
        0,
        { duration: FADE_OUT_MS, easing: Easing.inOut(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(setMounted)(false);
        },
      ),
    );
  }, [transitionTo, opacity, commitTransition]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!mounted) return null;

  // Tint matches the DESTINATION theme's bg — light bg coming in dims with
  // a near-white tint; dark bg coming in dims with a near-black tint.
  // Either direction reads as the destination color "fading in" rather
  // than a hard black blackout.
  const tint = transitionTo === "dark" ? "#0a0b0e" : "#f5f6fa";

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: tint,
          zIndex: 9999,
        },
        style,
      ]}
    />
  );
}
