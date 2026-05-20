// TopHeader — greeting + title + bell. The "sticky-head" pattern from the
// Mobile UI mock. Used on the Dashboard tab.
//
// Pass `onMenu` to get the hamburger button rendered for you — handles its
// own dark-mode color so callers don't all have to duplicate that logic
// (which they did before, with Tokens.text hardcoded → invisible in dark).

import { Pressable, Text, View, useColorScheme } from "react-native";
import { Bell, Menu } from "lucide-react-native";
import { Tokens } from "@/lib/design";

interface Props {
  title: string;
  subtitle?: string;
  unread?: number;
  onBell?: () => void;
  onMenu?: () => void;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

export function TopHeader({
  title,
  subtitle,
  unread = 0,
  onBell,
  onMenu,
  leading,
  trailing,
}: Props) {
  const dark = useColorScheme() === "dark";
  const iconColor = dark ? Tokens.textDarkPrimary : Tokens.text;
  const bg = dark ? Tokens.cardDark : Tokens.card;
  const border = dark ? Tokens.borderDark : Tokens.border;

  const leadingNode =
    leading ?? (onMenu ? <IconBtn onPress={onMenu} Icon={Menu} dark={dark} /> : null);

  const trailingNode =
    trailing !== undefined
      ? trailing
      : (
        <Pressable
          onPress={onBell}
          android_ripple={{ color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", borderless: true }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: bg,
            borderWidth: 1,
            borderColor: border,
          }}
        >
          <Bell size={18} color={iconColor} strokeWidth={2} />
          {unread > 0 ? (
            <View
              style={{
                position: "absolute",
                top: 8,
                right: 9,
                width: 8,
                height: 8,
                borderRadius: 99,
                backgroundColor: Tokens.rose,
                borderWidth: 2,
                borderColor: bg,
              }}
            />
          ) : null}
        </Pressable>
      );

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
      }}
    >
      {leadingNode}
      <View style={{ flex: 1, minWidth: 0 }}>
        {subtitle ? (
          <Text className="text-fg-muted dark:text-fg-dark-muted text-[13px] font-medium">
            {subtitle}
          </Text>
        ) : null}
        <Text
          numberOfLines={1}
          className="text-fg dark:text-fg-dark text-[22px] font-bold tracking-tight"
          style={{ marginTop: subtitle ? 2 : 0 }}
        >
          {title}
        </Text>
      </View>
      {trailingNode}
    </View>
  );
}

function IconBtn({
  onPress,
  Icon,
  dark,
}: {
  onPress: () => void;
  Icon: typeof Menu;
  dark: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", borderless: true }}
      style={{
        width: 40,
        height: 40,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: dark ? Tokens.cardDark : Tokens.card,
        borderWidth: 1,
        borderColor: dark ? Tokens.borderDark : Tokens.border,
      }}
    >
      <Icon size={20} color={dark ? Tokens.textDarkPrimary : Tokens.text} strokeWidth={2} />
    </Pressable>
  );
}
