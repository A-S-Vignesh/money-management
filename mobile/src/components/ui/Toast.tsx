// components/ui/Toast.tsx
// Animated toast notification that slides down from the top of the screen.
// Mount once in _layout.tsx — it reads from the useToast store and
// auto-dismisses after the configured duration (default 3s).

import { useEffect, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  SlideInUp,
  SlideOutUp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react-native";

import { useToast, type ToastType } from "@/lib/toast";
import { Tokens } from "@/lib/design";
import { useColorScheme } from "@/hooks/useAppColorScheme";

const ICON_MAP: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const ACCENT_LIGHT: Record<ToastType, string> = {
  success: Tokens.emerald,
  error: Tokens.rose,
  info: Tokens.brand,
};
const ACCENT_DARK: Record<ToastType, string> = {
  success: "#6ee7b7",
  error: "#fda4af",
  info: "#93c5fd",
};

const BG_LIGHT: Record<ToastType, string> = {
  success: "#ecfdf5",
  error: "#fff1f3",
  info: "#eff6ff",
};
const BG_DARK: Record<ToastType, string> = {
  success: "#052e1640",
  error: "#4c051940",
  info: "#1e3a8a40",
};

export function Toast() {
  const insets = useSafeAreaInsets();
  const dark = useColorScheme() === "dark";
  const current = useToast((s) => s.current);
  const dismiss = useToast((s) => s.dismiss);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      dismiss();
    }, current.duration ?? 3000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current, dismiss]);

  if (!current) return null;

  const Icon = ICON_MAP[current.type];
  const accent = dark ? ACCENT_DARK[current.type] : ACCENT_LIGHT[current.type];
  const bg = dark ? BG_DARK[current.type] : BG_LIGHT[current.type];
  const borderColor = dark
    ? `${accent}44`
    : current.type === "success"
      ? "#d1fae5"
      : current.type === "error"
        ? "#ffe4e6"
        : "#dbeafe";

  return (
    // Single animation layer: SlideInUp / SlideOutUp already drive both
    // translateY AND opacity in Reanimated, so no inner FadeIn/Out
    // wrapper is needed. Plain timing curve (cubic ease-out) — what
    // Sonner / iOS / Linear use for top toasts. Spring physics near the
    // safe-area top edge tends to look fidgety regardless of tuning.
    <Animated.View
      entering={SlideInUp.duration(260).easing(Easing.out(Easing.cubic))}
      exiting={SlideOutUp.duration(220).easing(Easing.in(Easing.cubic))}
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: insets.top + 8,
        left: 16,
        right: 16,
        zIndex: 9999,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          padding: 14,
          borderRadius: 16,
          backgroundColor: dark ? "#1a1c24" : "#ffffff",
          borderWidth: 1,
          borderColor,
          // Accent bar on the left
          borderLeftWidth: 3,
          borderLeftColor: accent,
          // Shadow
          shadowColor: "#000",
          shadowOpacity: dark ? 0.4 : 0.12,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        }}
      >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: bg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={17} color={accent} strokeWidth={2.2} />
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={2}
              style={{
                fontSize: 13.5,
                fontWeight: "700",
                color: dark ? Tokens.textDarkPrimary : Tokens.text,
                letterSpacing: -0.1,
              }}
            >
              {current.title}
            </Text>
            {current.body ? (
              <Text
                numberOfLines={2}
                style={{
                  fontSize: 12,
                  color: dark ? Tokens.textMutedDark : Tokens.textMuted,
                  marginTop: 2,
                  lineHeight: 17,
                }}
              >
                {current.body}
              </Text>
            ) : null}
          </View>

          <Pressable
            onPress={dismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss notification"
            hitSlop={8}
            style={{
              width: 24,
              height: 24,
              borderRadius: 99,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X
              size={14}
              color={dark ? Tokens.textDimDark : Tokens.textDim}
              strokeWidth={2.2}
            />
          </Pressable>
        </View>
    </Animated.View>
  );
}
