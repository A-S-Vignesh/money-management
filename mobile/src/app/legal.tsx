// app/legal.tsx — Terms & Privacy
// Standalone route (lives outside the (tabs) group) reached from
// Settings → Terms & Privacy. Same back-row + hero + section rhythm as
// help.tsx so it doesn't feel like a different screen family.
//
// One page, two policies. A pill toggle at the top swaps between
// Terms of Service and Privacy Policy content. Each policy renders as
// a vertical stack of collapsible rows (same FaqRow pattern as
// help.tsx) so the page stays scannable.

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
  ChevronDown,
  ExternalLink,
  Mail,
  ScrollText,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react-native";

import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { tint } from "@/lib/colors";
import { Tokens } from "@/lib/design";
import { useColorScheme } from "@/hooks/useAppColorScheme";

const PRIVACY_EMAIL = "contact@codolve.com";
const TERMS_URL = "https://moneynestapp.vercel.app/terms";
const PRIVACY_URL = "https://moneynestapp.vercel.app/privacy";
const LAST_UPDATED = "May 2026";

type Tab = "terms" | "privacy";

// Plain-English policy copy. Sectioned so the user can scan headings
// and tap to expand the part they care about — same UX as the FAQ.
const TERMS: Array<{ title: string; body: string }> = [
  {
    title: "1. Acceptance of terms",
    body: "By creating an account or using Money Nest you agree to these terms. If you don't agree, please don't use the app. We may update these terms occasionally — see section 11.",
  },
  {
    title: "2. The service",
    body: "Money Nest is a personal finance tracker. You enter your transactions, accounts, budgets and investments manually, and the app organises and visualises them for you. We do not connect directly to your bank accounts and we do not move money.",
  },
  {
    title: "3. Your account",
    body: "You sign in with Google. You're responsible for keeping that Google account secure. We never see or store your Google password. You may delete your Money Nest account at any time from Settings → Delete account.",
  },
  {
    title: "4. Acceptable use",
    body: "Don't reverse-engineer the app, abuse the API, attempt to access other users' data, or use Money Nest for anything illegal. We may suspend accounts that violate these rules.",
  },
  {
    title: "5. Your data, your responsibility",
    body: "You own everything you enter. Balances and reports are derived only from what you log — if you forget to record a transaction or log it twice, the numbers will drift from reality. Always cross-check against your bank's official statements before making financial decisions.",
  },
  {
    title: "6. Not financial advice",
    body: "Money Nest is a record-keeping tool. Nothing in the app — including category suggestions, budget alerts, or investment summaries — is financial, tax, legal, or investment advice. Consult a qualified professional before acting on what you see here.",
  },
  {
    title: "7. Intellectual property",
    body: "The app, its design, code, and trademarks belong to Codolve (codolve.com). You're granted a personal, non-transferable licence to use the app. You may export your own data at any time.",
  },
  {
    title: "8. Termination",
    body: "You may stop using and delete Money Nest whenever you like. We may suspend or terminate accounts that abuse the service or violate these terms. On termination your data is removed from our active systems within 30 days, except where retention is required by law.",
  },
  {
    title: "9. Disclaimer of warranties",
    body: "The app is provided \"as is\" without warranty of any kind. We don't guarantee that the app will be uninterrupted, error-free, or that every calculation will be perfectly accurate in every edge case.",
  },
  {
    title: "10. Limitation of liability",
    body: "To the maximum extent permitted by law, Codolve is not liable for indirect, incidental, or consequential damages arising from your use of Money Nest, including any financial decision you make based on data shown in the app.",
  },
  {
    title: "11. Changes to terms",
    body: "We may update these terms when features change or the law requires it. The \"Last updated\" date at the top will change. Continued use after an update means you accept the new terms.",
  },
  {
    title: "12. Governing law",
    body: "These terms are governed by the laws of India. Any disputes will be handled in the courts of Bengaluru, Karnataka.",
  },
  {
    title: "13. Contact",
    body: `Questions about these terms? Email us at ${PRIVACY_EMAIL}.`,
  },
];

const PRIVACY: Array<{ title: string; body: string }> = [
  {
    title: "1. What this policy covers",
    body: "This policy explains what data Money Nest collects, why, how it's stored, and what control you have over it. It applies to the mobile app and any related web services.",
  },
  {
    title: "2. Information we collect",
    body:
      "• Account info: your name, email, and avatar URL, supplied by Google when you sign in.\n" +
      "• Financial info you enter: transactions, accounts, budgets, goals, investment holdings, categories, notes.\n" +
      "• Device & diagnostic info: app version, OS version, and anonymised crash logs.\n\n" +
      "We do not read your SMS, call logs, contacts, location, photos, or microphone.",
  },
  {
    title: "3. How we use your information",
    body:
      "We use it only to:\n" +
      "• Run the app's features (show your transactions, compute balances, generate reports).\n" +
      "• Keep your account secure (biometric unlock, session expiry).\n" +
      "• Fix bugs and improve the product.\n\n" +
      "We do not sell your data. We do not show ads. We do not profile you for marketing.",
  },
  {
    title: "4. Where your data lives",
    body: "Your data is stored in our database hosted in the Asia-South region. Connections are encrypted in transit (TLS 1.2+) and your records are scoped to your user ID — other users cannot see them.",
  },
  {
    title: "5. Third parties we share with",
    body:
      "We share only the minimum needed to make the app work:\n" +
      "• Google Sign-In — to authenticate you. Google's own privacy policy applies to that part.\n" +
      "• Our cloud hosting and database provider — to run the service.\n" +
      "• Crash reporting (anonymised) — to catch bugs.\n\n" +
      "We do not share your transactions with advertisers, analytics brokers, or data buyers.",
  },
  {
    title: "6. Your rights",
    body:
      "You can:\n" +
      "• Access your data — visible inside the app at all times.\n" +
      "• Export your data — Settings → Export data.\n" +
      "• Correct your data — edit any transaction, account, or profile field.\n" +
      "• Delete your account — Settings → Delete account. Data is removed from active systems within 30 days.\n\n" +
      "If you're in a jurisdiction with extra rights (India DPDP Act, EU GDPR, California CCPA), email us and we'll help.",
  },
  {
    title: "7. Retention",
    body: "We keep your data while your account is active. After deletion we purge it within 30 days, except where law requires us to retain certain records (e.g. tax or audit logs) for a longer period.",
  },
  {
    title: "8. Security",
    body: "Passwords are never stored — auth goes through Google. On your device, sensitive preferences (biometric flags, session tokens) live in the OS keychain / encrypted store. Server-side, data is encrypted at rest. No system is perfectly secure, so please also keep your Google account and device protected.",
  },
  {
    title: "9. Children's privacy",
    body: "Money Nest is not directed at children under 13 (or under 16 in regions that require it). We don't knowingly collect data from minors. If you believe a child has signed up, please contact us and we'll remove the account.",
  },
  {
    title: "10. Changes to this policy",
    body: "We'll update the \"Last updated\" date at the top whenever this policy changes. Material changes will also be flagged in-app on next launch.",
  },
  {
    title: "11. Contact",
    body: `Questions, requests, or complaints — email ${PRIVACY_EMAIL} and we'll get back to you within a few working days.`,
  },
];

export default function LegalScreen() {
  const router = useRouter();
  const dark = useColorScheme() === "dark";
  const [tab, setTab] = useState<Tab>("terms");
  // Accordion is single-open: at most one PolicyRow expanded at a time.
  // Switching tabs collapses whatever was open in the previous policy.
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  useEffect(() => {
    setOpenIndex(null);
  }, [tab]);

  const bg = dark ? "#0a0b0e" : "#f5f6fa";

  const openUrl = (url: string) =>
    Linking.openURL(url).catch(() => Alert.alert("Couldn't open link", url));

  const openMail = () =>
    Linking.openURL(
      `mailto:${PRIVACY_EMAIL}?subject=${encodeURIComponent(
        "Money Nest — privacy request",
      )}`,
    ).catch(() =>
      Alert.alert("No email app", `Drop us a line at ${PRIVACY_EMAIL}`),
    );

  const items = tab === "terms" ? TERMS : PRIVACY;

  return (
    // Same flash-prevention wrapper used by help.tsx — see comment there.
    <View collapsable={false} style={{ flex: 1, backgroundColor: bg }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: bg }}>
        {/* Custom back row */}
        <View
          style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}
        >
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
              <ShieldCheck size={22} color="#fff" strokeWidth={2.2} />
            </View>
            <Text
              style={{
                color: "#fff",
                fontSize: 22,
                fontWeight: "800",
                letterSpacing: -0.6,
              }}
            >
              Terms & Privacy
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.78)",
                fontSize: 13,
                marginTop: 6,
                lineHeight: 19,
              }}
            >
              Plain-English explanation of what you agree to when you use Money
              Nest, and how we handle your data.
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.62)",
                fontSize: 11.5,
                marginTop: 10,
                fontWeight: "600",
                letterSpacing: 0.3,
              }}
            >
              Last updated · {LAST_UPDATED}
            </Text>
          </LinearGradient>

          {/* ── Tab pill ──────────────────────────────────────────── */}
          <View
            style={{
              flexDirection: "row",
              padding: 4,
              borderRadius: 14,
              backgroundColor: dark ? Tokens.cardDark : Tokens.card,
              borderWidth: 1,
              borderColor: dark ? Tokens.borderDark : Tokens.border,
              marginBottom: 14,
              overflow: "hidden",
            }}
          >
            <TabPill
              active={tab === "terms"}
              label="Terms"
              Icon={ScrollText}
              dark={dark}
              onPress={() => setTab("terms")}
            />
            <TabPill
              active={tab === "privacy"}
              label="Privacy"
              Icon={ShieldCheck}
              dark={dark}
              onPress={() => setTab("privacy")}
            />
          </View>

          {/* ── Policy body ───────────────────────────────────────── */}
          <Section
            title={tab === "terms" ? "Terms of Service" : "Privacy Policy"}
          >
            <Card
              style={{
                paddingHorizontal: 0,
                paddingVertical: 0,
                overflow: "hidden",
              }}
            >
              {items.map((it, i) => (
                <PolicyRow
                  key={it.title}
                  item={it}
                  dark={dark}
                  last={i === items.length - 1}
                  open={openIndex === i}
                  onToggle={() =>
                    setOpenIndex((prev) => (prev === i ? null : i))
                  }
                />
              ))}
            </Card>
          </Section>

          {/* ── Bottom actions ────────────────────────────────────── */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 2 }}>
            <ActionTile
              Icon={Mail}
              label="Email privacy"
              color={Tokens.brand}
              dark={dark}
              onPress={openMail}
            />
            <ActionTile
              Icon={ExternalLink}
              label="View online"
              color={Tokens.emerald}
              dark={dark}
              onPress={() => openUrl(tab === "terms" ? TERMS_URL : PRIVACY_URL)}
            />
          </View>

          <Text
            style={{
              textAlign: "center",
              paddingVertical: 18,
              fontSize: 11,
              color: dark ? Tokens.textDimDark : Tokens.textDim,
              letterSpacing: 0.3,
            }}
          >
            Money Nest · v0.1.0
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────

function TabPill({
  active,
  label,
  Icon,
  dark,
  onPress,
}: {
  active: boolean;
  label: string;
  Icon: LucideIcon;
  dark: boolean;
  onPress: () => void;
}) {
  const inactiveFg = dark ? Tokens.textMutedDark : Tokens.textMuted;
  const activeFg = "#ffffff";
  // The colored background lives on an inner View rather than the
  // Pressable itself. Mixing android_ripple, overflow:hidden, and a
  // conditional background on the same node was leaving the active
  // colour painted on the previously-selected pill in some
  // re-renders — separating the surfaces makes the active state a
  // pure function of `active` with no Pressable internals in the way.
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      android_ripple={{
        color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      }}
      style={{ flex: 1, borderRadius: 10, overflow: "hidden" }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          paddingVertical: 10,
          borderRadius: 10,
          backgroundColor: active ? Tokens.brand : "transparent",
        }}
      >
        <Icon
          size={14}
          color={active ? activeFg : inactiveFg}
          strokeWidth={2.2}
        />
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: active ? activeFg : inactiveFg,
            letterSpacing: -0.1,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function PolicyRow({
  item,
  dark,
  last,
  open,
  onToggle,
}: {
  item: { title: string; body: string };
  dark: boolean;
  last: boolean;
  /** Controlled by the parent so only one row can be open at a time. */
  open: boolean;
  onToggle: () => void;
}) {
  // Smooth expand/collapse: LinearTransition animates the row's height
  // when the body conditionally mounts; FadeIn/FadeOut crossfade the
  // text so it doesn't snap in. Chevron rotates off the same timing.
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
            {item.title}
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
              {item.body}
            </Text>
          </Animated.View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

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

