// app/holdings/[id].tsx — Holding detail
// Mirrors what real brokerage apps (Zerodha, Robinhood, INDmoney) show:
//   - Big gradient hero (type colour) with market value + P&L
//   - Stats: avg cost / current / qty / invested / realised P&L
//   - Actions: Buy / Sell / Update price / Edit / Delete
//   - Linked transactions list — every Buy / Sell row preserved here
//
// All actions open the unified HoldingActionSheet with a different mode.

import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Pencil,
  RefreshCw,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react-native";
import dayjs from "dayjs";

import { useColorScheme } from "@/hooks/useAppColorScheme";
import {
  useDeleteHolding,
  useHolding,
  type HoldingType,
} from "@/hooks/useHoldings";
import { useTransactions } from "@/hooks/useTransactions";
import { lightenHex } from "@/lib/colors";
import { useCurrency } from "@/lib/currency";
import { useDateFormat } from "@/lib/dateFormat";
import { Tokens } from "@/lib/design";
import { formatCurrency, formatDate } from "@/lib/format";

import {
  HoldingActionSheet,
  type HoldingActionMode,
} from "@/components/investments/HoldingActionSheet";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { Skeleton } from "@/components/ui/Skeleton";

const TYPE_COLOR: Record<HoldingType, string> = {
  stock: "#6366f1",
  mutual_fund: "#10b981",
  etf: "#14b8a6",
  fd: "#a855f7",
  gold: "#eab308",
  ppf: "#3b82f6",
  crypto: "#f59e0b",
  real_estate: "#ec4899",
  other: "#94a3b8",
};

export default function HoldingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dark = useColorScheme() === "dark";
  const router = useRouter();

  const { data: holding, isLoading, isRefetching, refetch } = useHolding(id);
  const deleteMut = useDeleteHolding();
  // Re-render on currency / date-format change — see (tabs)/_layout
  // for the same pattern.
  useCurrency((s) => s.code);
  useDateFormat((s) => s.code);

  const [actionMode, setActionMode] = useState<HoldingActionMode | null>(null);

  // All buy/sell transactions linked to this holding. Filter client-side
  // since transactions endpoint doesn't support holdingId yet — fine
  // because the user has tens, not thousands, of transactions.
  const { data: txData } = useTransactions({ limit: 200 });
  const transactions = useMemo(() => {
    if (!holding || !txData?.data) return [];
    return txData.data
      .filter(
        (t) =>
          (t.fromAccountId === holding.accountId ||
            t.toAccountId === holding.accountId) &&
          (t.category === "Investment Buy" || t.category === "Investment Sell"),
      )
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [holding, txData]);

  const screenBg = dark ? "#0a0b0e" : "#f5f6fa";

  if (isLoading || !holding) {
    return (
      <View collapsable={false} style={{ flex: 1, backgroundColor: screenBg }}>
        <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: screenBg }}>
          <View style={{ padding: 16 }}>
            <Skeleton width={40} height={40} radius={12} />
            <View style={{ height: 14 }} />
            <Skeleton width="100%" height={180} radius={24} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const color = TYPE_COLOR[holding.type] ?? Tokens.brand;
  const value = holding.quantity * holding.currentPrice;
  const invested = holding.quantity * holding.avgCostPrice;
  const unrealizedPnL = value - invested;
  const unrealizedPct = invested > 0 ? (unrealizedPnL / invested) * 100 : 0;
  const up = unrealizedPnL >= 0;

  const confirmDelete = () => {
    Alert.alert(
      "Delete holding?",
      `Removes ${holding.name}. Past buy/sell transactions stay as historical record. Any cash sitting in the broker account remains — transfer it out separately if needed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMut.mutateAsync(holding._id);
              router.back();
            } catch (err) {
              Alert.alert("Couldn't delete", (err as Error).message ?? "Try again.");
            }
          },
        },
      ],
    );
  };

  return (
    <View collapsable={false} style={{ flex: 1, backgroundColor: screenBg }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: screenBg }}>

      {/* Custom back + delete row */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 4,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          android_ripple={{
            color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            borderless: true,
          }}
          style={iconBtnStyle(dark)}
        >
          <ArrowLeft
            size={18}
            color={dark ? Tokens.textDarkPrimary : Tokens.text}
            strokeWidth={2.2}
          />
        </Pressable>
        <Pressable
          onPress={confirmDelete}
          hitSlop={8}
          android_ripple={{ color: "rgba(225,29,72,0.12)", borderless: true }}
          style={{
            ...iconBtnStyle(dark),
            borderColor: Tokens.roseSoft,
            backgroundColor: dark ? "#3a1320" : Tokens.roseBg,
          }}
        >
          <Trash2 size={16} color={Tokens.rose} strokeWidth={2.2} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140, paddingTop: 8 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={Tokens.brand}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <LinearGradient
          colors={[color, lightenHex(color, 0.22)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            padding: 20,
            borderRadius: 24,
            marginBottom: 14,
            shadowColor: color,
            shadowOpacity: 0.35,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
            elevation: 8,
          }}
        >
          <Text
            style={{
              color: "rgba(255,255,255,0.78)",
              fontSize: 10.5,
              fontWeight: "800",
              letterSpacing: 1,
            }}
          >
            {(holding.symbol || holding.name).toUpperCase()}
          </Text>
          <Text
            style={{
              color: "#fff",
              fontSize: 22,
              fontWeight: "800",
              marginTop: 4,
              letterSpacing: -0.6,
            }}
            numberOfLines={1}
          >
            {holding.name}
          </Text>
          <Money
            value={value}
            className="text-white text-[34px] font-bold mt-4"
            style={{ letterSpacing: -1.2 }}
          />
          <Text style={{ color: "rgba(255,255,255,0.78)", fontSize: 12.5, marginTop: 2 }}>
            Market value · {holding.quantity} units
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginTop: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.22)",
              }}
            >
              {up ? (
                <TrendingUp size={11} color="#fff" strokeWidth={2.4} />
              ) : (
                <TrendingDown size={11} color="#fff" strokeWidth={2.4} />
              )}
              <Text
                style={{
                  color: "#fff",
                  fontSize: 11.5,
                  fontWeight: "700",
                  fontVariant: ["tabular-nums"],
                }}
              >
                {up ? "+" : ""}
                {unrealizedPct.toFixed(2)}%
              </Text>
            </View>
            <Text
              style={{
                color: "#fff",
                fontSize: 12,
                fontWeight: "600",
                fontVariant: ["tabular-nums"],
              }}
            >
              {up ? "+" : ""}
              {formatCurrency(unrealizedPnL)}
            </Text>
          </View>
        </LinearGradient>

        {/* Stat grid */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
          <Stat label="Avg cost" value={formatCurrency(holding.avgCostPrice)} />
          <Stat label="Current" value={formatCurrency(holding.currentPrice)} />
        </View>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          <Stat label="Invested" value={formatCurrency(invested)} />
          <Stat
            label="Realised P&L"
            value={formatCurrency(holding.realizedPnL)}
            valueColor={
              holding.realizedPnL > 0
                ? Tokens.emerald
                : holding.realizedPnL < 0
                  ? Tokens.rose
                  : undefined
            }
          />
        </View>

        {/* Action grid */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 8 }}>
          <ActionTile
            color={color}
            Icon={TrendingUp}
            label="Buy more"
            onPress={() => setActionMode("buy")}
          />
          <ActionTile
            color={Tokens.rose}
            Icon={TrendingDown}
            label="Sell"
            onPress={() => setActionMode("sell")}
            disabled={holding.quantity <= 0}
          />
        </View>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 22 }}>
          <ActionTile
            color={Tokens.brand}
            Icon={RefreshCw}
            label="Update price"
            onPress={() => setActionMode("price")}
            outline
          />
          <ActionTile
            color={Tokens.brand}
            Icon={Pencil}
            label="Edit"
            onPress={() => setActionMode("edit")}
            outline
          />
        </View>

        {/* Transactions */}
        <Text className="text-fg dark:text-fg-dark text-[16px] font-bold mb-3">
          Activity
        </Text>
        {transactions.length === 0 ? (
          <Card style={{ padding: 20, alignItems: "center" }}>
            <Text className="text-fg dark:text-fg-dark text-[14px] font-semibold">
              No activity yet
            </Text>
            <Text className="text-fg-muted dark:text-fg-dark-muted text-[12px] text-center mt-1">
              Buy or sell to add an entry here.
            </Text>
          </Card>
        ) : (
          <Card style={{ paddingHorizontal: 0, paddingVertical: 0, overflow: "hidden" }}>
            {transactions.map((tx, i) => {
              const isBuy = tx.category === "Investment Buy";
              return (
                <View
                  key={tx._id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 13,
                    borderBottomWidth: i === transactions.length - 1 ? 0 : 1,
                    borderBottomColor: dark ? Tokens.borderDark : Tokens.border,
                  }}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 11,
                      backgroundColor: isBuy
                        ? dark
                          ? "#14532d"
                          : Tokens.emeraldBg
                        : dark
                          ? "#5a1d2e"
                          : Tokens.roseBg,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isBuy ? (
                      <ArrowDownLeft size={16} color={Tokens.emerald} strokeWidth={2.2} />
                    ) : (
                      <ArrowUpRight size={16} color={Tokens.rose} strokeWidth={2.2} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text className="text-fg dark:text-fg-dark text-[13.5px] font-semibold">
                      {isBuy ? "Bought" : "Sold"}
                    </Text>
                    <Text className="text-fg-muted dark:text-fg-dark-muted text-[11.5px] mt-0.5">
                      {formatDate(tx.date, "full")}
                    </Text>
                  </View>
                  <Money
                    value={tx.amount}
                    prefix={isBuy ? "-" : "+"}
                    className={
                      isBuy
                        ? "text-rose text-[14px] font-bold"
                        : "text-emerald text-[14px] font-bold"
                    }
                  />
                </View>
              );
            })}
          </Card>
        )}
      </ScrollView>

      {actionMode ? (
        <HoldingActionSheet
          visible={!!actionMode}
          onClose={() => setActionMode(null)}
          mode={actionMode}
          holding={holding}
          accent={color}
        />
      ) : null}
      </SafeAreaView>
    </View>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <Card style={{ flex: 1, padding: 12 }}>
      <Text
        className="text-fg-muted dark:text-fg-dark-muted text-[10.5px] font-bold uppercase"
        style={{ letterSpacing: 0.6 }}
      >
        {label}
      </Text>
      <Text
        className={valueColor ? "" : "text-fg dark:text-fg-dark"}
        style={{
          fontSize: 16,
          fontWeight: "700",
          marginTop: 4,
          letterSpacing: -0.2,
          fontVariant: ["tabular-nums"],
          ...(valueColor ? { color: valueColor } : {}),
        }}
      >
        {value}
      </Text>
    </Card>
  );
}

function ActionTile({
  color,
  Icon,
  label,
  onPress,
  outline,
  disabled,
}: {
  color: string;
  Icon: typeof TrendingUp;
  label: string;
  onPress: () => void;
  outline?: boolean;
  disabled?: boolean;
}) {
  const dark = useColorScheme() === "dark";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      android_ripple={{ color: "rgba(255,255,255,0.18)" }}
      style={{
        flex: 1,
        borderRadius: 14,
        overflow: "hidden",
        opacity: disabled ? 0.5 : 1,
        shadowColor: color,
        shadowOpacity: outline ? 0 : 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: outline ? 0 : 4,
      }}
    >
      <View
        style={{
          height: 48,
          borderRadius: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          backgroundColor: outline
            ? dark
              ? Tokens.cardDark
              : Tokens.card
            : color,
          borderWidth: outline ? 1 : 0,
          borderColor: outline ? (dark ? Tokens.borderDark : Tokens.border) : "transparent",
        }}
      >
        <Icon
          size={15}
          color={outline ? (dark ? Tokens.textDarkPrimary : Tokens.text) : "#fff"}
          strokeWidth={2.4}
        />
        <Text
          style={{
            color: outline ? (dark ? Tokens.textDarkPrimary : Tokens.text) : "#fff",
            fontSize: 13.5,
            fontWeight: "600",
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function iconBtnStyle(dark: boolean) {
  return {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: dark ? Tokens.cardDark : Tokens.card,
    borderWidth: 1,
    borderColor: dark ? Tokens.borderDark : Tokens.border,
    overflow: "hidden" as const,
  };
}

