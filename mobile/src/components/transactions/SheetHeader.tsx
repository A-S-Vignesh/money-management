// SheetHeader — title + close X used at the top of every bottom sheet.

import {
  Pressable,
  Text,
  View,
} from "react-native";
import { X } from "lucide-react-native";
import { Tokens } from "@/lib/design";
import { useColorScheme } from "@/hooks/useAppColorScheme";

interface Props {
  title: string;
  onClose: () => void;
}

export function SheetHeader({ title, onClose }: Props) {
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 4,
        paddingBottom: 14,
      }}
    >
      <Text
        className="text-fg dark:text-fg-dark text-[18px] font-bold"
        style={{ letterSpacing: -0.4 }}
      >
        {title}
      </Text>
      <Pressable
        onPress={onClose}
        style={{
          width: 32,
          height: 32,
          borderRadius: 99,
          backgroundColor: dark ? Tokens.bgElevDark : Tokens.bgElev,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={16} color={dark ? Tokens.textDarkPrimary : Tokens.text} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}
