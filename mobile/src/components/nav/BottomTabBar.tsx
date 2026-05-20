// BottomTabBar — JS-rendered rounded-pill tab bar matching Mobile UI/app.css.
// Sits absolutely at the bottom of the screen on top of all tab content.
// Active tab is colored with the brand and gets a small notch above it.
//
// We deliberately drop NativeTabs here so the bar style matches the mock —
// the trade-off is losing iOS Liquid Glass / Material 3 native polish.

import { Pressable, Text, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePathname, useRouter } from "expo-router";
import {
  BarChart3,
  Home,
  List,
  PieChart,
  User,
  type LucideIcon,
} from "lucide-react-native";
import { Tokens } from "@/lib/design";

interface Tab {
  href: string;
  label: string;
  Icon: LucideIcon;
}

const TABS: Tab[] = [
  { href: "/(tabs)", label: "Home", Icon: Home },
  { href: "/(tabs)/transactions", label: "Activity", Icon: List },
  { href: "/(tabs)/budgets", label: "Budgets", Icon: PieChart },
  { href: "/(tabs)/reports", label: "Reports", Icon: BarChart3 },
  { href: "/(tabs)/profile", label: "Profile", Icon: User },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/(tabs)") {
    // Home matches both `/` and the explicit tab path.
    return pathname === "/" || pathname === "/(tabs)";
  }
  // Strip the (tabs) prefix so we match the actual URL the router produces.
  const tail = href.replace("/(tabs)", "");
  return pathname === tail || pathname.startsWith(`${tail}/`);
}

export function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const dark = scheme === "dark";

  return (
    <View
      style={{
        position: "absolute",
        left: 12,
        right: 12,
        bottom: Math.max(insets.bottom, 14),
        backgroundColor: dark ? Tokens.cardDark : Tokens.card,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: dark ? Tokens.borderDark : Tokens.border,
        flexDirection: "row",
        height: 64,
        paddingHorizontal: 8,
        alignItems: "center",
        justifyContent: "space-around",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 10 },
        elevation: 14,
      }}
    >
      {TABS.map((t) => {
        const active = isActive(pathname, t.href);
        const Icon = t.Icon;
        // Active state is just colored icon + colored label — no notch, no
        // pill, matching the target mock. Flat style only (NativeWind's
        // Pressable wrapper drops function-styles silently).
        return (
          <Pressable
            key={t.href}
            onPress={() => router.replace(t.href as never)}
            android_ripple={{
              color: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
              borderless: true,
            }}
            style={{
              flex: 1,
              height: 56,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
            }}
          >
            <Icon
              size={22}
              color={
                active
                  ? Tokens.brand
                  : dark
                    ? Tokens.textDimDark
                    : Tokens.textDim
              }
              strokeWidth={active ? 2.2 : 1.9}
            />
            <Text
              style={{
                fontSize: 10.5,
                fontWeight: active ? "700" : "600",
                letterSpacing: -0.1,
                color: active
                  ? Tokens.brand
                  : dark
                    ? Tokens.textDimDark
                    : Tokens.textDim,
              }}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
