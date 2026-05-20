// GlobalFab — fixed circular-square "Add Transaction" button.
// Floats above the bottom tab bar on every (tabs) screen. Uses an
// expo-linear-gradient fill for the brand → deep-brand wash from the mock,
// plus a heavy brand-tinted shadow so it stays prominent over any bg.

import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Plus } from "lucide-react-native";

import { Tokens } from "@/lib/design";
import { useTransactionSheet } from "@/lib/stores";

export function GlobalFab() {
  const openAdd = useTransactionSheet((s) => s.openAdd);
  const insets = useSafeAreaInsets();
  // Float fully above the tab bar with a small gap. Tab bar bottom =
  // max(insets.bottom, 14); height = 64; this clears the bar with ~14px
  // of breathing room.
  const bottom = Math.max(insets.bottom, 14) + 78;

  return (
    <Pressable
      onPress={() => openAdd("expense")}
      android_ripple={{ color: "rgba(255,255,255,0.18)", borderless: true }}
      // Flat style only. Function-style props get dropped by NativeWind's
      // Pressable wrapper, which previously rendered this FAB as a 0×0 box
      // at position 0,0 — i.e. completely invisible.
      style={{
        position: "absolute",
        right: 18,
        bottom,
        width: 58,
        height: 58,
        borderRadius: 20,
        overflow: "hidden",
        shadowColor: Tokens.brand,
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.6,
        shadowRadius: 22,
        elevation: 14,
      }}
    >
      <LinearGradient
        colors={[Tokens.brand, Tokens.brand3]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 20,
        }}
      >
        <Plus size={26} color="#fff" strokeWidth={2.6} />
      </LinearGradient>
    </Pressable>
  );
}
