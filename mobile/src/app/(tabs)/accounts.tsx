// app/(tabs)/accounts.tsx — Accounts
// 1:1 port of the Mobile UI mock. Lives inside the (tabs) group so it
// inherits the bottom tab bar + side drawer chrome, but it isn't IN the
// bottom tabs — users reach it via the side drawer's "Accounts" item.

import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Banknote,
  CreditCard,
  Pencil,
  Plus,
  Wallet,
  type LucideIcon,
} from "lucide-react-native";

import { useAccounts, type AccountDoc } from "@/hooks/useAccounts";
import { useDrawer } from "@/lib/stores";
import { Tokens } from "@/lib/design";
import { formatCurrency } from "@/lib/format";

import { AccountSheet } from "@/components/accounts/AccountSheet";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { ScreenHead } from "@/components/ui/ScreenHead";
import { Skeleton } from "@/components/ui/Skeleton";

// Deterministic fallback color so an account without a `color` field still
// gets something recognisable — same color across reloads, but persists to
// the backend the first time the user opens the edit sheet and saves.
const FALLBACK_PALETTE = ["#6366f1", "#10b981", "#f43f5e", "#f59e0b", "#14b8a6", "#a855f7"];
function fallbackColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return FALLBACK_PALETTE[h % FALLBACK_PALETTE.length];
}

function iconForType(type: AccountDoc["type"]): LucideIcon {
  if (type === "cash") return Banknote;
  if (type === "other") return Wallet;
  return CreditCard;
}

function subtitleFor(account: AccountDoc): string {
  if (account.type === "cash") return "in hand";
  if (account.type === "other") return "wallet";
  // Use the last 4 chars of the id as a visual "account number" so each
  // bank/credit card row reads like the mock ("•• 4421").
  const tail = account._id.slice(-4);
  return `•• ${tail}`;
}

export default function AccountsScreen() {
  const dark = useColorScheme() === "dark";
  const openDrawer = useDrawer((s) => s.toggle);
  const { data: accountsRaw = [], isLoading, isRefetching, refetch } = useAccounts({ includeGoals: false });

  // Hide system + soft-deleted from the list — they're internals, not user
  // bank/wallet accounts.
  const accounts = useMemo(
    () => accountsRaw.filter((a) => !a.isSystem && !a.isDeleted),
    [accountsRaw],
  );

  const totals = useMemo(() => {
    const total = accounts.reduce((s, a) => s + (a.balance ?? 0), 0);
    return { total };
  }, [accounts]);

  // Sheet state
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editing, setEditing] = useState<AccountDoc | null>(null);
  const openCreate = () => {
    setEditing(null);
    setSheetVisible(true);
  };
  const openEdit = (a: AccountDoc) => {
    setEditing(a);
    setSheetVisible(true);
  };

  const onRefresh = useCallback(() => refetch(), [refetch]);

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-surface-muted dark:bg-surface-dark-elev"
    >
      <View style={{ paddingHorizontal: 16 }}>
        <ScreenHead
          title="Accounts"
          subtitle="All your money in one place"
          onMenu={openDrawer}
          trailing={
            <Pressable
              onPress={openCreate}
              hitSlop={6}
              android_ripple={{ color: "rgba(255,255,255,0.18)", borderless: true }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: Tokens.brand,
                marginTop: 4,
                shadowColor: Tokens.brand,
                shadowOpacity: 0.35,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 6 },
                elevation: 4,
                overflow: "hidden",
              }}
            >
              <Plus size={18} color="#ffffff" strokeWidth={2.4} />
            </Pressable>
          }
        />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140, paddingTop: 4 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={Tokens.brand}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — total across accounts */}
        {isLoading ? (
          <Card style={{ padding: 20, marginBottom: 14 }}>
            <Skeleton width="50%" height={11} />
            <View style={{ height: 12 }} />
            <Skeleton width="70%" height={30} />
          </Card>
        ) : (
          <Card style={{ padding: 20, marginBottom: 14 }}>
            <Text
              className="text-fg-muted dark:text-fg-dark-muted text-[10.5px] font-bold uppercase"
              style={{ letterSpacing: 0.8 }}
            >
              Total across accounts
            </Text>
            <Money
              value={totals.total}
              className="text-fg dark:text-fg-dark text-[30px] font-bold mt-2"
              style={{ letterSpacing: -1 }}
            />
          </Card>
        )}

        {/* Account rows */}
        {isLoading ? (
          <View style={{ gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <Card key={i} style={{ padding: 14, gap: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Skeleton width={42} height={42} radius={12} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Skeleton width="60%" height={14} />
                    <Skeleton width="40%" height={11} />
                  </View>
                  <Skeleton width={80} height={16} />
                </View>
                <Skeleton width="100%" height={4} radius={99} />
              </Card>
            ))}
          </View>
        ) : accounts.length === 0 ? (
          <Card style={{ padding: 24, alignItems: "center" }}>
            <Text className="text-fg dark:text-fg-dark text-[15px] font-semibold">
              No accounts yet
            </Text>
            <Text className="text-fg-muted dark:text-fg-dark-muted text-[12.5px] text-center mt-1">
              Tap + to add your first account.
            </Text>
          </Card>
        ) : (
          <View style={{ gap: 12 }}>
            {accounts.map((a) => (
              <AccountCard
                key={a._id}
                account={a}
                total={totals.total}
                dark={dark}
                onEdit={openEdit}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <AccountSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        editing={editing}
      />
    </SafeAreaView>
  );
}

function AccountCard({
  account,
  total,
  dark,
  onEdit,
}: {
  account: AccountDoc;
  total: number;
  dark: boolean;
  onEdit: (a: AccountDoc) => void;
}) {
  const color = account.color ?? fallbackColor(account._id);
  const Icon = iconForType(account.type);
  const share = total > 0 ? (account.balance / total) * 100 : 0;
  const clampedShare = Math.max(0, Math.min(100, share));

  return (
    <Card style={{ padding: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {/* Color-tinted icon tile */}
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            backgroundColor: tint(color, dark ? 0.18 : 0.14),
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={20} color={color} strokeWidth={2.2} />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={1}
            className="text-fg dark:text-fg-dark text-[14.5px] font-semibold"
            style={{ letterSpacing: -0.1 }}
          >
            {account.name}
          </Text>
          <Text
            className="text-fg-muted dark:text-fg-dark-muted text-[11.5px] mt-0.5"
          >
            {subtitleFor(account)}
          </Text>
        </View>

        <Money
          value={account.balance}
          className="text-fg dark:text-fg-dark text-[15px] font-bold"
        />

        <Pressable
          onPress={() => onEdit(account)}
          hitSlop={6}
          android_ripple={{
            color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            borderless: true,
          }}
          style={{
            width: 28,
            height: 28,
            borderRadius: 99,
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 4,
          }}
        >
          <Pencil
            size={14}
            color={dark ? Tokens.textMutedDark : Tokens.textMuted}
            strokeWidth={2}
          />
        </Pressable>
      </View>

      {/* Share-of-total bar, color-tinted gradient. */}
      <View
        style={{
          marginTop: 12,
          height: 6,
          borderRadius: 99,
          backgroundColor: dark ? Tokens.bgElevDark : Tokens.bgElev,
          overflow: "hidden",
        }}
      >
        <LinearGradient
          colors={[color, lightenHex(color, 0.2)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            width: `${clampedShare}%`,
            height: "100%",
            borderRadius: 99,
          }}
        />
      </View>

      <Text
        className="text-fg-muted dark:text-fg-dark-muted text-[11px] mt-2"
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {share < 0.5
          ? "< 1% of total balance"
          : `${share.toFixed(0)}% of total balance`}
      </Text>
    </Card>
  );
}

// ── color helpers ────────────────────────────────────────────────────────

function lightenHex(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

// Return the icon-tile background — a translucent tint of the brand color
// so the colored icon still pops. Uses rgba so dark mode auto-adapts.
function tint(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}
