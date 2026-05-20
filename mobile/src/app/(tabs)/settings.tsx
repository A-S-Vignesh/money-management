// app/(tabs)/settings.tsx — Settings
// 1:1 port of the Mobile UI mock's SettingsScreen. Sectioned into:
//   Appearance · Notifications · Security · Data · About
//
// Lives inside (tabs) so it inherits the bottom tab bar + drawer chrome,
// but it isn't IN the bottom tabs — reached via the side drawer's
// "Settings" item.

import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

export default function SettingsScreen() {
  const dark = useColorScheme() === "dark";
  const openDrawer = useDrawer((s) => s.toggle);
  const themePref = useTheme((s) => s.pref);
  const setThemeSmooth = useTheme((s) => s.setPrefSmooth);

  // Placeholder toggles (UI-only — backend doesn't have notification
  // preference endpoints yet). Local state is fine until those land.
  const [pushNotif, setPushNotif] = useState(true);
  const [emailDigests, setEmailDigests] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [investUpdates, setInvestUpdates] = useState(false);
  const [biometric, setBiometric] = useState(true);
  const [hideBalance, setHideBalance] = useState(false);

  // "Dark mode" is a binary toggle in the mock. We map it onto the existing
  // 3-way theme store (system / light / dark): toggling on → "dark",
  // toggling off → "light".
  //
  // setPrefSmooth shows the ThemeTransitionOverlay (mounted at the root
  // layout) which fades through the destination bg color while the actual
  // theme swap happens at peak opacity — hides the synchronous cascade.
  const darkOn = themePref === "dark" || (themePref === "system" && dark);
  const toggleDark = (next: boolean) => setThemeSmooth(next ? "dark" : "light");

  // Last-sync stamp — purely visual for now. Reset on screen mount so the
  // "2m ago" shows realistic values without persistent state.
  const lastSync = useMemo(() => dayjs().subtract(2, "minute").toISOString(), []);

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
              trailing={<ValueText>INR ₹</ValueText>}
            />
            <SettingRow
              Icon={Calendar}
              tone="purple"
              label="Date format"
              trailing={<ValueText>DD MMM YYYY</ValueText>}
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
              trailing={<SettingSwitch value={pushNotif} onChange={setPushNotif} />}
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
              trailing={<SettingSwitch value={biometric} onChange={setBiometric} />}
            />
            <SettingRow
              Icon={Lock}
              tone="rose"
              label="App lock"
              trailing={<ValueText>After 1 min</ValueText>}
            />
            <SettingRow
              Icon={Shield}
              tone="brand"
              label="Two-factor auth"
              onPress={() => {
                /* TODO: open 2FA setup */
              }}
              trailing={<Chevron dark={dark} />}
            />
            <SettingRow
              Icon={Eye}
              tone="purple"
              label="Hide balance on open"
              trailing={<SettingSwitch value={hideBalance} onChange={setHideBalance} />}
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
              onPress={() => {
                /* TODO: trigger CSV export */
              }}
              trailing={<Chevron dark={dark} />}
            />
            <SettingRow
              Icon={Repeat}
              tone="brand"
              label="Sync now"
              onPress={() => {
                /* TODO: trigger queryClient.invalidateQueries() */
              }}
              trailing={
                <ValueText>
                  {dayjs().diff(lastSync, "minute")}m ago
                </ValueText>
              }
            />
            <SettingRow
              Icon={Trash2}
              tone="rose"
              label="Delete account"
              danger
              onPress={() => {
                /* TODO: confirm + DELETE /api/account/delete */
              }}
              trailing={
                <ChevronRight size={16} color={Tokens.rose} strokeWidth={2} />
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
              onPress={() => {
                /* TODO: open in-app webview */
              }}
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
    </SafeAreaView>
  );
}

// ── Small helpers ────────────────────────────────────────────────────────

function ValueText({ children }: { children: React.ReactNode }) {
  const dark = useColorScheme() === "dark";
  return (
    <Text
      style={{
        fontSize: 13,
        color: dark ? Tokens.textMutedDark : Tokens.textMuted,
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
