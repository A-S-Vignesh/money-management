// SettingRow — one row inside a Settings card.
// Mirrors the mock's `.row` + `.icon-tile`: tinted icon tile on the left,
// label in the middle, free-form trailing slot on the right (toggle,
// value text, chevron, etc.).
//
// Each section's card stacks several of these with hairline dividers
// between them. The card itself provides outer borders/radius/background.

import {
  Pressable,
  Text,
  View,
} from "react-native";
import { type LucideIcon } from "lucide-react-native";
import { Tokens, tonePalette, type Tone } from "@/lib/design";
import { useColorScheme } from "@/hooks/useAppColorScheme";

interface Props {
  Icon: LucideIcon;
  tone?: Tone;
  label: string;
  /** Anything rendered on the right — Switch, value Text, chevron, etc. */
  trailing?: React.ReactNode;
  onPress?: () => void;
  /** When true, the bottom hairline divider is hidden (last row in card). */
  last?: boolean;
  /** Mark the row as destructive — label tinted rose, ignored if you pass
   *  your own trailing/icon styling. */
  danger?: boolean;
}

export function SettingRow({ Icon, tone = "brand", label, trailing, onPress, last, danger }: Props) {
  const dark = useColorScheme() === "dark";
  const palette = tonePalette[tone];
  const labelColor = danger
    ? Tokens.rose
    : dark
      ? Tokens.textDarkPrimary
      : Tokens.text;

  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      android_ripple={
        onPress
          ? { color: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }
          : undefined
      }
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 13,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: dark ? Tokens.borderDark : Tokens.border,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 11,
          backgroundColor: dark ? palette.bgDark : palette.bgLight,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon
          size={16}
          color={dark ? palette.fgDark : palette.fg}
          strokeWidth={2}
        />
      </View>
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: "500",
          color: labelColor,
          letterSpacing: -0.05,
        }}
      >
        {label}
      </Text>
      {trailing}
    </Wrapper>
  );
}
