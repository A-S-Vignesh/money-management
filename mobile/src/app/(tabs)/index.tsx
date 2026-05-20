// app/(tabs)/index.tsx — Dashboard
// 1:1 port of the Mobile UI mock with blue brand accent. Composes the
// primitives in src/components/ui so future screens stay consistent.

import { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  Eye,
  EyeOff,
  Plus,
  Send,
  Target,
  TrendingUp,
} from "lucide-react-native";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Tokens } from "@/lib/design";
import { formatCurrency } from "@/lib/format";
import { useDrawer, useTransactionSheet } from "@/lib/stores";
import { getCategoryPalette } from "@money-nest/shared";

import { Card } from "@/components/ui/Card";
import { Donut } from "@/components/ui/Donut";
import { IconTile } from "@/components/ui/IconTile";
import { MetricCard } from "@/components/ui/MetricCard";
import { Money } from "@/components/ui/Money";
import { Section } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/Skeleton";
import { Sparkline } from "@/components/ui/Sparkline";
import { TopHeader } from "@/components/ui/TopHeader";
import { TxRow } from "@/components/ui/TxRow";
import { TxDetailSheet } from "@/components/transactions/TxDetailSheet";
import type { TransactionDoc } from "@/hooks/useTransactions";

interface DashboardPayload {
  totalBalance?: number;
  monthIncome?: number;
  monthExpense?: number;
  monthNet?: number;
  incomeChange?: number | string | null;
  expenseChange?: number | string | null;
  savingsRate?: string | number | null;
  monthLabel?: string;
  categoryBreakdown?: Array<{
    category: string;
    amount: number;
    percentage: string | number;
  }>;
  monthlyTrend?: Array<{
    day: number;
    income: number;
    expense: number;
    net: number | null;
  }>;
  recentTransactions?: Array<{
    _id: string;
    description: string;
    category: string;
    amount: number;
    type: "income" | "expense" | "transfer";
    date: string;
  }>;
  totalGoals?: number;
  activeBudgets?: number;
}

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardScreen() {
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const screenWidth = Dimensions.get("window").width;

  // AddTransactionSheet is mounted globally in (tabs)/_layout — we just
  // open it via the store. TxDetailSheet stays local because it carries a
  // specific transaction (per-screen state is fine here).
  const openAdd = useTransactionSheet((s) => s.openAdd);
  const openEdit = useTransactionSheet((s) => s.openEdit);
  const openDrawer = useDrawer((s) => s.toggle);

  const [detailTx, setDetailTx] = useState<TransactionDoc | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const openDetail = (tx: TransactionDoc) => {
    setDetailTx(tx);
    setShowDetail(true);
  };
  const closeDetail = () => setShowDetail(false);
  const startEditFromDetail = (tx: TransactionDoc) => {
    setShowDetail(false);
    setTimeout(() => openEdit(tx), 280);
  };

  const { data, isLoading, isRefetching, refetch } = useQuery<DashboardPayload>({
    queryKey: ["dashboard"],
    queryFn: () => api<DashboardPayload>("/api/dashboard"),
  });

  const onRefresh = useCallback(() => refetch(), [refetch]);

  // ── Donut data: top 5 expense categories from breakdown ─────────
  const donut = useMemo(() => {
    const breakdown = data?.categoryBreakdown ?? [];
    return breakdown.slice(0, 5).map((b) => ({
      value: b.amount,
      color: getCategoryPalette(b.category).accent,
      label: b.category,
      pct: Number(b.percentage),
    }));
  }, [data?.categoryBreakdown]);

  // ── Sparkline data: cumulative net flow over month ──────────────
  const sparkValues = useMemo(() => {
    const trend = data?.monthlyTrend ?? [];
    const out: number[] = [];
    let net = 0;
    for (const row of trend) {
      if (row.net == null) break;
      net = row.net;
      out.push(net);
    }
    return out;
  }, [data?.monthlyTrend]);

  const recent = data?.recentTransactions ?? [];
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const greet = `${greetingFor(new Date().getHours())}, ${firstName}`;

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-surface-muted dark:bg-surface-dark-elev"
    >
      {/* Fixed top bar — stays put as the page below scrolls so the
          hamburger is always one tap away. */}
      <View style={{ paddingHorizontal: 16 }}>
        <TopHeader
          title="Money Nest"
          subtitle={greet}
          unread={2}
          onBell={() => router.push("/(tabs)/profile")}
          onMenu={openDrawer}
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
        {/* Hero net-worth card with blue→deep-blue gradient */}
        <LinearGradient
          colors={[Tokens.brand, Tokens.brand3]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 28,
            padding: 22,
            marginBottom: 16,
            marginTop: 4,
            shadowColor: Tokens.brand,
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: 0.4,
            shadowRadius: 28,
            elevation: 10,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              className="text-[10.5px] font-bold uppercase"
              style={{
                color: "rgba(255,255,255,0.7)",
                letterSpacing: 1.2,
              }}
            >
              Total balance
            </Text>
            <Pressable
              onPress={() => setHidden((v) => !v)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 99,
                backgroundColor: "rgba(255,255,255,0.12)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {hidden ? (
                <EyeOff size={14} color="#fff" strokeWidth={2} />
              ) : (
                <Eye size={14} color="#fff" strokeWidth={2} />
              )}
            </Pressable>
          </View>

          {isLoading ? (
            <View style={{ marginTop: 8 }}>
              <Skeleton width={220} height={36} radius={6} />
            </View>
          ) : hidden ? (
            <Text
              className="text-white text-[36px] font-bold mt-2"
              style={{ letterSpacing: -1.2 }}
            >
              •••••••
            </Text>
          ) : (
            <Money
              value={data?.totalBalance ?? 0}
              className="text-white text-[36px] font-bold mt-2"
              style={{ letterSpacing: -1.2 }}
            />
          )}

          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginTop: 14,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: "column", gap: 6 }}>
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.16)",
                  borderRadius: 99,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  alignSelf: "flex-start",
                }}
              >
                <TrendingUp size={11} color="#fff" strokeWidth={2.5} />
                <Text
                  className="text-white text-[11px] font-bold"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  +{formatCurrency(data?.monthNet ?? 0, { compact: true })} this
                  month
                </Text>
              </View>
              <Text
                style={{
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 11.5,
                  fontWeight: "500",
                }}
              >
                {data?.savingsRate != null ? `${data.savingsRate}% saved · ` : ""}
                {data?.monthLabel ?? ""}
              </Text>
            </View>
            {!isLoading && sparkValues.length > 1 ? (
              <Sparkline
                values={sparkValues}
                width={110}
                height={38}
                stroke="#ffffff"
                gradientId="hero-spark"
                gradientColor="#ffffff"
              />
            ) : null}
          </View>
        </LinearGradient>

        {/* Quick actions */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 18 }}>
          {(
            [
              { l: "Add", Icon: Plus, tone: "brand", onPress: () => openAdd("expense") },
              { l: "Income", Icon: Send, tone: "emerald", onPress: () => openAdd("income") },
              { l: "Transfer", Icon: TrendingUp, tone: "amber", onPress: () => openAdd("transfer") },
              { l: "More", Icon: Target, tone: "purple", onPress: () => router.push("/(tabs)/transactions") },
            ] as const
          ).map((a, i) => (
            <Pressable
              key={i}
              onPress={a.onPress}
              style={{
                flex: 1,
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <IconTile Icon={a.Icon} tone={a.tone} size="lg" />
              <Text className="text-fg dark:text-fg-dark text-[11.5px] font-semibold">
                {a.l}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Income / Expense pair */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
          <MetricCard
            label="Income"
            value={formatCurrency(data?.monthIncome ?? 0)}
            Icon={ArrowDownLeft}
            tone="emerald"
            delta={
              data?.incomeChange != null
                ? Number(data.incomeChange)
                : null
            }
            deltaUp={Number(data?.incomeChange ?? 0) >= 0}
          />
          <MetricCard
            label="Expense"
            value={formatCurrency(data?.monthExpense ?? 0)}
            Icon={ArrowUpRight}
            tone="rose"
            delta={
              data?.expenseChange != null
                ? Math.abs(Number(data.expenseChange))
                : null
            }
            deltaUp={Number(data?.expenseChange ?? 0) < 0}
          />
        </View>

        {/* Spending breakdown */}
        <Card style={{ padding: 16, marginBottom: 16 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 4,
            }}
          >
            <View>
              <Text className="text-fg dark:text-fg-dark text-[16px] font-semibold tracking-tight">
                Spending breakdown
              </Text>
              <Text className="text-fg-muted dark:text-fg-dark-muted text-[11.5px] mt-0.5">
                Top categories · {data?.monthLabel ?? "this month"}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/(tabs)/reports")}
              style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
            >
              <Text className="text-brand text-[13px] font-semibold">Details</Text>
              <ChevronRight size={13} color={Tokens.brand} strokeWidth={2.4} />
            </Pressable>
          </View>

          {isLoading ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
                marginTop: 10,
              }}
            >
              <Skeleton width={130} height={130} radius={65} />
              <View style={{ flex: 1, gap: 8 }}>
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} width="100%" height={14} />
                ))}
              </View>
            </View>
          ) : donut.length === 0 ? (
            <Text className="text-fg-muted dark:text-fg-dark-muted text-[13px] text-center py-8">
              No spending yet — add an expense to see your breakdown.
            </Text>
          ) : (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
                marginTop: 10,
              }}
            >
              <Donut
                slices={donut}
                size={130}
                thickness={20}
                center={
                  <>
                    <Text
                      className="text-fg-muted dark:text-fg-dark-muted text-[10px] font-semibold uppercase"
                      style={{ letterSpacing: 0.5 }}
                    >
                      Total
                    </Text>
                    <Money
                      value={data?.monthExpense ?? 0}
                      className="text-fg dark:text-fg-dark text-[14px] font-bold mt-0.5"
                    />
                  </>
                }
              />
              <View style={{ flex: 1, gap: 8 }}>
                {donut.map((s) => (
                  <View
                    key={s.label}
                    style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 99,
                        backgroundColor: s.color,
                      }}
                    />
                    <Text
                      numberOfLines={1}
                      className="text-fg dark:text-fg-dark text-[12px] font-medium"
                      style={{ flex: 1 }}
                    >
                      {s.label}
                    </Text>
                    <Text
                      className="text-fg-muted dark:text-fg-dark-muted text-[11.5px] font-semibold"
                      style={{ fontVariant: ["tabular-nums"] }}
                    >
                      {s.pct}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Card>

        {/* Recent activity */}
        <Section
          title="Recent activity"
          action="See all"
          onAction={() => router.push("/(tabs)/transactions")}
        >
          <Card style={{ padding: 0, overflow: "hidden" }}>
            {isLoading ? (
              <View style={{ padding: 16, gap: 14 }}>
                {[1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
                  >
                    <Skeleton width={38} height={38} radius={12} />
                    <View style={{ flex: 1, gap: 6 }}>
                      <Skeleton width="60%" height={14} />
                      <Skeleton width="40%" height={11} />
                    </View>
                    <Skeleton width={70} height={16} />
                  </View>
                ))}
              </View>
            ) : recent.length === 0 ? (
              <Text className="text-fg-muted dark:text-fg-dark-muted text-[13px] text-center py-12">
                Nothing yet. Add your first transaction.
              </Text>
            ) : (
              recent.slice(0, 6).map((tx, i) => (
                <TxRow
                  key={tx._id}
                  tx={tx as TransactionDoc}
                  last={i === Math.min(recent.length, 6) - 1}
                  onPress={() => openDetail(tx as TransactionDoc)}
                />
              ))
            )}
          </Card>
        </Section>
      </ScrollView>

      {/* TxDetailSheet stays local — it carries a transaction selected
          from this screen's recent activity list. AddTransactionSheet is
          mounted globally in (tabs)/_layout. */}
      <TxDetailSheet
        visible={showDetail}
        onClose={closeDetail}
        transaction={detailTx}
        onEdit={startEditFromDetail}
      />
    </SafeAreaView>
  );
}
