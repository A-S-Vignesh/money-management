// app/help.tsx — Help & Support
// Standalone route (lives outside the (tabs) group) reached from
// Profile → Help & Support. Same card + section visual rhythm as the
// rest of the app so it doesn't feel like a different screen family.
//
// Sections (top → bottom):
//   1. Hero card — life-preserver icon + greeting + "we usually reply
//      within a day" reassurance
//   2. Quick actions — Email us / Send feedback / Rate the app
//   3. FAQ — collapsible Q&A pairs about the most common things users
//      get stuck on
//   4. Footer — version + a "documentation" external link

import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  Heart,
  LifeBuoy,
  Mail,
  MessageSquare,
  Star,
  type LucideIcon,
} from "lucide-react-native";

import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { tint } from "@/lib/colors";
import { Tokens } from "@/lib/design";
import { useColorScheme } from "@/hooks/useAppColorScheme";

const SUPPORT_EMAIL = "contact@codolve.com";
const FEEDBACK_EMAIL = "contact@codolve.com";
const DOCS_URL = "https://moneynestapp.vercel.app/help";

// FAQ content — pinned to the questions that have produced the most
// "how do I..." pings during dev. Edit copy here, not the layout.
const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "How do I add a transaction?",
    a: "Tap the blue + button at the bottom of any screen, or use Add on the dashboard. Pick a type (Expense / Income / Transfer), enter the amount, pick a category and account, then Save.",
  },
  {
    q: "Where do auto-created broker accounts come from?",
    a: "The first time you add an investment without picking a broker, the app creates a default 'Brokerage' account for you. Add more named brokers (Zerodha, Groww, etc.) from Accounts → + → type Broker.",
  },
  {
    q: "Why is my balance different from my bank?",
    a: "Balances are computed from your transactions, not synced live. If you forget to log a transaction or log it twice, the balance will drift. Use Settings → Sync now to refresh, and check Transactions for the day in question.",
  },
  {
    q: "Can I import statements from my bank?",
    a: "Not yet — manual entry only for now. We're exploring SMS / statement parsing for a future release.",
  },
  {
    q: "How do I switch currency?",
    a: "Profile → Edit profile → Currency. The whole app re-renders in your chosen currency. Existing transactions keep their original amount.",
  },
  {
    q: "Is my data private?",
    a: "Yes. We never sell your data and we don't show ads. Your transactions live in our database tied to your Google sign-in only.",
  },
];

const APP_VERSION = "0.1.0";

export default function HelpScreen() {
  const router = useRouter();
  const dark = useColorScheme() === "dark";
  // FAQ accordion is single-open: opening one collapses any other.
  // State lives here (not per-row) so the parent can enforce the rule.
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const openMail = (to: string, subject: string) => {
    const url = `mailto:${to}?subject=${encodeURIComponent(subject)}`;
    Linking.openURL(url).catch(() =>
      Alert.alert("No email app", `Drop us a line at ${to}`),
    );
  };

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert("Couldn't open link", url));
  };

  const bg = dark ? "#0a0b0e" : "#f5f6fa";

  return (
    // Wrapper View with the theme bg sits BENEATH the SafeAreaView's
    // top-edge inset. react-native-screens uses this outermost view as
    // the screen's content container during the native pop animation,
    // so setting bg here guarantees no flash regardless of how
    // contentStyle propagation behaves. `collapsable={false}` prevents
    // Android from optimising this view away mid-animation, which was
    // letting the native window bg leak through during back-swipe.
    <View
      collapsable={false}
      style={{ flex: 1, backgroundColor: bg }}
    >
      <SafeAreaView
        edges={["top"]}
        style={{ flex: 1, backgroundColor: bg }}
      >

      {/* Custom back row */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          android_ripple={{
            color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            borderless: true,
          }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: dark ? Tokens.cardDark : Tokens.card,
            borderWidth: 1,
            borderColor: dark ? Tokens.borderDark : Tokens.border,
            overflow: "hidden",
          }}
        >
          <ArrowLeft
            size={18}
            color={dark ? Tokens.textDarkPrimary : Tokens.text}
            strokeWidth={2.2}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 80,
          paddingTop: 4,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero card ─────────────────────────────────────────── */}
        <LinearGradient
          colors={[Tokens.brand, Tokens.brand3]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            padding: 20,
            borderRadius: 24,
            marginBottom: 18,
            marginTop: 4,
            shadowColor: Tokens.brand,
            shadowOpacity: 0.4,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 12 },
            elevation: 8,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: "rgba(255,255,255,0.20)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <LifeBuoy size={22} color="#fff" strokeWidth={2.2} />
          </View>
          <Text
            style={{
              color: "#fff",
              fontSize: 22,
              fontWeight: "800",
              letterSpacing: -0.6,
            }}
          >
            How can we help?
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.78)",
              fontSize: 13,
              marginTop: 6,
              lineHeight: 19,
            }}
          >
            Browse common questions below, or drop us a message — we usually
            reply within a day.
          </Text>
        </LinearGradient>

        {/* ── Quick actions ────────────────────────────────────── */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 18 }}>
          <ActionTile
            Icon={Mail}
            label="Email us"
            color={Tokens.brand}
            dark={dark}
            onPress={() => openMail(SUPPORT_EMAIL, "Money Nest — help request")}
          />
          <ActionTile
            Icon={MessageSquare}
            label="Feedback"
            color={Tokens.emerald}
            dark={dark}
            onPress={() => openMail(FEEDBACK_EMAIL, "Money Nest — feedback")}
          />
          <ActionTile
            Icon={Star}
            label="Rate us"
            color={Tokens.amber}
            dark={dark}
            onPress={() =>
              openUrl(
                "https://play.google.com/store/apps/details?id=co.sunlightgroup.moneynest",
              )
            }
          />
        </View>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <Section title="Frequently asked">
          <Card
            style={{
              paddingHorizontal: 0,
              paddingVertical: 0,
              overflow: "hidden",
            }}
          >
            {FAQS.map((item, i) => (
              <FaqRow
                key={item.q}
                item={item}
                dark={dark}
                last={i === FAQS.length - 1}
                open={openIndex === i}
                onToggle={() =>
                  setOpenIndex((prev) => (prev === i ? null : i))
                }
              />
            ))}
          </Card>
        </Section>

        {/* ── Docs link ────────────────────────────────────────── */}
        <Pressable
          onPress={() => openUrl(DOCS_URL)}
          android_ripple={{
            color: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingHorizontal: 14,
            paddingVertical: 14,
            borderRadius: 18,
            backgroundColor: dark ? Tokens.cardDark : Tokens.card,
            borderWidth: 1,
            borderColor: dark ? Tokens.borderDark : Tokens.border,
            marginBottom: 14,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 11,
              backgroundColor: dark ? "#1e3a8a55" : Tokens.brandSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOpen size={16} color={Tokens.brand} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text className="text-fg dark:text-fg-dark text-[14px] font-semibold">
              Full documentation
            </Text>
            <Text className="text-fg-muted dark:text-fg-dark-muted text-[11.5px] mt-0.5">
              In-depth guides on the web
            </Text>
          </View>
        </Pressable>

        {/* Made-with-love footer */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            paddingVertical: 18,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              color: dark ? Tokens.textDimDark : Tokens.textDim,
              fontWeight: "500",
              letterSpacing: 0.2,
            }}
          >
            Made with
          </Text>
          <Heart
            size={11}
            color={Tokens.rose}
            strokeWidth={2.4}
            fill={Tokens.rose}
          />
          <Text
            style={{
              fontSize: 11,
              color: dark ? Tokens.textDimDark : Tokens.textDim,
              fontWeight: "500",
              letterSpacing: 0.2,
            }}
          >
            · Money Nest v{APP_VERSION}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
    </View>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────

function ActionTile({
  Icon,
  label,
  color,
  dark,
  onPress,
}: {
  Icon: LucideIcon;
  label: string;
  color: string;
  dark: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{
        color: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
      }}
      style={{
        flex: 1,
        padding: 14,
        borderRadius: 16,
        backgroundColor: dark ? Tokens.cardDark : Tokens.card,
        borderWidth: 1,
        borderColor: dark ? Tokens.borderDark : Tokens.border,
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 11,
          backgroundColor: tint(color, dark ? 0.22 : 0.12),
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
        }}
      >
        <Icon size={17} color={color} strokeWidth={2.2} />
      </View>
      <Text
        className="text-fg dark:text-fg-dark text-[12px] font-semibold"
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FaqRow({
  item,
  dark,
  last,
  open,
  onToggle,
}: {
  item: { q: string; a: string };
  dark: boolean;
  last: boolean;
  /** Controlled by the parent so only one row can be open at a time. */
  open: boolean;
  onToggle: () => void;
}) {
  // Drive the chevron rotation + the row's height transition off the
  // same shared value. `LinearTransition` animates the height change
  // when the body mounts/unmounts; `FadeIn`/`FadeOut` fade the text so
  // it doesn't pop. `Easing.out(cubic)` matches the rest of the app's
  // motion feel (see ThemeTransitionOverlay).
  const rotation = useSharedValue(open ? 180 : 0);
  useEffect(() => {
    rotation.value = withTiming(open ? 180 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [open, rotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      layout={LinearTransition.duration(220).easing(Easing.out(Easing.cubic))}
    >
      <Pressable
        onPress={onToggle}
        android_ripple={{
          color: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        }}
        style={{
          paddingHorizontal: 14,
          paddingVertical: 14,
          borderBottomWidth: last ? 0 : 1,
          borderBottomColor: dark ? Tokens.borderDark : Tokens.border,
          overflow: "hidden",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text
            numberOfLines={open ? undefined : 1}
            style={{
              flex: 1,
              fontSize: 13.5,
              fontWeight: "600",
              color: dark ? Tokens.textDarkPrimary : Tokens.text,
              letterSpacing: -0.1,
            }}
          >
            {item.q}
          </Text>
          <Animated.View style={chevronStyle}>
            <ChevronDown
              size={16}
              color={dark ? Tokens.textMutedDark : Tokens.textMuted}
              strokeWidth={2.2}
            />
          </Animated.View>
        </View>
        {open ? (
          <Animated.View
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(140)}
          >
            <Text
              style={{
                marginTop: 8,
                fontSize: 12.5,
                color: dark ? Tokens.textMutedDark : Tokens.textMuted,
                lineHeight: 19,
              }}
            >
              {item.a}
            </Text>
          </Animated.View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

