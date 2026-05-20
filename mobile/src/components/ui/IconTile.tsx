// IconTile — colored square that holds a category/status icon.
// Matches the `.icon-tile` patterns from Mobile UI/app.css (sm 38px, lg 44px).
// Passes the resolved foreground hex to the icon component so the SVG stroke
// picks up the tone automatically.

import {
  View,
  type ViewStyle,
} from "react-native";
import { type LucideIcon } from "lucide-react-native";
import { type Tone, tonePalette } from "@/lib/design";
import { useColorScheme } from "@/hooks/useAppColorScheme";

interface Props {
  Icon: LucideIcon;
  tone?: Tone;
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
  /** Override the foreground color (rare — usually tone is enough). */
  iconColor?: string;
}

const dims = {
  sm: { box: 32, radius: 10, icon: 14 },
  md: { box: 38, radius: 12, icon: 18 },
  lg: { box: 44, radius: 14, icon: 20 },
};

export function IconTile({
  Icon,
  tone = "brand",
  size = "md",
  style,
  iconColor,
}: Props) {
  const scheme = useColorScheme();
  const palette = tonePalette[tone];
  const { box, radius, icon } = dims[size];
  const bg = scheme === "dark" ? palette.bgDark : palette.bgLight;
  const fg = iconColor ?? (scheme === "dark" ? palette.fgDark : palette.fg);
  return (
    <View
      style={[
        { width: box, height: box, borderRadius: radius },
        { backgroundColor: bg, alignItems: "center", justifyContent: "center" },
        style,
      ]}
    >
      <Icon size={icon} color={fg} strokeWidth={2} />
    </View>
  );
}
