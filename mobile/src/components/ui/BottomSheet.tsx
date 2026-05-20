// BottomSheet — full-width slide-up modal that mimics the Mobile UI mock's
// `.sheet`. Native `Modal` with `animationType="slide"` handles the gesture
// itself, plus a tap-outside backdrop and our drag handle for affordance.
// Avoiding @gorhom/bottom-sheet keeps us peer-dep-free in Expo Go.

import { useEffect } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  View,
  useColorScheme,
} from "react-native";
import { Tokens } from "@/lib/design";

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Max height as a fraction of the screen. Default 0.88 (matches mock). */
  maxHeightFraction?: number;
  /** Disable the internal ScrollView wrap (e.g. when the child has its own). */
  noScroll?: boolean;
}

export function BottomSheet({
  visible,
  onClose,
  children,
  maxHeightFraction = 0.88,
  noScroll,
}: Props) {
  const scheme = useColorScheme();
  const dark = scheme === "dark";

  // Android: hide status bar background flash during slide-in.
  useEffect(() => {
    if (Platform.OS === "android" && visible) {
      StatusBar.setBackgroundColor("rgba(0,0,0,0)", true);
      StatusBar.setTranslucent(true);
    }
  }, [visible]);

  const inner = (
    <View
      style={{
        backgroundColor: dark ? Tokens.cardDark : Tokens.card,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 8,
        paddingHorizontal: 18,
        paddingBottom: 36,
        maxHeight: `${maxHeightFraction * 100}%`,
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
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(10, 12, 25, 0.5)",
          justifyContent: "flex-end",
        }}
      >
        {/* Stop propagation so taps on the sheet don't dismiss it. */}
        <Pressable onPress={() => {}}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            {inner}
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
