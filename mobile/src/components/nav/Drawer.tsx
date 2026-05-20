// Drawer — 1:1 port of Mobile UI/app.jsx + app.css side drawer.
//
// Spec source: `Mobile UI/app.css` `.drawer*` rules and `Mobile UI/app.jsx`
// `SideDrawer` component. We mirror exact pixel values from the mock so the
// drawer reads identically across web prototype and native shell.

import { useEffect, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import {
  BarChart3,
  Bell,
  ChevronRight,
  CreditCard,
  HelpCircle,
  LayoutDashboard,
  List,
  LogOut,
  PieChart,
  Settings,
  Target,
  TrendingUp,
  User,
  X,
  type LucideIcon,
} from "lucide-react-native";

import { useAuth } from "@/lib/auth";
import { useDrawer } from "@/lib/stores";
import { Tokens } from "@/lib/design";
import { useAccounts } from "@/hooks/useAccounts";

const SCREEN_WIDTH = Dimensions.get("window").width;
// Mock uses 78% width.
const DRAWER_WIDTH = Math.round(SCREEN_WIDTH * 0.78);

interface NavItem {
  label: string;
  Icon: LucideIcon;
  href?: string;
  badge?: number;
  danger?: boolean;
  onPress?: () => void;
}

export function Drawer() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const open = useDrawer((s) => s.open);
  const setOpen = useDrawer((s) => s.setOpen);
  const scheme = useColorScheme();
  const dark = scheme === "dark";

  const translateX = useSharedValue(-DRAWER_WIDTH);
  const backdropOpacity = useSharedValue(0);

  const [mounted, setMounted] = useState(false);
  const finishClose = () => setMounted(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => {
        translateX.value = withTiming(0, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
        backdropOpacity.value = withTiming(1, { duration: 300 });
      });
    } else if (mounted) {
      backdropOpacity.value = withTiming(0, { duration: 220 });
      translateX.value = withTiming(
        -DRAWER_WIDTH,
        { duration: 260, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(finishClose)();
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted]);

  const close = () => setOpen(false);
  const goAndClose = (href: string) => {
    close();
    setTimeout(() => router.push(href as never), 140);
  };

  const { data: accounts } = useAccounts();
  const accountsCount = accounts
    ? accounts.filter((a) => !a.isSystem && !a.isDeleted).length
    : undefined;

  const money: NavItem[] = [
    { label: "Dashboard", Icon: LayoutDashboard, href: "/(tabs)" },
    {
      label: "Accounts",
      Icon: CreditCard,
      href: "/(tabs)/accounts",
      badge: accountsCount,
    },
    { label: "Investments", Icon: TrendingUp, href: "/(tabs)/profile" },
    { label: "Goals", Icon: Target, href: "/(tabs)/profile" },
  ];
  const activity: NavItem[] = [
    { label: "Transactions", Icon: List, href: "/(tabs)/transactions" },
    { label: "Budgets", Icon: PieChart, href: "/(tabs)/budgets" },
    { label: "Reports", Icon: BarChart3, href: "/(tabs)/reports" },
    { label: "Notifications", Icon: Bell, href: "/(tabs)/profile" },
  ];
  const account: NavItem[] = [
    { label: "Profile", Icon: User, href: "/(tabs)/profile" },
    { label: "Settings", Icon: Settings, href: "/(tabs)/profile" },
    { label: "Help & Support", Icon: HelpCircle, href: "/(tabs)/profile" },
  ];

  const handleSignOut = async () => {
    close();
    await signOut();
    router.replace("/(auth)/login");
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));
  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const initials = (user?.name ?? "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={close}
      statusBarTranslucent
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(8, 10, 22, 0.5)",
          },
          backdropStyle,
        ]}
      >
        <Pressable
          onPress={close}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
      </Animated.View>

      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: DRAWER_WIDTH,
            backgroundColor: dark ? "#1c1f27" : Tokens.card,
            borderTopRightRadius: 28,
            borderBottomRightRadius: 28,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOpacity: 0.4,
            shadowRadius: 30,
            shadowOffset: { width: 6, height: 0 },
            elevation: 20,
          },
          drawerStyle,
        ]}
      >
        {/* Header — gradient brand → brand3, padding mirrors 24/20/20 from CSS
            (top is bumped for the status bar). */}
        <LinearGradient
          colors={[Tokens.brand, Tokens.brand3]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: 56,
            paddingHorizontal: 20,
            paddingBottom: 20,
          }}
        >
          {/* Title row */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                backgroundColor: "rgba(255,255,255,0.20)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: "800",
                  letterSpacing: -0.5,
                }}
              >
                N.
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: "700",
                  letterSpacing: -0.3,
                }}
              >
                Money Nest
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 11,
                  fontWeight: "600",
                  marginTop: 2,
                }}
              >
                v0.1.0
              </Text>
            </View>
            <Pressable
              onPress={close}
              hitSlop={8}
              style={{
                width: 32,
                height: 32,
                borderRadius: 99,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={15} color="#fff" strokeWidth={2.4} />
            </Pressable>
          </View>

          {/* User card — padding 12, radius 16, marginTop 20 per mock.
              NOTE: must use a flat style object, NOT a function. NativeWind's
              css-interop wraps Pressable and silently drops style props on
              function-return — that bug made flexDirection: "row" never
              reach the View, so the avatar/name/chevron stacked vertically. */}
          <Pressable
            onPress={() => goAndClose("/(tabs)/profile")}
            android_ripple={{ color: "rgba(255,255,255,0.10)" }}
            style={{
              marginTop: 20,
              flexDirection: "row",
              alignItems: "center",
              padding: 12,
              borderRadius: 16,
              backgroundColor: "rgba(255,255,255,0.12)",
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 99,
                backgroundColor: "rgba(255,255,255,0.22)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: "700",
                  letterSpacing: -0.4,
                }}
              >
                {initials || "U"}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                numberOfLines={1}
                style={{
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: "600",
                  letterSpacing: -0.1,
                }}
              >
                {user?.name ?? "—"}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 11,
                  marginTop: 2,
                }}
              >
                {user?.email ?? ""}
              </Text>
            </View>
            <ChevronRight
              size={16}
              color="rgba(255,255,255,0.8)"
              strokeWidth={2.2}
            />
          </Pressable>
        </LinearGradient>

        {/* Nav list — padding 8/8/20 per mock. */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 8, paddingBottom: 20 }}
        >
          <DrawerSection
            label="Money"
            items={money}
            dark={dark}
            pathname={pathname}
            goAndClose={goAndClose}
          />
          <DrawerSection
            label="Activity"
            items={activity}
            dark={dark}
            pathname={pathname}
            goAndClose={goAndClose}
          />
          <DrawerSection
            label="Account"
            items={account}
            dark={dark}
            pathname={pathname}
            goAndClose={goAndClose}
          />
        </ScrollView>

        {/* Footer — fixed sign-out row + version. Hairline divider separates
            it from the scrolling nav so the destructive action never collides
            with regular navigation. */}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: dark ? "#3a414f" : Tokens.border,
            paddingHorizontal: 8,
            paddingTop: 8,
            paddingBottom: 14,
          }}
        >
          <DrawerItem
            item={{
              label: "Log out",
              Icon: LogOut,
              danger: true,
              onPress: handleSignOut,
            }}
            dark={dark}
            active={false}
            onPress={handleSignOut}
          />
          <Text
            style={{
              fontSize: 10.5,
              color: dark ? Tokens.textDimDark : Tokens.textDim,
              textAlign: "center",
              marginTop: 6,
              fontWeight: "500",
              letterSpacing: 0.2,
            }}
          >
            Money Nest · v0.1.0 · REV-FLATSTYLE
          </Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

function isItemActive(pathname: string, href?: string): boolean {
  if (!href) return false;
  if (href === "/(tabs)") return pathname === "/" || pathname === "/(tabs)";
  const tail = href.replace("/(tabs)", "");
  return pathname === tail || pathname.startsWith(`${tail}/`);
}

function DrawerSection({
  label,
  items,
  dark,
  pathname,
  goAndClose,
}: {
  label: string;
  items: NavItem[];
  dark: boolean;
  pathname: string;
  goAndClose: (href: string) => void;
}) {
  return (
    <View>
      {/* Section label — uppercase, tracked, weight-800 for clear chapter
          break between Money / Activity / Account. */}
      <Text
        style={{
          fontSize: 11,
          fontWeight: "800",
          color: dark ? "#9aa0b3" : Tokens.textMuted,
          letterSpacing: 1.1,
          textTransform: "uppercase",
          paddingTop: 18,
          paddingHorizontal: 14,
          paddingBottom: 6,
        }}
      >
        {label}
      </Text>
      {items.map((it) => (
        <DrawerItem
          key={it.label}
          item={it}
          dark={dark}
          active={isItemActive(pathname, it.href)}
          onPress={() => {
            if (it.onPress) it.onPress();
            else if (it.href) goAndClose(it.href);
          }}
        />
      ))}
    </View>
  );
}

function DrawerItem({
  item,
  onPress,
  dark,
  active,
}: {
  item: NavItem;
  onPress: () => void;
  dark: boolean;
  active: boolean;
}) {
  // Visual states (mirrors `.drawer-item`, `.drawer-item.active`, danger tile
  // from `Mobile UI/app.css`):
  //   - default: transparent row, neutral icon tile, neutral label
  //   - active : brand-soft row bg, SOLID brand icon tile w/ WHITE icon, brand label
  //   - danger : rose icon tile, rose label, transparent row

  const isDanger = item.danger;

  // Active state row paints a brand-soft pill. Dark mode uses a solid
  // saturated indigo (not alpha) so it doesn't wash out on top of the
  // drawer bg.
  const rowBg = active
    ? dark
      ? "#23306b"
      : Tokens.brandSoft
    : "transparent";

  // Icon tile fill. Dark-mode default is bumped well above the drawer bg
  // (#1c1f27) so the tile clearly reads as a distinct chip — anything in
  // the #20s blends right back into the background on AMOLED screens.
  const iconBg = isDanger
    ? dark
      ? "#3a1320"
      : Tokens.roseBg
    : active
      ? Tokens.brand // solid brand fill on active — matches mock exactly
      : dark
        ? "#323845"
        : Tokens.bgElev;
  const iconColor = isDanger
    ? Tokens.rose
    : active
      ? "#ffffff" // white icon on solid brand tile
      : dark
        ? Tokens.textMutedDark
        : Tokens.textMuted;

  // Label.
  const labelColor = isDanger
    ? Tokens.rose
    : active
      ? Tokens.brand
      : dark
        ? Tokens.textDarkPrimary
        : Tokens.text;
  const labelWeight: "500" | "600" = active ? "600" : "500";

  // Pressed tint is provided via android_ripple — we can't use a function
  // style here because NativeWind's Pressable wrapper drops it (see user
  // card note above). Flat style object is required.

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{
        color: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 14,
        marginVertical: 2,
        backgroundColor: rowBg,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: iconBg,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <item.Icon size={16} color={iconColor} strokeWidth={2} />
      </View>
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: labelWeight,
          color: labelColor,
          letterSpacing: -0.1,
        }}
      >
        {item.label}
      </Text>
      {/* Trail badge — pill chip matching `.drawer-item-trail` shape in the
          mock: 2/8 padding, fully rounded, bg-elev / text-muted by default
          and brand-soft / brand when the row is active. */}
      {typeof item.badge === "number" && item.badge > 0 ? (
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 99,
            marginLeft: 8,
            backgroundColor: active
              ? dark
                ? "rgba(255,255,255,0.20)"
                : "#ffffff"
              : dark
                ? "#323845"
                : Tokens.bgElev,
          }}
        >
          <Text
            style={{
              fontSize: 10.5,
              fontWeight: "700",
              color: active
                ? Tokens.brand
                : dark
                  ? Tokens.textDimDark
                  : Tokens.textDim,
              fontVariant: ["tabular-nums"],
              lineHeight: 14,
            }}
          >
            {item.badge}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
