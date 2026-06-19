// BottomSheet — properly animated slide-up sheet.
//
// Why not Modal's `animationType="slide"`? It slides the ENTIRE layer
// (backdrop + content) from the bottom of the screen as one piece, so the
// dimmed backdrop appears to "fly in" from below instead of fading in
// behind a rising sheet. The fix is to render the Modal with no built-in
// animation and animate the backdrop opacity + sheet translateY ourselves
// using Reanimated.

import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Keyboard,
  type KeyboardEvent,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  type ScrollView as ScrollViewType,
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
  // Live keyboard height (plain React state, not a shared value, because
  // we use it to compute layout-time maxHeight — not as a transform).
  // When the keyboard opens, the sheet's maxHeight shrinks to
  // `screenHeight*fraction - keyboardHeight` so the sheet ends right at
  // the keyboard top instead of being pushed up off-screen.
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ScrollViewType>(null);

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

  // Subscribe to keyboard show/hide. The sheet itself doesn't move — it
  // stays anchored to screen bottom. Instead we shrink its `maxHeight`
  // by the keyboard height so the sheet always ends at the keyboard's
  // top. Then the inner ScrollView naturally handles getting the focused
  // input visible (RN's TextInput on focus auto-scrolls itself into view
  // inside the ScrollView).
  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (e: KeyboardEvent) => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    };
    const onHide = () => {
      setKeyboardHeight(0);
    };

    const showSub = Keyboard.addListener(showEvt, onShow);
    const hideSub = Keyboard.addListener(hideEvt, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Sheet's maxHeight shrinks by the live keyboard height + the 14px
  // breathing gap above the keyboard, so the sheet ends just above the
  // keyboard with a small visual margin. The internal ScrollView handles
  // letting the user scroll the focused input into view.
  const keyboardGap = keyboardHeight > 0 ? 14 : 0;
  const effectiveMaxHeight =
    SCREEN_HEIGHT * maxHeightFraction - keyboardHeight - keyboardGap;

  const sheetContent = (
    <View
      style={{
        backgroundColor: dark ? Tokens.cardDark : Tokens.card,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 8,
        paddingHorizontal: 18,
        // Lose the big bottom padding while keyboard is open — the keyboard
        // already provides the visual gap below.
        paddingBottom: keyboardHeight > 0 ? 12 : 36,
        maxHeight: effectiveMaxHeight,
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
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          // iOS-only: nudge the focused input above the keyboard
          // automatically. Harmless on Android (no-op).
          automaticallyAdjustKeyboardInsets
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

      {/* Sheet — translates from screen bottom to its rest position. Its
          `bottom` style is dynamic: anchored to 0 when no keyboard, then
          lifted to `keyboardHeight + gap` so the focused input gets a
          small breathing space above the keyboard instead of sitting
          flush against it. The inner ScrollView then handles scrolling
          the focused input into view. */}
      <Animated.View
        style={[
          {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: keyboardHeight > 0 ? keyboardHeight + 14 : 0,
          },
          sheetStyle,
        ]}
        pointerEvents="box-none"
      >
        {/* Plain View — wrapping in <Pressable onPress={()=>{}}> intercepts
            scroll gestures inside the sheet (the parent ScrollView's drag
            gets stolen by the Pressable's touch handler), which made the
            sheet feel "stuck" when trying to scroll. Tap-on-sheet doesn't
            bubble to the backdrop because the absolutely-positioned
            backdrop sits beneath this Animated.View in the z-stack. */}
        <View>{sheetContent}</View>
      </Animated.View>
    </Modal>
  );
}
