// BottomSheet — properly animated slide-up sheet.
//
// Why not Modal's `animationType="slide"`? It slides the ENTIRE layer
// (backdrop + content) from the bottom of the screen as one piece, so the
// dimmed backdrop appears to "fly in" from below instead of fading in
// behind a rising sheet. The fix is to render the Modal with no built-in
// animation and animate the backdrop opacity + sheet translateY ourselves
// using Reanimated.

import { useEffect, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Tokens } from "@/lib/design";
import { useColorScheme } from "@/hooks/useAppColorScheme";

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Max sheet height as a fraction of the screen. Default 0.88. */
  maxHeightFraction?: number;
  /** Skip the internal ScrollView wrap (e.g. when child has its own list). */
  noScroll?: boolean;
}

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SLIDE_DURATION = 280;

export function BottomSheet({
  visible,
  onClose,
  children,
  maxHeightFraction = 0.88,
  noScroll,
}: Props) {
  const scheme = useColorScheme();
  const dark = scheme === "dark";

  // Shared values for the two-part animation: a fade for the backdrop and
  // a translateY for the sheet itself.
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  // We delay React-unmounting the Modal until the slide-out finishes, so
  // the user actually sees the slide instead of a hard cut.
  const [mounted, setMounted] = useState(false);
  const finishClose = () => setMounted(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      // Run on next tick so the Modal mounts before the animation kicks in.
      requestAnimationFrame(() => {
        translateY.value = withTiming(0, {
          duration: SLIDE_DURATION,
          easing: Easing.out(Easing.cubic),
        });
        backdropOpacity.value = withTiming(1, { duration: SLIDE_DURATION });
      });
    } else if (mounted) {
      backdropOpacity.value = withTiming(0, { duration: 220 });
      translateY.value = withTiming(
        SCREEN_HEIGHT,
        { duration: 240, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(finishClose)();
        },
      );
    }
    // shared values are stable refs — intentionally omitted from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, mounted]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const sheetContent = (
    <View
      style={{
        backgroundColor: dark ? Tokens.cardDark : Tokens.card,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 8,
        paddingHorizontal: 18,
        paddingBottom: 36,
        maxHeight: SCREEN_HEIGHT * maxHeightFraction,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: -8 },
        elevation: 24,
      }}
    >
      <View
        style={{
          width: 38,
          height: 4,
          borderRadius: 999,
          backgroundColor: dark ? Tokens.borderStrongDark : Tokens.borderStrong,
          alignSelf: "center",
          marginBottom: 14,
        }}
      />
      {noScroll ? (
        children
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {children}
        </ScrollView>
      )}
    </View>
  );

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop — fades in/out independently. */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(10, 12, 25, 0.5)",
          },
          backdropStyle,
        ]}
      >
        <Pressable
          onPress={onClose}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
      </Animated.View>

      {/* Sheet — translates from screen bottom to its rest position. */}
      <Animated.View
        style={[
          {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
          },
          sheetStyle,
        ]}
        pointerEvents="box-none"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Plain View — wrapping in <Pressable onPress={()=>{}}> intercepts
              scroll gestures inside the sheet (the parent ScrollView's drag
              gets stolen by the Pressable's touch handler), which made the
              sheet feel "stuck" when trying to scroll. Tap-on-sheet doesn't
              bubble to the backdrop because the absolutely-positioned
              backdrop sits beneath this Animated.View in the z-stack. */}
          <View>{sheetContent}</View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}
