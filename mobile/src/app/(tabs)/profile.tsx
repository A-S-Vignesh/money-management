// app/(tabs)/profile.tsx — Profile
// 1:1 port of the Mobile UI mock's ProfileScreen:
//   - Header card: gradient-avatar w/ edit pencil overlay + name + email + PRO pill
//   - Quick stats: Transactions | Goals | Accounts counts
//   - Accounts mini-list (taps open Accounts page)
//   - More section: Settings / Notifications / Privacy / Help / Log out
//   - Version footer

import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  Award,
  Banknote,
  Bell,
  ChevronRight,
  CreditCard,
  Edit,
  HelpCircle,
  LogOut,
  Settings,
  Shield,
  Wallet,
  type LucideIcon,
} from "lucide-react-native";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useDrawer } from "@/lib/stores";
import { useAccounts, type AccountDoc } from "@/hooks/useAccounts";
import { useProfile } from "@/hooks/useProfile";
import { useTransactions } from "@/hooks/useTransactions";
import { Tokens } from "@/lib/design";
import { formatCurrency } from "@/lib/format";

import { EditProfileSheet } from "@/components/profile/EditProfileSheet";
import { Card } from "@/components/ui/Card";
import { ScreenHead } from "@/components/ui/ScreenHead";
import { Section } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/Skeleton";
import { SettingRow } from "@/components/settings/SettingRow";
import { useColorScheme } from "@/hooks/useAppColorScheme";

function iconForAccount(type: AccountDoc["type"]): LucideIcon {
  if (type === "cash") return Banknote;
  if (type === "other") return Wallet;
  return CreditCard;
}

function accountSubtitle(a: AccountDoc): string {
  if (a.type === "cash") return "in hand";
  if (a.type === "other") return "wallet";
  return `•• ${a._id.slice(-4)}`;
}

export default function ProfileScreen() {
  const router = useRouter();
  const dark = useColorScheme() === "dark";
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const openDrawer = useDrawer((s) => s.toggle);

  const { data: accountsRaw = [], isLoading: accountsLoading } = useAccounts({
    includeGoals: false,
  });
  const { data: profile } = useProfile();
  const [editOpen, setEditOpen] = useState(false);
  const { data: txData, isLoading: txLoading } = useTransactions({ limit: 1 });

  // Goals count — no dedicated hook yet, inline lightweight fetch off the
  // existing /api/goals endpoint.
  const { data: goalsCount } = useQuery<number>({
    queryKey: ["goals-count"],
    queryFn: async () => {
      const env = await api<{ data: unknown[]; pagination: { total: number } }>(
        "/api/goals",
        { query: { limit: 1 }, envelope: true },
      );
      return env.pagination?.total ?? 0;
    },
  });

  const accounts = useMemo(
    () => accountsRaw.filter((a) => !a.isSystem && !a.isDeleted),
    [accountsRaw],
  );

  const initials = (user?.name ?? "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-surface-muted dark:bg-surface-dark-elev"
    >
      <View style={{ paddingHorizontal: 16 }}>
        <ScreenHead
          title="Profile"
          onMenu={openDrawer}
          trailing={
            <Pressable
              onPress={() => setEditOpen(true)}
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
                marginTop: 4,
                backgroundColor: dark ? Tokens.cardDark : Tokens.card,
                borderWidth: 1,
                borderColor: dark ? Tokens.borderDark : Tokens.border,
                overflow: "hidden",
              }}
            >
              <Edit
                size={17}
                color={dark ? Tokens.textDarkPrimary : Tokens.text}
                strokeWidth={2}
              />
            </Pressable>
          }
        />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 140,
          paddingTop: 4,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header card ────────────────────────────────────────── */}
        <Card style={{ padding: 18, marginBottom: 16, overflow: "hidden" }}>
          {/* Brand-tinted radial corner blob — matches mock. */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 140,
              height: 140,
              borderRadius: 99,
              backgroundColor: dark ? "#1e3a8a55" : Tokens.brandSoft,
              opacity: 0.7,
            }}
          />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Pressable
              onPress={() => setEditOpen(true)}
              hitSlop={4}
              style={{ position: "relative" }}
            >
              {/* Google OAuth profile image when available, gradient-initials
                  fallback otherwise. Image keeps the same brand shadow so
                  the swap looks intentional, not jarring. */}
              {(profile?.image ?? user?.image) ? (
                <ExpoImage
                  source={{ uri: profile?.image ?? user?.image }}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 99,
                  }}
                  contentFit="cover"
                  transition={120}
                />
              ) : (
                <LinearGradient
                  colors={[Tokens.brand, Tokens.brand3]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 99,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: Tokens.brand,
                    shadowOpacity: 0.5,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 6,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 22,
                      fontWeight: "800",
                      letterSpacing: -0.6,
                    }}
                  >
                    {initials || "U"}
                  </Text>
                </LinearGradient>
              )}
              {/* Edit pencil overlay */}
              <View
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  width: 22,
                  height: 22,
                  borderRadius: 99,
                  backgroundColor: dark ? Tokens.textDarkPrimary : Tokens.text,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2.5,
                  borderColor: dark ? Tokens.cardDark : Tokens.card,
                }}
              >
                <Edit
                  size={10}
                  color={dark ? Tokens.text : Tokens.card}
                  strokeWidth={2.4}
                />
              </View>
            </Pressable>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                numberOfLines={1}
                className="text-fg dark:text-fg-dark text-[18px] font-bold"
                style={{ letterSpacing: -0.4 }}
              >
                {user?.name ?? "—"}
              </Text>
              <Text
                numberOfLines={1}
                className="text-fg-muted dark:text-fg-dark-muted text-[12.5px] mt-0.5"
              >
                {user?.email ?? ""}
              </Text>
              <View
                style={{
                  marginTop: 8,
                  alignSelf: "flex-start",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: dark ? "#1e3a8a55" : Tokens.brandSoft,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 99,
                }}
              >
                <Award size={11} color={Tokens.brand} strokeWidth={2.5} />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color: Tokens.brand,
                    letterSpacing: 0.3,
                  }}
                >
                  PRO PLAN
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* ── Stats row ─────────────────────────────────────────── */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
          <StatCard
            value={txLoading ? "—" : (txData?.pagination?.total ?? 0)}
            label="Transactions"
          />
          <StatCard
            value={typeof goalsCount === "number" ? goalsCount : "—"}
            label="Goals"
          />
          <StatCard
            value={accountsLoading ? "—" : accounts.length}
            label="Accounts"
          />
        </View>

        {/* ── Accounts mini-list ────────────────────────────────── */}
        <Section
          title="Accounts"
          trailing={
            <Pressable
              onPress={() => router.push("/(tabs)/accounts" as never)}
              hitSlop={6}
              android_ripple={{
                color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              }}
              style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
            >
              <Text style={{ color: Tokens.brand, fontSize: 13, fontWeight: "600" }}>
                + Add
              </Text>
              <ChevronRight size={14} color={Tokens.brand} strokeWidth={2.4} />
            </Pressable>
          }
        >
          {accountsLoading ? (
            <Card style={{ padding: 14, gap: 12 }}>
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
                >
                  <Skeleton width={36} height={36} radius={11} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Skeleton width="50%" height={13} />
                    <Skeleton width="30%" height={11} />
                  </View>
                  <Skeleton width={80} height={14} />
                </View>
              ))}
            </Card>
          ) : accounts.length === 0 ? (
            <Card style={{ padding: 20, alignItems: "center" }}>
              <Text className="text-fg dark:text-fg-dark text-[14px] font-semibold">
                No accounts yet
              </Text>
              <Text className="text-fg-muted dark:text-fg-dark-muted text-[12px] text-center mt-1">
                Tap "+ Add" to create your first.
              </Text>
            </Card>
          ) : (
            <Card
              style={{ paddingHorizontal: 0, paddingVertical: 0, overflow: "hidden" }}
            >
              {accounts.map((a, i) => (
                <AccountMiniRow
                  key={a._id}
                  account={a}
                  dark={dark}
                  last={i === accounts.length - 1}
                  onPress={() => router.push("/(tabs)/accounts" as never)}
                />
              ))}
            </Card>
          )}
        </Section>

        {/* ── More ──────────────────────────────────────────────── */}
        <Section title="More">
          <Card
            style={{ paddingHorizontal: 0, paddingVertical: 0, overflow: "hidden" }}
          >
            <SettingRow
              Icon={Settings}
              tone="brand"
              label="Settings"
              onPress={() => router.push("/(tabs)/settings" as never)}
              trailing={<Chevron dark={dark} />}
            />
            <SettingRow
              Icon={Bell}
              tone="amber"
              label="Notifications"
              onPress={() => {
                /* TODO: notifications screen */
              }}
              trailing={<Chevron dark={dark} />}
            />
            <SettingRow
              Icon={Shield}
              tone="emerald"
              label="Privacy & Security"
              onPress={() => router.push("/(tabs)/settings" as never)}
              trailing={<Chevron dark={dark} />}
            />
            <SettingRow
              Icon={HelpCircle}
              tone="purple"
              label="Help & Support"
              onPress={() => {
                /* TODO: help screen */
              }}
              trailing={<Chevron dark={dark} />}
            />
            <SettingRow
              Icon={LogOut}
              tone="rose"
              label="Log out"
              danger
              onPress={handleSignOut}
              trailing={
                <ChevronRight size={16} color={Tokens.rose} strokeWidth={2} />
              }
              last
            />
          </Card>
        </Section>

        <Text
          style={{
            textAlign: "center",
            paddingVertical: 12,
            fontSize: 11,
            color: dark ? Tokens.textDimDark : Tokens.textDim,
            letterSpacing: 0.3,
          }}
        >
          Money Nest · v0.1.0
        </Text>
      </ScrollView>

      <EditProfileSheet
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        profile={profile}
      />
    </SafeAreaView>
  );
}

// ── Small components ─────────────────────────────────────────────────────

function StatCard({
  value,
  label,
}: {
  value: number | string;
  label: string;
}) {
  return (
    <Card style={{ flex: 1, padding: 12, alignItems: "center" }}>
      <Text
        className="text-fg dark:text-fg-dark text-[18px] font-bold"
        style={{ fontVariant: ["tabular-nums"], letterSpacing: -0.3 }}
      >
        {value}
      </Text>
      <Text
        className="text-fg-muted dark:text-fg-dark-muted text-[10.5px] font-semibold mt-0.5"
        style={{ letterSpacing: 0.2 }}
      >
        {label}
      </Text>
    </Card>
  );
}

function AccountMiniRow({
  account,
  dark,
  last,
  onPress,
}: {
  account: AccountDoc;
  dark: boolean;
  last: boolean;
  onPress: () => void;
}) {
  const Icon = iconForAccount(account.type);
  const color = account.color ?? Tokens.brand;
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{
        color: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 13,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: dark ? Tokens.borderDark : Tokens.border,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 11,
          backgroundColor: tint(color, dark ? 0.18 : 0.14),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={18} color={color} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          className="text-fg dark:text-fg-dark text-[13.5px] font-semibold"
        >
          {account.name}
        </Text>
        <Text
          numberOfLines={1}
          className="text-fg-muted dark:text-fg-dark-muted text-[11.5px] mt-0.5"
        >
          {accountSubtitle(account)}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "700",
          color: dark ? Tokens.textDarkPrimary : Tokens.text,
          fontVariant: ["tabular-nums"],
          letterSpacing: -0.2,
        }}
      >
        {formatCurrency(account.balance)}
      </Text>
    </Pressable>
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

function tint(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}
