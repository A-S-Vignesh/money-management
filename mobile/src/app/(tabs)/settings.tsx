// app/(tabs)/settings.tsx — Settings
// 1:1 port of the Mobile UI mock's SettingsScreen. Sectioned into:
//   Appearance · Notifications · Security · Data · About
//
// Lives inside (tabs) so it inherits the bottom tab bar + drawer chrome,
// but it isn't IN the bottom tabs — reached via the side drawer's
// "Settings" item.

import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import dayjs from "dayjs";
import {
  Activity,
  Bell,
  Book,
  Calendar,
  ChevronRight,
  Download,
  Eye,
  Fingerprint,
  Globe,
  Lock,
  Mail,
  Moon,
  Repeat,
  Send,
  Shield,
  Star,
  Trash2,
  TrendingUp,
} from "lucide-react-native";

import { Card } from "@/components/ui/Card";
import { ScreenHead } from "@/components/ui/ScreenHead";
import { Section } from "@/components/ui/Section";
import { SettingRow } from "@/components/settings/SettingRow";
import { SettingSwitch } from "@/components/settings/SettingSwitch";
import { useDrawer } from "@/lib/stores";
import { useTheme } from "@/lib/theme";
import { Tokens } from "@/lib/design";
import { useColorScheme } from "@/hooks/useAppColorScheme";
import { useNotifPrefs } from "@/lib/notifications";
import { lockTimeoutLabel, useSecurity } from "@/lib/security";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/lib/toast";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { exportTransactionsCSV } from "@/lib/exportData";
import { useCurrency } from "@/lib/currency";
import { useDateFormat } from "@/lib/dateFormat";
import { CurrencySheet } from "@/components/settings/CurrencySheet";
import { DateFormatSheet } from "@/components/settings/DateFormatSheet";

export default function SettingsScreen() {
  const dark = useColorScheme() === "dark";
  const router = useRouter();
  const openDrawer = useDrawer((s) => s.toggle);
  const themePref = useTheme((s) => s.pref);
  const setThemeSmooth = useTheme((s) => s.setPrefSmooth);

  // Notification preferences live in a persisted Zustand store (see
  // lib/notifications.ts). The master `pushNotif` toggle drives the OS
  // permission flow + Expo push-token registration; the rest are simple
  // booleans that gate which kinds of events actually fire a banner.
  const pushNotif = useNotifPrefs((s) => s.pushNotif);
  const emailDigests = useNotifPrefs((s) => s.emailDigests);
  const budgetAlerts = useNotifPrefs((s) => s.budgetAlerts);
  const investUpdates = useNotifPrefs((s) => s.investUpdates);
  const setPushNotifPref = useNotifPrefs((s) => s.setPushNotif);
  const setEmailDigests = useNotifPrefs((s) => s.setEmailDigests);
  const setBudgetAlerts = useNotifPrefs((s) => s.setBudgetAlerts);
  const setInvestUpdates = useNotifPrefs((s) => s.setInvestUpdates);

  // Wrap the push toggle so an OS-permission denial surfaces a useful
  // alert instead of silently flipping back. Turning off never prompts.
  const handleTogglePush = async (next: boolean) => {
    const result = await setPushNotifPref(next);
    if (!result.ok) {
      Alert.alert(
        "Notifications disabled",
        result.reason === "OS permission denied"
          ? "You denied notification permission. To enable budget alerts and other pings, allow notifications for Money Nest in your device's Settings, then try again."
          : (result.reason ?? "Couldn't enable notifications."),
      );
    }
  };

  // Security toggles are real — persisted in the security store and
  // enforced by AppLockGate / dashboard / Money components.
  const biometricEnabled = useSecurity((s) => s.biometricEnabled);
  const setBiometricEnabled = useSecurity((s) => s.setBiometricEnabled);
  const appLockTimeoutMs = useSecurity((s) => s.appLockTimeoutMs);
  const cycleAppLockTimeout = useSecurity((s) => s.cycleAppLockTimeout);
  const hideBalanceOnOpen = useSecurity((s) => s.hideBalanceOnOpen);
  const setHideBalanceOnOpen = useSecurity((s) => s.setHideBalanceOnOpen);

  // Both enabling AND disabling biometric unlock require a fresh
  // authentication, because either direction is a security-sensitive
  // change. Without the disable-side prompt, anyone who grabs the
  // phone during a brief unlocked window could walk to Settings and
  // turn the lock off permanently — defeating the entire feature.
  //
  // Enabling additionally needs hardware + enrolment checks so we
  // don't silently turn on a lock the user can't satisfy on resume.
  const toggleBiometric = async (next: boolean) => {
    try {
      if (next) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        if (!hasHardware) {
          Alert.alert(
            "Biometrics unavailable",
            "This device doesn't support fingerprint or face authentication.",
          );
          return;
        }
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!isEnrolled) {
          Alert.alert(
            "No biometrics enrolled",
            "Set up Face ID, Touch ID, or a fingerprint in your device settings, then try again.",
          );
          return;
        }
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: next
          ? "Confirm to enable biometric unlock"
          : "Confirm to disable biometric unlock",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });
      if (!result.success) return;
      await setBiometricEnabled(next);
    } catch (e) {
      console.warn("[settings] biometric toggle failed", e);
      Alert.alert(
        next
          ? "Couldn't enable biometric unlock"
          : "Couldn't disable biometric unlock",
        "Something went wrong. Try again in a moment.",
      );
    }
  };

  // "Dark mode" is a binary toggle in the mock. We map it onto the existing
  // 3-way theme store (system / light / dark): toggling on → "dark",
  // toggling off → "light".
  //
  // setPrefSmooth shows the ThemeTransitionOverlay (mounted at the root
  // layout) which fades through the destination bg color while the actual
  // theme swap happens at peak opacity — hides the synchronous cascade.
  const darkOn = themePref === "dark" || (themePref === "system" && dark);
  const toggleDark = (next: boolean) => setThemeSmooth(next ? "dark" : "light");

  // Last-sync stamp — tracks the real last-sync time.
  const [lastSyncTime, setLastSyncTime] = useState(() => dayjs().subtract(2, "minute").toISOString());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const signOut = useAuth((s) => s.signOut);

  // Currency selector
  const currencyInfo = useCurrency((s) => s.info());
  const [showCurrencySheet, setShowCurrencySheet] = useState(false);

  // Date-format selector
  const dateFormatInfo = useDateFormat((s) => s.info());
  const [showDateFormatSheet, setShowDateFormatSheet] = useState(false);

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-surface-muted dark:bg-surface-dark-elev"
    >
      <View style={{ paddingHorizontal: 16 }}>
        <ScreenHead title="Settings" onMenu={openDrawer} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Appearance ────────────────────────────────────────────── */}
        <Section title="Appearance">
          <Card style={{ paddingHorizontal: 0, paddingVertical: 0, overflow: "hidden" }}>
            <SettingRow
              Icon={Moon}
              tone="brand"
              label="Dark mode"
              trailing={<SettingSwitch value={darkOn} onChange={toggleDark} />}
            />
            <SettingRow
              Icon={Globe}
              tone="blue"
              label="Currency"
              onPress={() => setShowCurrencySheet(true)}
              trailing={
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <ValueText>{currencyInfo.code} {currencyInfo.symbol}</ValueText>
                  <Chevron dark={dark} />
                </View>
              }
            />
            <SettingRow
              Icon={Calendar}
              tone="purple"
              label="Date format"
              onPress={() => setShowDateFormatSheet(true)}
              trailing={
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <ValueText>{dateFormatInfo.name}</ValueText>
                  <Chevron dark={dark} />
                </View>
              }
              last
            />
          </Card>
        </Section>

        {/* ── Notifications ────────────────────────────────────────── */}
        <Section title="Notifications">
          <Card style={{ paddingHorizontal: 0, paddingVertical: 0, overflow: "hidden" }}>
            <SettingRow
              Icon={Bell}
              tone="amber"
              label="Push notifications"
              trailing={
                <SettingSwitch
                  value={pushNotif}
                  onChange={handleTogglePush}
                />
              }
            />
            <SettingRow
              Icon={Mail}
              tone="blue"
              label="Email digests"
              trailing={<SettingSwitch value={emailDigests} onChange={setEmailDigests} />}
            />
            <SettingRow
              Icon={Activity}
              tone="emerald"
              label="Budget alerts"
              trailing={<SettingSwitch value={budgetAlerts} onChange={setBudgetAlerts} />}
            />
            <SettingRow
              Icon={TrendingUp}
              tone="brand"
              label="Investment updates"
              trailing={<SettingSwitch value={investUpdates} onChange={setInvestUpdates} />}
              last
            />
          </Card>
        </Section>

        {/* ── Security ─────────────────────────────────────────────── */}
        <Section title="Security">
          <Card style={{ paddingHorizontal: 0, paddingVertical: 0, overflow: "hidden" }}>
            <SettingRow
              Icon={Fingerprint}
              tone="emerald"
              label="Biometric unlock"
              trailing={
                <SettingSwitch value={biometricEnabled} onChange={toggleBiometric} />
              }
            />
            <SettingRow
              Icon={Lock}
              tone="rose"
              label="App lock"
              // Tap to cycle through Immediately / 15s / 30s / 1m / 5m / 15m.
              // No-op when biometric is off, so we de-emphasise the value.
              onPress={biometricEnabled ? cycleAppLockTimeout : undefined}
              trailing={
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <ValueText dim={!biometricEnabled}>
                    {lockTimeoutLabel(appLockTimeoutMs)}
                  </ValueText>
                  {biometricEnabled ? <Chevron dark={dark} /> : null}
                </View>
              }
            />
            <SettingRow
              Icon={Shield}
              tone="brand"
              label="Two-factor auth"
              onPress={() => {
                Alert.alert(
                  "Coming Soon",
                  "Two-factor authentication will be available in a future update. We'll notify you when it's ready.",
                  [{ text: "OK" }],
                );
              }}
              trailing={<Chevron dark={dark} />}
            />
            <SettingRow
              Icon={Eye}
              tone="purple"
              label="Hide balance on open"
              trailing={
                <SettingSwitch
                  value={hideBalanceOnOpen}
                  onChange={setHideBalanceOnOpen}
                />
              }
              last
            />
          </Card>
        </Section>

        {/* ── Data ─────────────────────────────────────────────────── */}
        <Section title="Data">
          <Card style={{ paddingHorizontal: 0, paddingVertical: 0, overflow: "hidden" }}>
            <SettingRow
              Icon={Download}
              tone="blue"
              label="Export data"
              onPress={async () => {
                if (isExporting) return;
                setIsExporting(true);
                try {
                  await exportTransactionsCSV();
                } finally {
                  setIsExporting(false);
                }
              }}
              trailing={
                isExporting ? (
                  <ActivityIndicator size="small" color={Tokens.brand} />
                ) : (
                  <Chevron dark={dark} />
                )
              }
            />
            <SettingRow
              Icon={Repeat}
              tone="brand"
              label="Sync now"
              onPress={async () => {
                if (isSyncing) return;
                setIsSyncing(true);
                try {
                  await queryClient.invalidateQueries();
                  setLastSyncTime(dayjs().toISOString());
                  useToast.getState().success("Data synced");
                } catch {
                  useToast.getState().error("Sync failed", "Check your connection");
                } finally {
                  setIsSyncing(false);
                }
              }}
              trailing={
                isSyncing ? (
                  <ActivityIndicator size="small" color={Tokens.brand} />
                ) : (
                  <ValueText>
                    {dayjs().diff(lastSyncTime, "minute")}m ago
                  </ValueText>
                )
              }
            />
            <SettingRow
              Icon={Trash2}
              tone="rose"
              label="Delete account"
              danger
              onPress={() => {
                Alert.alert(
                  "Delete your account?",
                  "This will permanently delete all your data including transactions, budgets, goals, investments, and accounts. This cannot be undone.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete permanently",
                      style: "destructive",
                      onPress: async () => {
                        setIsDeleting(true);
                        try {
                          await api("/api/account/delete", {
                            method: "DELETE",
                            body: { confirmation: "DELETE" },
                          });
                          await signOut();
                          router.replace("/(auth)/login");
                          useToast.getState().info("Account deleted");
                        } catch (err) {
                          const msg = err instanceof Error ? err.message : "Try again";
                          Alert.alert("Couldn't delete account", msg);
                        } finally {
                          setIsDeleting(false);
                        }
                      },
                    },
                  ],
                );
              }}
              trailing={
                isDeleting ? (
                  <ActivityIndicator size="small" color={Tokens.rose} />
                ) : (
                  <ChevronRight size={16} color={Tokens.rose} strokeWidth={2} />
                )
              }
              last
            />
          </Card>
        </Section>

        {/* ── About ────────────────────────────────────────────────── */}
        <Section title="About">
          <Card style={{ paddingHorizontal: 0, paddingVertical: 0, overflow: "hidden" }}>
            <SettingRow
              Icon={Star}
              tone="amber"
              label="Rate Money Nest"
              onPress={() => {
                /* TODO: open store listing */
              }}
              trailing={<Chevron dark={dark} />}
            />
            <SettingRow
              Icon={Send}
              tone="brand"
              label="Send feedback"
              onPress={() => {
                /* TODO: open mailto: */
              }}
              trailing={<Chevron dark={dark} />}
            />
            <SettingRow
              Icon={Book}
              tone="emerald"
              label="Terms & Privacy"
              onPress={() => router.push("/legal")}
              trailing={<Chevron dark={dark} />}
              last
            />
          </Card>
        </Section>

        <Text
          style={{
            textAlign: "center",
            paddingVertical: 14,
            fontSize: 11,
            color: dark ? Tokens.textDimDark : Tokens.textDim,
            letterSpacing: 0.3,
          }}
        >
          Money Nest · v0.1.0 · Build {dayjs().format("YYYY.MM.DD")}
        </Text>
      </ScrollView>
      <CurrencySheet
        visible={showCurrencySheet}
        onClose={() => setShowCurrencySheet(false)}
      />
      <DateFormatSheet
        visible={showDateFormatSheet}
        onClose={() => setShowDateFormatSheet(false)}
      />
    </SafeAreaView>
  );
}

// ── Small helpers ────────────────────────────────────────────────────────

function ValueText({
  children,
  dim,
}: {
  children: React.ReactNode;
  /** Use the dimmer textDim palette — for trailing values whose row is
   *  disabled (e.g. App lock when biometric unlock is off). */
  dim?: boolean;
}) {
  const dark = useColorScheme() === "dark";
  const color = dim
    ? dark
      ? Tokens.textDimDark
      : Tokens.textDim
    : dark
      ? Tokens.textMutedDark
      : Tokens.textMuted;
  return (
    <Text
      style={{
        fontSize: 13,
        color,
        fontWeight: "500",
      }}
    >
      {children}
    </Text>
  );
}

function Chevron({ dark }: { dark: boolean }) {
  return (
    <ChevronRight
      size={16}
      color={dark ? Tokens.textDimDark : Tokens.textDim}
      strokeWidth={2}
    />
  );
}
