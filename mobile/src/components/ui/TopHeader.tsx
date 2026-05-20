// TopHeader — greeting + title + bell. The "sticky-head" pattern from the
// Mobile UI mock. Used on the Dashboard tab.

import { Pressable, Text, View } from "react-native";
import { Bell } from "lucide-react-native";
import { Tokens } from "@/lib/design";

interface Props {
  title: string;
  subtitle?: string;
  unread?: number;
  onBell?: () => void;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

export function TopHeader({
  title,
  subtitle,
  unread = 0,
  onBell,
  leading,
  trailing,
}: Props) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
      }}
    >
      {leading}
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
      {trailing !== undefined ? (
        trailing
      ) : (
        <Pressable
          onPress={onBell}
          className="bg-surface dark:bg-surface-dark border border-edge dark:border-edge-dark"
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Bell size={18} color={Tokens.text} strokeWidth={2} />
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
                borderColor: Tokens.card,
              }}
            />
          ) : null}
        </Pressable>
      )}
    </View>
  );
}
