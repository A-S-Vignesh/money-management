// Chip — pill-shaped filter / period selector item.
// Mirrors `.chip` + `.chip.active` from Mobile UI/app.css.

import { Pressable, Text, type ViewStyle } from "react-native";
import { hapticLight } from "@/lib/haptics";

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
  /** Leading element (icon, dot, etc.) */
  leading?: React.ReactNode;
  style?: ViewStyle;
}

export function Chip({ label, active, onPress, leading, style }: Props) {
  return (
    <Pressable
      onPress={() => {
        hapticLight();
        onPress?.();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      style={[
        {
          height: 32,
          paddingHorizontal: 12,
          borderRadius: 999,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          borderWidth: 1,
        },
        style,
      ]}
      className={
        active
          ? "bg-fg dark:bg-fg-dark border-fg dark:border-fg-dark"
          : "bg-surface dark:bg-surface-dark border-edge dark:border-edge-dark"
      }
    >
      {leading}
      <Text
        className={
          active
            ? "text-surface dark:text-surface-dark text-[12px] font-semibold"
            : "text-fg-muted dark:text-fg-dark-muted text-[12px] font-semibold"
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}
