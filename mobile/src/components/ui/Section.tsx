// Section — title + optional "See all" action, with the section body below.
// Mirrors `.sec-head` from Mobile UI/app.css.

import { Pressable, Text, View, type ViewStyle } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { Tokens } from "@/lib/design";

interface Props {
  title?: string;
  action?: string;
  onAction?: () => void;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function Section({ title, action, onAction, children, style }: Props) {
  return (
    <View style={[{ marginBottom: 18 }, style]}>
      {title && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 4,
            paddingBottom: 10,
          }}
        >
          <Text className="text-fg dark:text-fg-dark text-[16px] font-semibold tracking-tight">
            {title}
          </Text>
          {action && (
            <Pressable
              onPress={onAction}
              style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
            >
              <Text className="text-brand text-[13px] font-semibold">{action}</Text>
              <ChevronRight size={14} color={Tokens.brand} strokeWidth={2.4} />
            </Pressable>
          )}
        </View>
      )}
      {children}
    </View>
  );
}
