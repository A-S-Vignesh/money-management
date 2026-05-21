// app/(tabs)/investments.tsx — Investments
// 1:1 port of the Mobile UI mock:
//   - Gradient portfolio-value hero (emerald)
//   - Allocation card with donut + legend (ASSETS N in centre)
//   - Holdings list with per-row symbol monogram tile + name + units +
//     price + value + day-change %
//   - + Add button opens the AddInvestmentSheet
//
// Lives inside (tabs) so it shares the tab bar + drawer chrome but isn't
// a bottom-tab itself — reached via the side drawer's "Investments" link.

import { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronRight, Plus, TrendingDown, TrendingUp } from "lucide-react-native";

import { useColorScheme } from "@/hooks/useAppColorScheme";
import { useDrawer } from "@/lib/stores";
import {
  useHoldings,
  usePortfolio,
  type HoldingDoc,
  type HoldingType,
} from "@/hooks/useHoldings";
import { Tokens } from "@/lib/design";
import { formatCurrency } from "@/lib/format";

import { AddInvestmentSheet } from "@/components/investments/AddInvestmentSheet";
import { Card } from "@/components/ui/Card";
import { Donut } from "@/components/ui/Donut";
import { Money } from "@/components/ui/Money";
import { ScreenHead } from "@/components/ui/ScreenHead";
import { Skeleton } from "@/components/ui/Skeleton";

// Per-type colours for the allocation donut + monogram tile. Match the
// AddInvestmentSheet asset colours so a Mutual Fund row reads as the
// same green pill as the "Mutual" chip.
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

const TYPE_LABEL: Record<HoldingType, string> = {
  stock: "Stocks",
  mutual_fund: "Mutual",
  etf: "ETF",
  fd: "FD",
  gold: "Gold",
  ppf: "PPF",
  crypto: "Crypto",
  real_estate: "Real estate",
  other: "Other",
};

export default function InvestmentsScreen() {
  const dark = useColorScheme() === "dark";
  const openDrawer = useDrawer((s) => s.toggle);
  const { data: portfolio, isLoading: pfLoading, isRefetching, refetch: refetchPf } = usePortfolio();
  const { data: holdings = [], refetch: refetchH } = useHoldings();
  const [sheetOpen, setSheetOpen] = useState(false);

  const onRefresh = () => Promise.all([refetchPf(), refetchH()]);

  const summary = portfolio?.summary;
  const allocation = portfolio?.allocationByType ?? [];

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-surface-muted dark:bg-surface-dark-elev">
      <View style={{ paddingHorizontal: 16 }}>
        <ScreenHead
          title="Investments"
          subtitle="Portfolio overview"
          onMenu={openDrawer}
          trailing={
            <Pressable
              onPress={() => setSheetOpen(true)}
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
        {/* Hero — portfolio value (emerald gradient, matches mock) */}
        {pfLoading || !summary ? (
          <Card style={{ padding: 22, marginBottom: 16 }}>
            <Skeleton width="40%" height={12} />
            <View style={{ height: 12 }} />
            <Skeleton width="70%" height={32} />
          </Card>
        ) : (
          <LinearGradient
            colors={["#065f46", "#10b981"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              padding: 22,
              borderRadius: 24,
              marginBottom: 16,
              shadowColor: "#10b981",
              shadowOpacity: 0.35,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 10 },
              elevation: 8,
            }}
          >
            <Text
              style={{
                color: "rgba(255,255,255,0.78)",
                fontSize: 11,
                fontWeight: "800",
                letterSpacing: 1,
              }}
            >
              PORTFOLIO VALUE
            </Text>
            <Money
              value={summary.currentValue}
              className="text-white text-[34px] font-bold mt-2"
              style={{ letterSpacing: -1.2 }}
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginTop: 10,
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
                  backgroundColor: "rgba(255,255,255,0.18)",
                }}
              >
                {summary.unrealizedPnLPct >= 0 ? (
                  <TrendingUp size={11} color="#ffffff" strokeWidth={2.4} />
                ) : (
                  <TrendingDown size={11} color="#ffffff" strokeWidth={2.4} />
                )}
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 11.5,
                    fontWeight: "700",
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {summary.unrealizedPnLPct >= 0 ? "+" : ""}
                  {summary.unrealizedPnLPct.toFixed(2)}%
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
                {summary.unrealizedPnL >= 0 ? "+" : ""}
                {formatCurrency(summary.unrealizedPnL)}
              </Text>
            </View>
          </LinearGradient>
        )}

        {/* Allocation — donut + legend */}
        {allocation.length > 0 ? (
          <Card style={{ padding: 16, marginBottom: 16 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <Text className="text-fg dark:text-fg-dark text-[15px] font-bold">
                Allocation
              </Text>
              <Text className="text-fg-muted dark:text-fg-dark-muted text-[11.5px] font-medium">
                By value
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              <Donut
                size={140}
                thickness={20}
                trackColor={dark ? Tokens.bgElevDark : Tokens.bgElev}
                slices={allocation.map((a) => ({
                  value: a.value,
                  color: TYPE_COLOR[a.type as HoldingType] ?? Tokens.brand,
                  label: a.type,
                }))}
                center={
                  <View style={{ alignItems: "center" }}>
                    <Text
                      style={{
                        fontSize: 10,
                        color: dark ? Tokens.textDimDark : Tokens.textDim,
                        fontWeight: "700",
                        letterSpacing: 1,
                      }}
                    >
                      ASSETS
                    </Text>
                    <Text
                      style={{
                        fontSize: 22,
                        color: dark ? Tokens.textDarkPrimary : Tokens.text,
                        fontWeight: "800",
                        letterSpacing: -0.5,
                        fontVariant: ["tabular-nums"],
                      }}
                    >
                      {allocation.reduce((s, a) => s + a.count, 0)}
                    </Text>
                  </View>
                }
              />
              <View style={{ flex: 1, gap: 8 }}>
                {allocation.slice(0, 5).map((a) => (
                  <View
                    key={a.type}
                    style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 99,
                        backgroundColor:
                          TYPE_COLOR[a.type as HoldingType] ?? Tokens.brand,
                      }}
                    />
                    <Text
                      className="text-fg dark:text-fg-dark text-[12.5px] font-semibold"
                      style={{ flex: 1 }}
                      numberOfLines={1}
                    >
                      {TYPE_LABEL[a.type as HoldingType] ?? a.type}
                    </Text>
                    <Text
                      className="text-fg-muted dark:text-fg-dark-muted text-[12px] font-semibold"
                      style={{ fontVariant: ["tabular-nums"] }}
                    >
                      {a.percentage.toFixed(0)}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>
        ) : null}

        {/* Holdings */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 4,
            marginBottom: 10,
          }}
        >
          <Text className="text-fg dark:text-fg-dark text-[16px] font-bold">
            Holdings
          </Text>
          <Pressable
            onPress={() => setSheetOpen(true)}
            hitSlop={6}
            android_ripple={{ color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
            style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
          >
            <Text style={{ color: Tokens.brand, fontSize: 13, fontWeight: "600" }}>
              + Add
            </Text>
            <ChevronRight size={14} color={Tokens.brand} strokeWidth={2.4} />
          </Pressable>
        </View>

        {pfLoading ? (
          <Card style={{ padding: 14, gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Skeleton width={38} height={38} radius={11} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Skeleton width="55%" height={13} />
                  <Skeleton width="35%" height={11} />
                </View>
                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  <Skeleton width={70} height={13} />
                  <Skeleton width={40} height={11} />
                </View>
              </View>
            ))}
          </Card>
        ) : holdings.length === 0 ? (
          <Card style={{ padding: 24, alignItems: "center" }}>
            <Text className="text-fg dark:text-fg-dark text-[15px] font-semibold">
              No investments yet
            </Text>
            <Text className="text-fg-muted dark:text-fg-dark-muted text-[12px] text-center mt-1">
              Tap + Add to record your first stock, MF, or crypto position.
            </Text>
          </Card>
        ) : (
          <Card style={{ paddingHorizontal: 0, paddingVertical: 0, overflow: "hidden" }}>
            {holdings.map((h, i) => (
              <HoldingRow
                key={h._id}
                holding={h}
                dark={dark}
                last={i === holdings.length - 1}
              />
            ))}
          </Card>
        )}
      </ScrollView>

      <AddInvestmentSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </SafeAreaView>
  );
}

function HoldingRow({
  holding,
  dark,
  last,
}: {
  holding: HoldingDoc;
  dark: boolean;
  last: boolean;
}) {
  const color = TYPE_COLOR[holding.type] ?? Tokens.brand;
  const symbol = holding.symbol || holding.name;
  const mono = symbol.slice(0, 3).toUpperCase();
  const value = holding.quantity * holding.currentPrice;
  const invested = holding.quantity * holding.avgCostPrice;
  const pct = invested > 0 ? ((value - invested) / invested) * 100 : 0;
  const up = pct >= 0;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: dark ? Tokens.borderDark : Tokens.border,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: tint(color, dark ? 0.22 : 0.12),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color,
            fontSize: 11,
            fontWeight: "800",
            letterSpacing: 0.4,
          }}
        >
          {mono}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          className="text-fg dark:text-fg-dark text-[13.5px] font-semibold"
        >
          {holding.name}
        </Text>
        <Text
          className="text-fg-muted dark:text-fg-dark-muted text-[11.5px] mt-0.5"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {holding.quantity} units · {formatCurrency(holding.currentPrice)}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Money
          value={value}
          className="text-fg dark:text-fg-dark text-[14px] font-bold"
        />
        <Text
          style={{
            fontSize: 11,
            marginTop: 2,
            color: up ? Tokens.emerald : Tokens.rose,
            fontWeight: "700",
            fontVariant: ["tabular-nums"],
          }}
        >
          {up ? "+" : ""}
          {pct.toFixed(1)}%
        </Text>
      </View>
    </View>
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
